import type { AssistCandidate, Genre } from '@/lib/types';

const MUSICBRAINZ_USER_AGENT = 'MediterraneanRelay/0.2.0 ( catalog matching prototype )';
const MUSICBRAINZ_BASE_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_ARCHIVE_BASE_URL = 'https://coverartarchive.org';

interface MusicBrainzRelease {
  id: string;
  title?: string;
  date?: string;
  barcode?: string | null;
  score?: number | string;
  'artist-credit'?: Array<{
    name?: string;
    artist?: { name?: string };
  }>;
}

function normalize(value: string | null | undefined) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function parseYear(value: string | undefined) {
  const match = value?.match(/\d{4}/);
  return match ? Number(match[0]) : new Date().getFullYear();
}

function inferGenre(title: string, artist: string): Genre {
  const haystack = `${title} ${artist}`.toLowerCase();
  if (/(coltrane|miles davis|blakey|monk|jazz|blue note)/.test(haystack)) {
    return 'Jazz';
  }
  if (/(marvin|aretha|soul|motown|temptations|gaye)/.test(haystack)) {
    return 'Soul';
  }
  if (/(bach|mozart|beethoven|classical|symphony)/.test(haystack)) {
    return 'Classical';
  }
  if (/(folk|dylan|joan baez|joni mitchell)/.test(haystack)) {
    return 'Folk';
  }
  return 'Rock';
}

function buildReleaseArtist(release: MusicBrainzRelease) {
  const credits = release['artist-credit'] ?? [];
  return credits
    .map((entry) => entry.name ?? entry.artist?.name ?? '')
    .map((value) => value.trim())
    .filter(Boolean)
    .join(', ');
}

function computeConfidence(input: {
  title?: string;
  artist?: string;
  barcode?: string;
  candidateTitle: string;
  candidateArtist: string;
  candidateBarcode?: string | null;
  score?: string | number;
}) {
  let confidence = 0.42;
  const normalizedTitle = normalize(input.title);
  const normalizedArtist = normalize(input.artist);
  const normalizedBarcode = normalize(input.barcode);
  const candidateTitle = normalize(input.candidateTitle);
  const candidateArtist = normalize(input.candidateArtist);
  const candidateBarcode = normalize(input.candidateBarcode);

  if (normalizedBarcode && candidateBarcode && normalizedBarcode === candidateBarcode) {
    confidence += 0.3;
  }
  if (normalizedTitle && (candidateTitle.includes(normalizedTitle) || normalizedTitle.includes(candidateTitle))) {
    confidence += 0.2;
  }
  if (
    normalizedArtist &&
    (candidateArtist.includes(normalizedArtist) || normalizedArtist.includes(candidateArtist))
  ) {
    confidence += 0.16;
  }

  const score = typeof input.score === 'string' ? Number(input.score) : input.score;
  if (typeof score === 'number' && !Number.isNaN(score)) {
    confidence += Math.min(score / 1000, 0.2);
  }

  return Number(Math.min(confidence, 0.95).toFixed(2));
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': MUSICBRAINZ_USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`MusicBrainz request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchCoverUrl(mbid: string) {
  const response = await fetch(`${COVER_ART_ARCHIVE_BASE_URL}/release/${mbid}`, {
    headers: {
      'User-Agent': MUSICBRAINZ_USER_AGENT,
      Accept: 'application/json',
    },
  }).catch(() => null);

  if (!response?.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    images?: Array<{
      front?: boolean;
      image?: string;
      thumbnails?: {
        large?: string;
        small?: string;
        250?: string;
      };
    }>;
  };

  const frontImage =
    payload.images?.find((image) => image.front) ??
    payload.images?.[0];

  return (
    frontImage?.thumbnails?.large?.replace('http://', 'https://') ??
    frontImage?.thumbnails?.['250']?.replace('http://', 'https://') ??
    frontImage?.thumbnails?.small?.replace('http://', 'https://') ??
    frontImage?.image?.replace('http://', 'https://') ??
    null
  );
}

export async function searchMusicBrainzCandidates(input: {
  title?: string;
  artist?: string;
  barcode?: string;
  limit?: number;
}) {
  const queryParts: string[] = [];
  if (input.barcode?.trim()) {
    queryParts.push(`barcode:${input.barcode.trim()}`);
  }
  if (input.title?.trim()) {
    queryParts.push(`release:${JSON.stringify(input.title.trim())}`);
  }
  if (input.artist?.trim()) {
    queryParts.push(`artist:${JSON.stringify(input.artist.trim())}`);
  }

  if (queryParts.length === 0) {
    return [] as AssistCandidate[];
  }

  const query = queryParts.join(' AND ');
  const payload = await fetchJson<{ releases?: MusicBrainzRelease[] }>(
    `${MUSICBRAINZ_BASE_URL}/release?fmt=json&limit=${input.limit ?? 5}&query=${encodeURIComponent(query)}`,
  );

  const releases = payload.releases ?? [];
  const coverUrls = await Promise.all(releases.map((release) => fetchCoverUrl(release.id)));

  return releases.map<AssistCandidate>((release, index) => {
    const title = release.title?.trim() || 'Untitled Release';
    const artist = buildReleaseArtist(release) || input.artist?.trim() || 'Unknown Artist';
    const barcode = release.barcode?.trim() || null;

    return {
      releaseId: `mb:${release.id}`,
      slug: `musicbrainz-${release.id}`,
      title,
      artist,
      year: parseYear(release.date),
      genre: inferGenre(title, artist),
      confidence: computeConfidence({
        title: input.title,
        artist: input.artist,
        barcode: input.barcode,
        candidateTitle: title,
        candidateArtist: artist,
        candidateBarcode: barcode,
        score: release.score,
      }),
      reasoning: barcode
        ? `Matched from MusicBrainz with barcode ${barcode}`
        : 'Matched from MusicBrainz release search',
      suggestedPriceMin: null,
      suggestedPriceMax: null,
      matrixCodes: barcode ? [barcode] : [],
      coverUrl: coverUrls[index],
      catalogSource: 'musicbrainz',
    };
  });
}
