import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export function usePageImageCleanup(chapterId: string, currentPage: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    return () => {
      const pagesToKeep = [currentPage, currentPage + 1, currentPage + 2, currentPage - 1];
      queryClient.getQueryCache().getAll().forEach((query: any) => {
        const key = query.queryKey;
        if (Array.isArray(key) && key[0] === 'page-image' && key[1] === chapterId && !pagesToKeep.includes(key[2])) {
          queryClient.removeQueries({ queryKey: key });
        }
      });
    };
  }, [chapterId, currentPage, queryClient]);
}
