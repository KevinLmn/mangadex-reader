'use client';

import { useAuth } from '@/shared/context/AuthContext';
import api from '@/shared/lib/interceptor';
import { useAllReadingProgress } from '@/shared/lib/queries';
import { getProxiedImageUrl } from '@/shared/lib/utils';
import { PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MangaInfo {
  id: string;
  title: string;
  coverUrl: string;
  chapterNumber: string | null;
}

interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  page: number;
  totalPages: number | null;
  updatedAt: string;
}

export function ContinueReading() {
  const { user } = useAuth();
  const { data: progressList, isLoading } = useAllReadingProgress(6, !!user);
  const [mangaInfos, setMangaInfos] = useState<Record<string, MangaInfo>>({});
  const [loadingMangas, setLoadingMangas] = useState(false);

  useEffect(() => {
    const fetchMangaInfos = async () => {
      if (!progressList || progressList.length === 0) return;

      setLoadingMangas(true);

      const results = await Promise.allSettled(
        progressList.map(async (progress: ReadingProgress) => {
          const [mangaRes, chapterRes] = await Promise.all([
            api.post(`/manga/${progress.mangaId}?downloaded=false`, {
              limit: 1,
              offset: 0,
            }),
            api.get(`/manga/chapter/${progress.chapterId}/info`).catch(() => null),
          ]);

          const manga = mangaRes.data.manga.data;
          const coverArt = manga.relationships.find(
            (r: any) => r.type === 'cover_art'
          );
          const fileName = coverArt?.attributes?.fileName;
          const chapterNumber = chapterRes?.data?.chapter || null;

          return {
            id: progress.mangaId,
            title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown',
            coverUrl: fileName
              ? getProxiedImageUrl(`https://uploads.mangadex.org/covers/${progress.mangaId}/${fileName}.256.jpg`)
              : '',
            chapterNumber,
          } as MangaInfo;
        })
      );

      const infos: Record<string, MangaInfo> = {};
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          infos[result.value.id] = result.value;
        }
      });

      setMangaInfos(infos);
      setLoadingMangas(false);
    };

    fetchMangaInfos();
  }, [progressList]);

  if (!user || !progressList || progressList.length === 0) {
    return null;
  }

  if (isLoading || loadingMangas) {
    return (
      <section className="px-6 py-8">
        <h2 className="text-2xl font-bold mb-4">Continue Reading</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shrink-0 w-40 h-64 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <h2 className="text-2xl font-bold mb-4">Continue Reading</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {progressList.map((progress: ReadingProgress) => {
          const manga = mangaInfos[progress.mangaId];
          if (!manga) return null;

          return (
            <Link
              key={progress.mangaId}
              href={`/${progress.mangaId}/chapter/${progress.chapterId}/${progress.page}`}
              className="group shrink-0 w-40 relative bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
            >
              <div className="aspect-[2/3] relative">
                {manga.coverUrl ? (
                  <Image
                    src={manga.coverUrl}
                    alt={manga.title}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No cover</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <p className="text-xs text-gray-300">
                    {manga.chapterNumber && `Ch. ${manga.chapterNumber} · `}Page {progress.page}{progress.totalPages ? `/${progress.totalPages}` : ''}
                  </p>
                </div>
              </div>
              <div className="p-2">
                <h3 className="text-sm font-medium line-clamp-2">{manga.title}</h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
