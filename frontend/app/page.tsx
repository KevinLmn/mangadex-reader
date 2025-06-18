'use client';

import { PopularCarousel } from '@/features/looby/PopularCarousel';
import { Loading } from '@/shared/components/Loading';
import { cleanOldEntries } from '@/shared/lib/indexedDB';
import { useLatestManga, usePopularManga, usePrefetchMangaDetails } from '@/shared/lib/queries';
import MangaSection, { SectionType } from '@features/looby/MangaSection';
import React, { useEffect } from 'react';

const MemoizedMangaSection = React.memo(MangaSection);

export default function List() {
  const { data: popularMangas, isLoading: isPopularLoading } = usePopularManga();
  const { data: latestMangas, isLoading: isLatestLoading } = useLatestManga();

  const prefetchManga = usePrefetchMangaDetails();

  const handleMangaHover = (mangaId: string) => {
    prefetchManga(mangaId);
  };

  useEffect(() => {
    cleanOldEntries();
  }, []);

  if (isPopularLoading || isLatestLoading) {
    return <Loading />;
  }

  return (
    <div className="w-full flex relative min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="w-full">
        <PopularCarousel
          mangas={popularMangas!}
          onHover={handleMangaHover}
        />
        {popularMangas && (
          <MemoizedMangaSection
            mangas={popularMangas}
            sectionType={SectionType.Popular}
            isLoading={isPopularLoading}
          />
        )}
        {latestMangas && (
          <MemoizedMangaSection
            mangas={latestMangas}
            sectionType={SectionType.LatestUpdates}
            isLoading={isLatestLoading}
          />
        )}
      </div>
    </div>
  );
}
