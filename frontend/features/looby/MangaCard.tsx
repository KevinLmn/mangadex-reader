'use client';
import { Reveal } from '@/shared/components/Reveal';
import { useMangaCover } from '@/shared/lib/queries';
import { Manga } from '@/shared/types/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface Props {
  manga: Manga;
  index: number;
  onHover: () => void;
}

export const MangaCard = ({ manga, index, onHover }: Props) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const coverArt = manga.relationships.find(el => el.type === 'cover_art');
  const {
    data: coverUrl,
    isLoading,
    isError,
  } = useMangaCover(manga.id, coverArt?.attributes.fileName);

  const getTimePassedSince = (date: string): string => {
    const currentDate = new Date();
    const updatedAt = new Date(date);
    const diff = currentDate.getTime() - updatedAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return `${seconds} seconds ago`;
  };

  return (
    <div
      style={{ width: 350, height: 550 }}
      className="rounded-lg overflow-hidden bg-neutral-800 shadow-manga-list w-[160px] h-[280px]"
      onMouseEnter={onHover}
    >
      <Link href={`/${manga.id}`} className="h-full flex flex-col">
        {isLoading ? (
          <div className="w-full h-[200px] bg-gray-200 animate-pulse" />
        ) : isError || !coverUrl ? (
          <div className="w-full h-[200px] bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400">Failed to load image</span>
          </div>
        ) : (
          <Image
            alt="Manga Cover"
            className="object-cover"
            height={400}
            width={400}
            loading={index < 5 ? 'eager' : 'lazy'}
            priority={index < 5}
            src={coverUrl}
            style={{
              aspectRatio: '160/200',
              objectFit: 'cover',
              height: 'auto',
            }}
            onLoad={() => setIsImageLoaded(true)}
          />
        )}

        {isImageLoaded && (
          <Reveal>
            <div className="p-2 flex flex-col gap-1 justify-between">
              <h3 className="text-sm font-bold line-clamp-1">
                {manga.attributes.title.en?.length > 40
                  ? manga.attributes.title.en.substring(0, 40) + '...'
                  : manga.attributes.title.en}
              </h3>
              <p className="text-xs line-clamp-2 text-start">{manga.attributes.description.en}</p>
              <div className="flex justify-between text-xs">
                <p>{manga.attributes.lastChapter && `Ch.${manga.attributes.lastChapter}`}</p>
                <p>{getTimePassedSince(manga.attributes.updatedAt || '')}</p>
              </div>
            </div>
          </Reveal>
        )}
      </Link>
    </div>
  );
};
