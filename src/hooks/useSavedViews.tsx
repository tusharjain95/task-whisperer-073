import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SavedView, TaskFilters } from '@/lib/types';
import { useAuth } from './useAuth';

export function useSavedViews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const viewsQuery = useQuery({
    queryKey: ['saved_views', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('saved_views')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(view => ({
        ...view,
        filters: (view.filters || {}) as TaskFilters,
        sort_order: (view.sort_order || 'desc') as 'asc' | 'desc'
      })) as SavedView[];
    },
    enabled: !!user,
  });

  const createView = useMutation({
    mutationFn: async (view: Omit<SavedView, 'id' | 'user_id' | 'created_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('saved_views')
        .insert([{ name: view.name, filters: view.filters as unknown as Record<string, unknown>, sort_by: view.sort_by, sort_order: view.sort_order, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return {
        ...data,
        filters: (data.filters || {}) as TaskFilters,
        sort_order: (data.sort_order || 'desc') as 'asc' | 'desc'
      } as SavedView;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_views'] });
    },
  });

  const deleteView = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('saved_views').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved_views'] });
    },
  });

  return {
    views: viewsQuery.data || [],
    isLoading: viewsQuery.isLoading,
    error: viewsQuery.error,
    createView,
    deleteView,
  };
}
