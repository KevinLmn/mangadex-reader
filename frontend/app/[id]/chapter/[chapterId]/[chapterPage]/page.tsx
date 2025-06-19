'use client';
import { HeaderBar } from '@/features/reader/components/HeaderBar';
import { KeyboardShortcutsModal } from '@/features/reader/components/KeyboardShortcutsModal';
import { ReaderImage } from '@/features/reader/components/ReaderImage';
import { Quality } from '@/features/reader/constants/constants';
import { useBlobObjectUrl } from '@/features/reader/hooks/useBlobObjectUrl';
import { usePageImageCleanup } from '@/features/reader/hooks/usePageImageCleanup';
import { useReaderKeyboardNav } from '@/features/reader/hooks/useReaderKeyboardNav';
import { buildReaderUrl } from '@/features/reader/utils/buildReaderUrl';
import { Pagination } from '@/shared/components/Pagination';
import { cleanOldEntries } from '@/shared/lib/indexedDB';
import { useChapterMetadata, useCurrentPageImage, usePrefetchAdjacentPages } from '@/shared/lib/queries';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GetMangaPage() {
  const { id, chapterId, chapterPage } = useParams();
  const router = useRouter();
  const page = Number(chapterPage);
  const [quality, setQuality] = useState<Quality>(Quality.HIGH);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const safeChapterId = typeof chapterId === 'string' ? chapterId : '';
  const { data: pageData } = useCurrentPageImage(safeChapterId, page, quality);
  const { data: total } = useChapterMetadata(safeChapterId);

  usePrefetchAdjacentPages(safeChapterId, page, quality);
  usePageImageCleanup(safeChapterId, page);
  useReaderKeyboardNav({ id: id as string, chapterId: safeChapterId, page, total, quality, setQuality });

  useEffect(() => {
    cleanOldEntries();
  }, []);

  const objectUrl = useBlobObjectUrl(pageData?.blob);

  const handleNavigation = (targetPage: number) => {
    router.push(buildReaderUrl(id as string, safeChapterId, targetPage));
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <HeaderBar id={id as string} page={page} total={total} quality={quality} onToggleQuality={() => setQuality(quality === Quality.HIGH ? Quality.LOW : Quality.HIGH)} onShowShortcuts={() => setShowShortcuts(true)} />

      {showShortcuts && (
        <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      <main className="flex-1 flex flex-col items-center justify-center pt-16 pb-16 relative cursor-pointer">
        <div
          className="max-w-4xl w-full mx-auto px-4 transition-opacity duration-300"
          style={{ opacity: pageData?.blob ? 1 : 0 }}
        >
          {objectUrl ? (
            <div className="relative shadow-2xl">
              {page > 1 && (
                <div 
                  onClick={() => handleNavigation(page - 1)} 
                  className="absolute left-0 top-0 h-full w-1/2 z-10 cursor-pointer" 
                />
              )}
              {page < total && (
                <div 
                  onClick={() => handleNavigation(page + 1)} 
                  className="absolute right-0 top-0 h-full w-1/2 z-10 cursor-pointer" 
                />
              )}
              <ReaderImage objectUrl={objectUrl} alt={`Chapter page ${page}`} />
            </div>
          ) : (
            <div className="h-[80vh] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white" />
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent h-14">
        <div className="absolute inset-0 backdrop-blur-md" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-md flex items-center pb-8">
            <Pagination
              totalPages={total}
              page={page}
              mode="link"
              hrefBuilder={(page) => `/${id}/chapter/${chapterId}/${page}`}
              scrollToTop={true}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
