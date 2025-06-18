'use client';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Pagination';
import { cleanOldEntries } from '@/shared/lib/indexedDB';
import { useCurrentPageImage, usePrefetchAdjacentPages } from '@/shared/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

const enum Quality {
  HIGH = 'high',
  LOW = 'low',
}

export default function GetMangaPage() {
  const { id, chapterId, chapterPage } = useParams();
  const page = Number(chapterPage);
  const [quality, setQuality] = useState(Quality.HIGH);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const queryClient = useQueryClient();

  const safeChapterId = typeof chapterId === 'string' ? chapterId : '';
  const { data: pageData, isLoading } = useCurrentPageImage(safeChapterId, page, quality);
  const total = pageData?.numberOfPages || 0;

  usePrefetchAdjacentPages(safeChapterId, page, quality);

  // Cleanup when navigating away
  useEffect(() => {
    return () => {
      // Clear all page images except current and adjacent pages
      const pagesToKeep = [page, page + 1, page + 2, page - 1];
      queryClient
        .getQueryCache()
        .getAll()
        .forEach((query: { queryKey: unknown }) => {
          const queryKey = query.queryKey;
          if (
            Array.isArray(queryKey) &&
            queryKey[0] === 'page-image' &&
            queryKey[1] === safeChapterId &&
            !pagesToKeep.includes(queryKey[2])
          ) {
            queryClient.removeQueries({ queryKey });
          }
        });
    };
  }, [safeChapterId, page, queryClient]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const base = `/${id}/chapter/${chapterId}`;
      if ((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') && page > 1)
        window.location.href = `${base}/${page - 1}`;
      else if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') && page < total)
        window.location.href = `${base}/${page + 1}`;
      else if (e.key.toLowerCase() === 'h')
        setQuality(q => (q === Quality.HIGH ? Quality.LOW : Quality.HIGH));
      else if (e.key === 'Home' && page > 1) window.location.href = `${base}/1`;
      else if (e.key === 'End' && page < total) window.location.href = `${base}/${total}`;
      else if (e.key === 'Escape') window.location.href = `/${id}`;
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, chapterId, page, total]);

  useEffect(() => {
    cleanOldEntries();
  }, []);

  const objectUrl = useMemo(() => {
    if (pageData?.blob instanceof Blob) {
      return URL.createObjectURL(pageData.blob);
    }
    return null;
  }, [pageData?.blob]);

  const previousUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Revoke previous URL if it exists
    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current);
    }
    // Save current one
    previousUrlRef.current = objectUrl;

    return () => {
      // Revoke current one on unmount
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm h-14">
        <div className="container mx-auto px-4 h-full flex justify-between items-center">
          <Link
            href={`/${id}`}
            className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors"
          >
            <Button variant="ghost" size="sm" className="flex items-center gap-1 font-medium">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-arrow-left"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Back to Chapter List
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-white/80">
              Page {page} of {total}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuality(q => (q === Quality.HIGH ? Quality.LOW : Quality.HIGH))}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Quality: {quality === Quality.HIGH ? 'High' : 'Low'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcuts(true)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Shortcuts
            </Button>
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 w-80 rounded-lg shadow-lg p-4 relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white"
              onClick={() => setShowShortcuts(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-white mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Next page', '→ or D'],
                ['Previous page', '← or A'],
                ['Toggle quality', 'H'],
                ['First page', 'Home'],
                ['Last page', 'End'],
                ['Back to manga', 'Esc'],
              ].map(([action, key]) => (
                <div key={action} className="flex justify-between">
                  <span className="text-gray-300">{action}</span>
                  <span className="text-gray-400">{key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Manga Image with Link overlays */}
      <main className="flex-1 flex flex-col items-center justify-center pt-16 pb-16 relative cursor-pointer">
        <div
          className="max-w-4xl w-full mx-auto px-4 transition-opacity duration-300"
          style={{ opacity: pageData?.blob ? 1 : 0 }}
        >
          {pageData?.blob ? (
            <div className="relative shadow-2xl">
              {page > 1 && (
                <Link
                  href={`/${id}/chapter/${chapterId}/${page - 1}`}
                  className="absolute left-0 top-0 h-full w-1/2 z-10"
                >
                  <span className="block h-full w-full" />
                </Link>
              )}
              {page < total && (
                <Link
                  href={`/${id}/chapter/${chapterId}/${page + 1}`}
                  className="absolute right-0 top-0 h-full w-1/2 z-10"
                >
                  <span className="block h-full w-full" />
                </Link>
              )}
              {objectUrl && (
                <Image
                  key={objectUrl}
                  src={objectUrl}
                  alt={`Chapter page ${page}`}
                  width={1080}
                  height={0}
                  className="h-auto w-full object-contain"
                  priority
                  unoptimized
                  onError={() => console.error('Image failed to load', objectUrl)}
                />
              )}
            </div>
          ) : (
            <div className="h-[80vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Pagination */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent h-14">
        <div className="absolute inset-0 backdrop-blur-md" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-md flex items-center pb-8">
            <Pagination
              totalPages={total}
              page={page}
              mode="link"
              hrefBuilder={(page) => `/${id}/chapter/${chapterId}/${page}`}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
