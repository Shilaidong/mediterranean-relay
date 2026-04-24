import { jsonError, jsonOk } from '@/lib/http';
import { rankAssistCandidates } from '@/lib/assist';
import { hasSupabasePublicEnv } from '@/lib/env';
import { searchMusicBrainzCandidates } from '@/lib/musicbrainz';
import { getServerSupabase } from '@/lib/supabase/server';
import {
  buildAssistDiagnostics,
  mergeRerankedCandidates,
  runMiniMaxRerank,
  runVisionExtraction,
} from '@/lib/listing-assist-pipeline';

function normalize(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function chooseExternalSearchText(input: {
  typedTitle?: string;
  typedArtist?: string;
  visionTitle?: string | null;
  visionArtist?: string | null;
}) {
  const typedTitle = input.typedTitle?.trim() || '';
  const typedArtist = input.typedArtist?.trim() || '';
  const visionTitle = input.visionTitle?.trim() || '';
  const visionArtist = input.visionArtist?.trim() || '';

  const normalizedTypedTitle = normalize(typedTitle);
  const normalizedTypedArtist = normalize(typedArtist);
  const normalizedVisionTitle = normalize(visionTitle);
  const normalizedVisionArtist = normalize(visionArtist);

  let resolvedTitle = typedTitle || visionTitle;
  let resolvedArtist = typedArtist || visionArtist;

  if (visionTitle) {
    resolvedTitle = visionTitle;
  }
  if (visionArtist) {
    resolvedArtist = visionArtist;
  }

  if (
    typedTitle &&
    normalizedVisionTitle &&
    normalizedVisionArtist &&
    normalizedTypedTitle.includes(normalizedVisionTitle) &&
    normalizedTypedTitle.includes(normalizedVisionArtist)
  ) {
    resolvedTitle = visionTitle;
    resolvedArtist = visionArtist || resolvedArtist;
  }

  if (!resolvedArtist && typedArtist && !normalizedTypedTitle.includes(normalizedTypedArtist)) {
    resolvedArtist = typedArtist;
  }

  return {
    title: resolvedTitle || undefined,
    artist: resolvedArtist || undefined,
  };
}

function isReliableCandidate(
  candidate: { title: string; artist: string; confidence: number; matrixCodes: string[] },
  input: {
    title?: string;
    artist?: string;
    matrixCode?: string;
    visionTitle?: string | null;
    visionArtist?: string | null;
    visionMatrixCodes?: string[];
  },
) {
  const titleSignals = [input.title, input.visionTitle].map(normalize).filter(Boolean);
  const artistSignals = [input.artist, input.visionArtist].map(normalize).filter(Boolean);
  const matrixSignals = [input.matrixCode, ...(input.visionMatrixCodes ?? [])]
    .map(normalize)
    .filter(Boolean);

  const titleAligned = titleSignals.some(
    (signal) => candidate.title.toLowerCase().includes(signal) || signal.includes(candidate.title.toLowerCase()),
  );
  const artistAligned =
    artistSignals.length === 0 ||
    artistSignals.some(
      (signal) =>
        candidate.artist.toLowerCase().includes(signal) || signal.includes(candidate.artist.toLowerCase()),
    );
  const matrixAligned =
    matrixSignals.length > 0 &&
    matrixSignals.some((signal) => candidate.matrixCodes.some((code) => code.toLowerCase() === signal));

  if (matrixAligned) {
    return true;
  }

  if (titleAligned && artistAligned && candidate.confidence >= 0.4) {
    return true;
  }

  return false;
}

export async function POST(request: Request) {
  if (!hasSupabasePublicEnv()) {
    return jsonError('Supabase environment is not configured yet.', 503);
  }

  const body = (await request.json()) as {
    matrixCode?: string;
    title?: string;
    artist?: string;
    imageDataUrl?: string;
  };

  const supabase = await getServerSupabase();
  const { data, error } = await supabase
    .from('catalog_releases')
    .select(
      'id, slug, title, artist, year, genre, cover_url, rarity, suggested_price_min, suggested_price_max, matrix_codes',
    )
    .order('rarity', { ascending: false })
    .limit(50);

  if (error) {
    return jsonError(error.message, 500);
  }

  const vision = body.imageDataUrl
    ? await runVisionExtraction({
        imageUrl: body.imageDataUrl,
        matrixCode: body.matrixCode,
        title: body.title,
        artist: body.artist,
      }).catch(() => null)
    : null;

  const localCandidates = rankAssistCandidates(data ?? [], {
    matrixCode: body.matrixCode,
    matrixCodes: vision?.matrixCodes ?? [],
    title: body.title,
    titles: [
      ...(vision?.albumTitle ? [vision.albumTitle] : []),
      ...(vision?.visibleText ?? []).slice(0, 3),
    ],
    artist: body.artist,
    artists: vision?.artist ? [vision.artist] : [],
  });

  let candidates = localCandidates;
  let reranked = null;
  if (localCandidates.length) {
    reranked = await runMiniMaxRerank({
      userInput: {
        matrixCode: body.matrixCode,
        title: body.title,
        artist: body.artist,
      },
      vision,
      candidates: localCandidates,
    }).catch(() => null);
    candidates = mergeRerankedCandidates(localCandidates, reranked);
  }

  const reliableCandidates = candidates.filter((candidate) =>
    isReliableCandidate(candidate, {
      title: body.title,
      artist: body.artist,
      matrixCode: body.matrixCode,
      visionTitle: vision?.albumTitle,
      visionArtist: vision?.artist,
      visionMatrixCodes: vision?.matrixCodes,
    }),
  );

  const matched = reliableCandidates.length > 0;
  let finalCandidates = reliableCandidates;
  let diagnostics = buildAssistDiagnostics({
    vision,
    reranked,
    matched,
  });

  if (!matched) {
    const externalSearch = chooseExternalSearchText({
      typedTitle: body.title,
      typedArtist: body.artist,
      visionTitle: vision?.albumTitle,
      visionArtist: vision?.artist,
    });

    const externalCandidates = await searchMusicBrainzCandidates({
      title: externalSearch.title,
      artist: externalSearch.artist,
      barcode: body.matrixCode || vision?.matrixCodes?.[0] || undefined,
      limit: 5,
    }).catch(() => []);

    if (externalCandidates.length) {
      let externalReranked = null;
      let orderedExternalCandidates = externalCandidates;

      externalReranked = await runMiniMaxRerank({
        userInput: {
          matrixCode: body.matrixCode,
          title: body.title,
          artist: body.artist,
        },
        vision,
        candidates: externalCandidates,
      }).catch(() => null);

      if (externalReranked) {
        orderedExternalCandidates = mergeRerankedCandidates(externalCandidates, externalReranked);
      }

      const reliableExternalCandidates = orderedExternalCandidates.filter((candidate) =>
        isReliableCandidate(candidate, {
          title: body.title,
          artist: body.artist,
          matrixCode: body.matrixCode,
          visionTitle: vision?.albumTitle,
          visionArtist: vision?.artist,
          visionMatrixCodes: vision?.matrixCodes,
        }),
      );

      if (reliableExternalCandidates.length) {
        finalCandidates = reliableExternalCandidates;
        diagnostics = buildAssistDiagnostics({
          vision,
          reranked: externalReranked,
          matched: true,
        });
        diagnostics.summary =
          diagnostics.summary ??
          '当前本地目录库没有可靠匹配，已切换到 MusicBrainz 外部目录匹配。';
      }
    }
  }

  if (!finalCandidates.length) {
    diagnostics.summary =
      diagnostics.summary ??
      '当前目录库里没有找到可靠匹配。你可以确认识别结果后，手动创建这个专辑条目再继续上架。';
  }

  return jsonOk({
    candidates: finalCandidates,
    diagnostics,
  });
}
