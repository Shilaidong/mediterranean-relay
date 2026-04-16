import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMarketAlbums,
  fetchMyAlbums,
  fetchAlbum,
  listAlbum,
  purchaseAlbum,
} from '../services/albumService';
import { useAuth } from '../contexts/AuthContext';

// Get market albums (for Browse)
export function useMarketAlbums() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['albums', 'market', user?.id],
    queryFn: () => fetchMarketAlbums(user?.id),
    enabled: true, // Allow anonymous browsing
  });
}

// Get user's owned albums (for Home)
export function useMyAlbums() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['albums', 'mine', user?.id],
    queryFn: () => fetchMyAlbums(user!.id),
    enabled: !!user,
  });
}

// Get single album (for Detail)
export function useAlbum(id: string) {
  return useQuery({
    queryKey: ['album', id],
    queryFn: () => fetchAlbum(id),
    enabled: !!id,
  });
}

// List album mutation (for Linking)
export function useListAlbum() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: listAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      refreshProfile();
    },
  });
}

// Purchase album mutation (for Trade)
export function usePurchaseAlbum() {
  const queryClient = useQueryClient();
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationFn: ({ albumId, price }: { albumId: string; price: number }) =>
      purchaseAlbum(albumId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      refreshProfile();
    },
  });
}
