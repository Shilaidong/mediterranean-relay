import type { AssistCandidate, AssistDiagnostics, VisionExtraction } from '@/lib/types';
import {
  getBigModelApiKey,
  getBigModelApiUrl,
  getBigModelVisionModel,
  getMiniMaxApiKey,
  getMiniMaxApiUrl,
  getMiniMaxModel,
  hasListingAiEnv,
} from '@/lib/env';

interface CatalogReleaseRow {
  id: string;
  slug: string;
  title: string;
  artist: string;
  year: number;
  genre: AssistCandidate['genre'];
  cover_url: string | null;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  matrix_codes: string[] | null;
}

interface MiniMaxRecommendation {
  releaseId: string;
  confidence: number;
  reasoning: string;
}

interface MiniMaxRankingResult {
  recommendations: MiniMaxRecommendation[];
  summary: string | null;
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(
  input: RequestInfo | URL,
  init: RequestInit,
  options: {
    retries?: number;
    retryOn?: number[];
    baseDelayMs?: number;
  } = {},
) {
  const retries = options.retries ?? 2;
  const retryOn = options.retryOn ?? [429, 500, 502, 503, 504];
  const baseDelayMs = options.baseDelayMs ?? 1200;

  let lastResponse: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(input, init);
    if (response.ok) {
      return response.json();
    }

    lastResponse = response;
    if (attempt === retries || !retryOn.includes(response.status)) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Upstream model request failed with ${response.status}${errorText ? `: ${errorText}` : ''}`,
      );
    }

    await wait(baseDelayMs * (attempt + 1));
  }

  throw new Error(`Upstream model request failed with ${lastResponse?.status ?? 'unknown status'}`);
}

function extractJsonBlock(raw: string) {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;
  const first = candidate.indexOf('{');
  const last = candidate.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('JSON block not found in model response.');
  }
  return candidate.slice(first, last + 1);
}

function asStringArray(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function clampConfidence(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function extractMatrixCodesFromText(values: string[]) {
  const matches = new Set<string>();
  const pattern = /\b[A-Z0-9]{2,}(?:[-/][A-Z0-9]{1,})+\b/gi;

  for (const value of values) {
    for (const match of value.match(pattern) ?? []) {
      matches.add(match.toUpperCase());
    }
  }

  return Array.from(matches);
}

function normalizeVisionExtraction(payload: unknown): VisionExtraction | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const visibleText = asStringArray(record.visibleText).map((value) => value.trim()).filter(Boolean);
  const notes = asStringArray(record.notes).map((value) => value.trim()).filter(Boolean);
  const matrixCodes = asStringArray(record.matrixCodes).map((value) => value.trim()).filter(Boolean);

  return {
    albumTitle: typeof record.albumTitle === 'string' ? record.albumTitle.trim() || null : null,
    artist: typeof record.artist === 'string' ? record.artist.trim() || null : null,
    year: typeof record.year === 'string' ? record.year.trim() || null : null,
    matrixCodes:
      matrixCodes.length > 0 ? matrixCodes : extractMatrixCodesFromText([...visibleText, ...notes]),
    visibleText,
    notes,
    confidence: clampConfidence(
      typeof record.confidence === 'number' ? record.confidence : Number(record.confidence),
    ),
  };
}

export async function runVisionExtraction(input: {
  imageUrl: string;
  matrixCode?: string;
  title?: string;
  artist?: string;
}) {
  if (!hasListingAiEnv()) {
    return null;
  }

  const payload = await fetchJsonWithRetry(getBigModelApiUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getBigModelApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getBigModelVisionModel(),
      stream: false,
      max_tokens: 1200,
      temperature: 0.1,
      thinking: {
        type: 'disabled',
      },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `你在帮一个黑胶上架流程做视觉识别。请只返回 JSON，不要额外解释。

请根据图片和用户提供的线索，提取可能有帮助的字段，输出格式必须为：
{
  "albumTitle": "字符串或空字符串",
  "artist": "字符串或空字符串",
  "year": "字符串或空字符串",
  "matrixCodes": ["可能识别到的矩阵码"],
  "visibleText": ["图片中能看清的文字"],
  "notes": ["关于封面、标签、脊背、可见特征的简短说明"],
  "confidence": 0 到 1 之间的小数
}

用户文本线索：
- matrixCode: ${input.matrixCode?.trim() || '无'}
- title: ${input.title?.trim() || '无'}
- artist: ${input.artist?.trim() || '无'}

如果图片里看不出来，不要编造，留空即可。`,
            },
            {
              type: 'image_url',
              image_url: {
                url: input.imageUrl,
              },
            },
          ],
        },
      ],
    }),
  });
  const rawContent = payload.choices?.[0]?.message?.content;
  if (typeof rawContent !== 'string') {
    throw new Error('Vision model returned empty content.');
  }

  return normalizeVisionExtraction(JSON.parse(extractJsonBlock(rawContent)));
}

export async function runMiniMaxRerank(input: {
  userInput: { matrixCode?: string; title?: string; artist?: string };
  vision: VisionExtraction | null;
  candidates: AssistCandidate[];
}) {
  if (!hasListingAiEnv()) {
    return null;
  }

  const endpoint = `${getMiniMaxApiUrl().replace(/\/$/, '')}/v1/messages`;
  const payload = await fetchJsonWithRetry(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getMiniMaxApiKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: getMiniMaxModel(),
      max_tokens: 1200,
      temperature: 0.2,
      system:
        'You are a vinyl release matching assistant. Rank only from the provided candidates. Return strict JSON only.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  task: 'Choose the best matching catalog releases for a vinyl listing.',
                  userInput: input.userInput,
                  vision: input.vision,
                  candidates: input.candidates.map((candidate) => ({
                    releaseId: candidate.releaseId,
                    title: candidate.title,
                    artist: candidate.artist,
                    year: candidate.year,
                    genre: candidate.genre,
                    matrixCodes: candidate.matrixCodes,
                    confidence: candidate.confidence,
                    reasoning: candidate.reasoning,
                  })),
                  outputFormat: {
                    recommendations: [
                      {
                        releaseId: 'candidate releaseId',
                        confidence: '0-1 number',
                        reasoning: 'short string',
                      },
                    ],
                    summary: 'one sentence summary',
                  },
                },
                null,
                2,
              ),
            },
          ],
        },
      ],
    }),
  });
  const blocks = payload.content;
  const textBlock = Array.isArray(blocks)
    ? blocks.find((block: { type?: string; text?: string }) => block?.type === 'text')
    : null;
  const rawText = typeof textBlock?.text === 'string' ? textBlock.text : '';
  if (!rawText) {
    throw new Error('MiniMax returned empty content.');
  }

  const parsed = JSON.parse(extractJsonBlock(rawText)) as MiniMaxRankingResult;
  return {
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .filter(
            (entry): entry is MiniMaxRecommendation =>
              Boolean(entry) &&
              typeof entry.releaseId === 'string' &&
              typeof entry.reasoning === 'string',
          )
          .map((entry) => ({
            releaseId: entry.releaseId,
            confidence: clampConfidence(entry.confidence) ?? 0.5,
            reasoning: entry.reasoning,
          }))
      : [],
    summary: typeof parsed.summary === 'string' ? parsed.summary : null,
  };
}

export function mergeRerankedCandidates(
  localCandidates: AssistCandidate[],
  reranked: MiniMaxRankingResult | null,
) {
  if (!reranked?.recommendations.length) {
    return localCandidates;
  }

  const localMap = new Map(localCandidates.map((candidate) => [candidate.releaseId, candidate]));
  const ordered: AssistCandidate[] = [];

  for (const recommendation of reranked.recommendations) {
    const candidate = localMap.get(recommendation.releaseId);
    if (!candidate) {
      continue;
    }
    ordered.push({
      ...candidate,
      confidence: Number(
        ((candidate.confidence * 0.4 + recommendation.confidence * 0.6) || candidate.confidence).toFixed(2),
      ),
      reasoning: `${recommendation.reasoning} · ${candidate.reasoning}`,
    });
    localMap.delete(recommendation.releaseId);
  }

  return [...ordered, ...Array.from(localMap.values())].slice(0, 3);
}

export function buildAssistDiagnostics(input: {
  vision: VisionExtraction | null;
  reranked: MiniMaxRankingResult | null;
  matched: boolean;
}): AssistDiagnostics {
  if (input.vision && input.reranked) {
    return {
      mode: 'vision+llm',
      vision: input.vision,
      summary: input.reranked.summary,
      matched: input.matched,
    };
  }

  if (input.vision) {
    return {
      mode: 'vision+rules',
      vision: input.vision,
      summary: '视觉模型已参与识别，候选排序由本地规则完成。',
      matched: input.matched,
    };
  }

  if (input.reranked) {
    return {
      mode: 'llm',
      vision: null,
      summary: input.reranked.summary,
      matched: input.matched,
    };
  }

  return {
    mode: 'rules',
    vision: null,
    summary: '当前使用目录检索与本地规则匹配。',
    matched: input.matched,
  };
}
