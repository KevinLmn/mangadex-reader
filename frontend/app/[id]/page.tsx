'use client';

import { ChapterList } from '@/features/details/ChapterList';
import { Card } from '@/shared/components/Card';
import { FavoriteButton } from '@/shared/components/FavoriteButton';
import { useAuth } from '@/shared/context/AuthContext';
import { cleanOldEntries } from '@/shared/lib/indexedDB';
import api from '@/shared/lib/interceptor';
import { useMangaCover, useMangaDetails, usePrefetchFirstPage, useReadingProgress } from '@/shared/lib/queries';
import { Chapter } from '@manga/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function GetMangaById() {
  const [page, setPage] = useState<number>(1);
  const { id } = useParams();
  const { user } = useAuth();

  const { data, isLoading: isDataLoading } = useMangaDetails(id as string, page);
  const { data: readingProgress } = useReadingProgress(id as string, !!user);
  const prefetchFirstPage = usePrefetchFirstPage();

  const downloadChapter = async (chapterId: string) => {
    try {
      toast.info('Starting download...');
      const response = await api.get(`/manga/${id}/download/${chapterId}`, {
        responseType: 'blob',
        timeout: 10 * 60 * 1000,
      });

      const chapter = data?.chapters.data.find((c: Chapter) => c.id === chapterId);
      if (!chapter) {
        throw new Error('Chapter not found');
      }

      const blob = new Blob([response.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${data?.manga.data.attributes?.title?.en || 'manga'}_chapter_${chapter.attributes.chapter}.png`;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download completed!');
    } catch (err) {
      toast.error('Failed to download chapter. Please try again.');
    }
  };

  const { data: mangaCover, isLoading: isMangaCoverLoading } = useMangaCover(
    id as string,
    data?.manga.data.relationships.find(
      (el: { type: string; attributes: { fileName: string } }) => el.type === 'cover_art'
    )?.attributes.fileName,
    '512'
  );

  useEffect(() => {
    cleanOldEntries();
  }, []);

  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ['page-image'], exact: false });
  }, [queryClient]);

  if (isDataLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <Card className="p-6">
          {isMangaCoverLoading || !mangaCover ? (
            <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-gray-200" />
          ) : (
            <Image
              src={mangaCover}
              alt={data?.manga.data.attributes?.title?.en || 'Manga Cover'}
              width={300}
              height={450}
              priority
              className="aspect-[2/3] w-full rounded-lg object-cover"
            />
          )}
          <div className="mt-4">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold">{data?.manga.data.attributes?.title?.en}</h1>
              <FavoriteButton mangaId={id as string} />
            </div>

            {readingProgress && (
              <Link
                href={`/${id}/chapter/${readingProgress.chapterId}/${readingProgress.page}`}
                className="mt-4 flex items-center gap-2 w-full justify-center py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                <PlayCircle className="w-5 h-5" />
                Continue Reading
                <span className="text-blue-200 text-sm">
                  (Page {readingProgress.page}{readingProgress.totalPages ? `/${readingProgress.totalPages}` : ''})
                </span>
              </Link>
            )}

            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {data?.manga.data.attributes?.description?.en}
            </p>
          </div>
        </Card>
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Chapters</h2>
          </div>
          <ChapterList
            chapters={data?.chapters.data || []}
            page={page}
            setPage={setPage}
            total={data?.chapters.total || 0}
            mangaId={id as string}
            downloadChapter={downloadChapter}
            setChapter={() => {}}
            onChapterHover={prefetchFirstPage}
          />
        </div>
      </div>
    </div>
  );
}
