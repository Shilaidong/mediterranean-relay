import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTransactions,
  fetchPosts,
  fetchCollectors,
  createPost,
} from '../services/communityService';

export function useTransactions() {
  return useQuery({
    queryKey: ['community', 'transactions'],
    queryFn: fetchTransactions,
  });
}

export function usePosts() {
  return useQuery({
    queryKey: ['community', 'posts'],
    queryFn: fetchPosts,
  });
}

export function useCollectors() {
  return useQuery({
    queryKey: ['community', 'collectors'],
    queryFn: fetchCollectors,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, content, coverUrl }: { title: string; content?: string; coverUrl?: string }) =>
      createPost(title, content, coverUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}
