import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskComment } from '@/lib/types';
import { useAuth } from './useAuth';

export function useComments(taskId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      if (!user || !taskId) return [];
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as TaskComment[];
    },
    enabled: !!user && !!taskId,
  });

  const createComment = useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{ task_id: taskId, content, user_id: user.id }])
        .select()
        .single();
      
      if (error) throw error;
      return data as TaskComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_comments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    createComment,
    deleteComment,
  };
}
