export type Genre = 'Jazz' | 'Rock' | 'Folk' | 'Soul' | 'Classical';

export interface AppProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  credits: number;
  created_at: string;
}

export interface ListingSummary {
  id: string;
  source?: 'relay' | 'system';
  headline: string | null;
  description?: string | null;
  askingPrice: number;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
  coverPhotoUrl: string | null;
  seller: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  release: {
    id: string;
    slug: string;
    title: string;
    artist: string;
    year: number;
    genre: Genre;
    rarity: number;
    coverUrl: string | null;
    suggestedPriceMin: number | null;
    suggestedPriceMax: number | null;
    matrixCodes: string[];
    tracklist: { name: string; duration: string }[];
  };
  inventory: {
    id: string;
    conditionGrade: string;
    conditionNotes: { x?: number; y?: number; label: string }[];
    photoUrls: string[];
  };
}

export interface AssistCandidate {
  releaseId: string;
  slug: string;
  catalogSource?: 'relay' | 'musicbrainz';
  title: string;
  artist: string;
  year: number;
  genre: Genre;
  confidence: number;
  reasoning: string;
  suggestedPriceMin: number | null;
  suggestedPriceMax: number | null;
  matrixCodes: string[];
  coverUrl: string | null;
}

export interface VisionExtraction {
  albumTitle: string | null;
  artist: string | null;
  year: string | null;
  matrixCodes: string[];
  visibleText: string[];
  notes: string[];
  confidence: number | null;
}

export interface AssistDiagnostics {
  mode: 'rules' | 'vision+rules' | 'vision+llm' | 'llm';
  vision: VisionExtraction | null;
  summary: string | null;
  matched: boolean;
}

export interface CommunityPost {
  id: string;
  source?: 'relay' | 'system';
  title: string;
  body: string | null;
  createdAt: string;
  coverImageUrl: string | null;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  release:
    | {
        id: string;
        title: string;
        artist: string;
      }
    | null;
}

export interface ProfileResponse {
  profile: AppProfile;
  isAdmin: boolean;
  activeListings: ListingSummary[];
  ownedItems: Array<{
    id: string;
    conditionGrade: string;
    coverPhotoUrl: string | null;
    activeListingId: string | null;
    release: {
      id: string;
      title: string;
      artist: string;
      year: number;
      coverUrl: string | null;
    };
  }>;
  ledger: Array<{
    id: string;
    delta: number;
    balanceAfter: number;
    entryType: string;
    note: string | null;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    totalPrice: number;
    completedAt: string;
    role: 'buyer' | 'seller';
    releaseTitle: string;
  }>;
}
