import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'purchase' | 'sale' | 'topup' | 'refund';
  description: string | null;
  created_at: string;
}

export function useCreditTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['credit_transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CreditTransaction[];
    },
    enabled: !!user,
  });
}
