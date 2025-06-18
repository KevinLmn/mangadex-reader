'use client';
import { Pagination } from '@/shared/components/Pagination';
import { Chapter } from '@/shared/types/types';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

const LIMIT = 24;

interface ChapterListProps {
  chapters: Chapter[];
  page: number;
  setPage: (page: number) => void;
  total: number;
  mangaId: string;
  downloadChapter: (chapterId: string) => void;
  setChapter: (chapter: Chapter) => void;
  onChapterHover?: (chapterId: string) => void;
}

function useDebouncedHover(callback: (id: string) => void, delay = 300) {
  const timeoutMap = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleMouseEnter = (id: string) => {
    const timeout = setTimeout(() => {
      callback(id);
      timeoutMap.current.delete(id);
    }, delay);
    timeoutMap.current.set(id, timeout);
  };

  const handleMouseLeave = (id: string) => {
    const timeout = timeoutMap.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMap.current.delete(id);
    }
  };

  return { handleMouseEnter, handleMouseLeave };
}

export function ChapterList({
  chapters,
  page,
  setPage,
  total,
  mangaId,
  downloadChapter,
  setChapter,
  onChapterHover,
}: ChapterListProps) {
  const totalPages = Math.ceil(total / LIMIT);
  const { handleMouseEnter, handleMouseLeave } = useDebouncedHover(onChapterHover || (() => {}));

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold md:text-3xl">Manga Chapters</h1>
        <p className="text-gray-500 dark:text-gray-400">Browse through the latest chapters.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {chapters &&
          chapters.map((chapter: Chapter) => {
            return (
              <div
                key={chapter.id}
                className="group bg-white rounded-xl shadow-sm dark:bg-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
                onMouseEnter={() => handleMouseEnter(chapter.id)}
                onMouseLeave={() => handleMouseLeave(chapter.id)}
              >
                <Link
                  href={`/${mangaId}/chapter/${chapter.id}/1`}
                  className="block p-5 min-w-14 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      Chapter {chapter.attributes.chapter}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {chapter.attributes.pages} pages
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-3 line-clamp-2 text-gray-900 dark:text-gray-100">
                    {chapter.attributes.title || `Chapter ${chapter.attributes.chapter}`}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Vol. {chapter.attributes.volume || 'N/A'}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(chapter.attributes.publishAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
                <div className="border-t border-gray-100 dark:border-gray-700">
                  <button
                    className="w-full py-3 px-4 bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center gap-2 group-hover:bg-primary-600"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      downloadChapter(chapter.id);
                    }}
                  >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      <Pagination
        totalPages={totalPages}
        page={page}
        mode="button"
        onPageChange={setPage}
      />
    </div>
  );
}
