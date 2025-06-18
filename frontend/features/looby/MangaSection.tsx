'use client';
import { Loading } from '@/shared/components/Loading';
import { Reveal } from '@/shared/components/Reveal';
import { usePrefetchMangaCover, usePrefetchMangaDetails } from '@/shared/lib/queries';
import { Manga } from '@/shared/types/types';
import { memo } from 'react';
import { MangaCard } from './MangaCard';

export enum SectionType {
  LatestUpdates = 'LatestUpdates',
  Popular = 'Popular',
}

interface MangaSectionProps {
  mangas: Manga[];
  sectionType: SectionType;
  isLoading: boolean;
}

const MemoizedMangaCard = memo(MangaCard);

const MangaSection = ({ mangas, sectionType, isLoading }: MangaSectionProps) => {
  const prefetchManga = usePrefetchMangaDetails();
  const prefetchMangaCover = usePrefetchMangaCover();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="text-white p-4 mt-4">
      <Reveal>
        <div className="font-semibold text-2xl">
          {sectionType === SectionType.LatestUpdates ? 'Latest Updates' : 'Popular'}
        </div>
      </Reveal>
      <div className="mt-4 bg-neutral-800 p-4 flex gap-2 flex-wrap justify-around">
        {mangas.map((manga, index) => (
          <MemoizedMangaCard
            key={manga.id}
            manga={manga}
            index={index}
            onHover={() => {
              prefetchManga(manga.id);
              const coverArt = manga.relationships.find(el => el.type === 'cover_art');
              if (coverArt) {
                prefetchMangaCover(manga.id, coverArt.attributes.fileName, '512');
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MangaSection;
