import type { AssistCandidate } from '@/lib/types';

interface ReleaseRow {
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

function includesValue(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function rankAssistCandidates(
  releases: ReleaseRow[],
  query: {
    matrixCode?: string;
    matrixCodes?: string[];
    title?: string;
    titles?: string[];
    artist?: string;
    artists?: string[];
  },
) {
  const matrixCodes = [
    query.matrixCode?.trim(),
    ...(query.matrixCodes ?? []).map((value) => value.trim()),
  ].filter(Boolean) as string[];
  const titles = [
    query.title?.trim(),
    ...(query.titles ?? []).map((value) => value.trim()),
  ].filter(Boolean) as string[];
  const artists = [
    query.artist?.trim(),
    ...(query.artists ?? []).map((value) => value.trim()),
  ].filter(Boolean) as string[];

  const ranked = releases
    .map<AssistCandidate>((release) => {
      let confidence = 0.24;
      const reasons: string[] = [];

      const releaseCodes = release.matrix_codes ?? [];
      const matrixMatches = matrixCodes.filter((needle) =>
        releaseCodes.some((code) => code.toLowerCase() === needle.toLowerCase()),
      );
      if (matrixMatches.length) {
        confidence += 0.45;
        reasons.push(
          matrixMatches.length > 1
            ? `Matched ${matrixMatches.length} matrix codes`
            : 'Matched matrix code',
        );
      }

      const titleMatches = titles.filter((needle) => includesValue(release.title, needle));
      if (titleMatches.length) {
        confidence += 0.18;
        reasons.push(titleMatches.length > 1 ? 'Multiple title alignments' : 'Title alignment');
      }

      const artistMatches = artists.filter((needle) => includesValue(release.artist, needle));
      if (artistMatches.length) {
        confidence += 0.18;
        reasons.push(
          artistMatches.length > 1 ? 'Multiple artist alignments' : 'Artist alignment',
        );
      }

      if (!matrixCodes.length && !titles.length && !artists.length) {
        confidence += 0.08;
      }

      return {
        releaseId: release.id,
        slug: release.slug,
        catalogSource: 'relay',
        title: release.title,
        artist: release.artist,
        year: release.year,
        genre: release.genre,
        confidence: Number(Math.min(confidence, 0.96).toFixed(2)),
        reasoning: reasons.join(' · ') || 'Suggested from catalog baseline',
        suggestedPriceMin: release.suggested_price_min,
        suggestedPriceMax: release.suggested_price_max,
        matrixCodes: release.matrix_codes ?? [],
        coverUrl: release.cover_url,
      };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  return ranked;
}
