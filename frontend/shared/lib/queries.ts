import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getImageFromDB, getTotalPagesFromDB, setImageInDB, setTotalPagesInDB } from './indexedDB';
import api from './interceptor';
import { getProxiedImageUrl } from './utils';

type PageImageData = {
  blob: Blob;
  numberOfPages?: number;
};

const toBase64 = (buffer: ArrayBuffer | { type: string; data: number[] }): string => {
  let byteArray: Uint8Array;

  if ('type' in buffer && Array.isArray((buffer as any).data)) {
    byteArray = new Uint8Array((buffer as any).data);
  } else {
    byteArray = new Uint8Array(buffer as ArrayBuffer);
  }

  let binary = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    binary += String.fromCharCode(byteArray[i] ?? 0);
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
};

const toBlobUrl = (buffer: ArrayBuffer): string => {
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
};
const fetchImageAndTotalPages = async (
  chapterId: string,
  page: number,
  quality: string
): Promise<PageImageData> => {
  const key = `/manga/chapter/${chapterId}/${page}?quality=${quality}`;
  const cachedBuffer = await getImageFromDB(key);

  let totalPages = await getTotalPagesFromDB(`/manga/chapter/${chapterId}/total`);
  if (!totalPages) {
    const { data: totalPagesData } = await api.get(`/manga/chapter/${chapterId}/total`);
    totalPages = Number(totalPagesData.totalPages);
    await setTotalPagesInDB(`/manga/chapter/${chapterId}/total`, totalPages);
  }

  if (cachedBuffer) {
    return {
      blob: cachedBuffer,
      numberOfPages: Number(totalPages),
    };
  }

  const { data } = await api.get(key, { responseType: 'arraybuffer' });
  const blob = new Blob([data], { type: 'image/jpeg' });
  await setImageInDB(key, blob);

  return {
    blob,
    numberOfPages: Number(totalPages),
  };
};

const fetchFromCache = async (key: string) => {
  const res = await api.get(`/${key}`);
  return res.data.data;
};

export function useLatestManga() {
  return useQuery({
    queryKey: ['latest-manga'],
    queryFn: () => fetchFromCache('latest'),
    staleTime: 0,
    gcTime: 1000 * 60 * 30,
  });
}

export function usePopularManga() {
  return useQuery({
    queryKey: ['popular-manga'],
    queryFn: () => fetchFromCache('popular'),
    staleTime: 0,
    gcTime: 1000 * 60 * 30,
  });
}

export const useCurrentPageImage = (chapterId: string, page: number, quality: string) => {
  const queryClient = useQueryClient();

  // Cleanup old images when component unmounts
  useEffect(() => {
    return () => {
      // Remove all page images except current and adjacent pages
      const pagesToKeep = [page, page + 1, page + 2, page - 1];
      const allQueries = queryClient.getQueryCache().getAll();
      allQueries.forEach(query => {
        const queryKey = query.queryKey;
        if (
          Array.isArray(queryKey) &&
          queryKey[0] === 'page-image' &&
          queryKey[1] === chapterId &&
          !pagesToKeep.includes(queryKey[2])
        ) {
          queryClient.removeQueries({ queryKey });
        }
      });
    };
  }, [chapterId, page, queryClient]);

  return useQuery({
    queryKey: ['page-image', chapterId, page, quality],
    queryFn: () => fetchImageAndTotalPages(chapterId, page, quality),
    staleTime: 0,
    gcTime: 1000 * 10, // 10 seconds
  });
};

export const usePrefetchAdjacentPages = (chapterId: string, page: number, quality: string) => {
  const client = useQueryClient();
  useEffect(() => {
    const pagesToPrefetch = [page + 1, page + 2, page - 1];
    pagesToPrefetch.forEach(p => {
      if (p > 0 && !client.getQueryData(['page-image', chapterId, p, quality])) {
        client.prefetchQuery({
          queryKey: ['page-image', chapterId, p, quality],
          queryFn: () => fetchImageAndTotalPages(chapterId, p, quality),
          staleTime: 0,
          gcTime: 1000 * 30,
        });
      }
    });
  }, [chapterId, page, quality, client]);
};

export const useMangaDetails = (mangaId: string, page: number = 1) =>
  useQuery({
    queryKey: ['manga-details', mangaId, page],
    queryFn: async () => {
      const { data } = await api.post(`/manga/${mangaId}?downloaded=false`, {
        limit: 24,
        offset: page - 1,
      });
      return data;
    },
    staleTime: 0,
    gcTime: 1000 * 30,
  });

export const usePrefetchMangaDetails = () => {
  const queryClient = useQueryClient();

  return async (mangaId: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['manga-details', mangaId, 1],
      queryFn: async () => {
        const { data } = await api.post(`/manga/${mangaId}?downloaded=false`, {
          limit: 24,
          offset: 0,
        });
        return data;
      },
    });
  };
};

export const usePrefetchFirstPage = (quality: string = 'high') => {
  const client = useQueryClient();

  return (chapterId: string) => {
    client.prefetchQuery({
      queryKey: ['page-image', chapterId, 1, quality],
      queryFn: () => fetchImageAndTotalPages(chapterId, 1, quality),
      staleTime: 0,
      gcTime: 1000 * 30,
    });
  };
};

export const useMangaCover = (mangaId: string, fileName?: string, quality: string = '256') => {
  return useQuery({
    queryKey: ['manga-cover', mangaId, quality],
    queryFn: async () => {
      if (!fileName) throw new Error('Missing fileName for cover');
      const rawUrl = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.${quality}.jpg`;
      return getProxiedImageUrl(rawUrl);
    },
    enabled: !!fileName,
    staleTime: 1000 * 60 * 60, // 1h
    retry: 1,
  });
};

export const usePrefetchMangaCover = () => {
  const queryClient = useQueryClient();
  return (mangaId: string, fileName?: string, quality: string = '256') => {
    queryClient.prefetchQuery({
      queryKey: ['manga-cover', mangaId, quality],
      queryFn: async () => {
        if (!fileName) throw new Error('Missing fileName for cover');
        const rawUrl = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.${quality}.jpg`;
        return getProxiedImageUrl(rawUrl);
      },
    });
  };
};
