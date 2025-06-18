'use client';

import { getProxiedImageUrl } from '@/shared/lib/utils';
import { Manga } from '@/shared/types/types';
import Autoplay from 'embla-carousel-autoplay';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './Carousel';


interface Props {
  mangas: Manga[];
  onHover?: (id: string) => void;
}

export const PopularCarousel = ({ mangas, onHover }: Props) => {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute text-white text-3xl font-semibold w-full items-center px-6 pt-4 z-10"
      >
        <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-white">
          Popular Titles
        </div>
      </motion.div>

      <Carousel
        opts={{ align: 'start', loop: true }}
        plugins={[Autoplay({ delay: 10000 })]}
        className="w-full h-96 relative left-0 flex overflow-hidden"
      >
        <CarouselContent className="w-full h-full absolute left-0 flex ml-0">
          {mangas.map((manga, index) => {
            const cover = manga.relationships.find((r) => r.type === 'cover_art')?.attributes?.fileName;

            return (
              <CarouselItem
                key={manga.id}
                className="w-full h-full flex relative left-0 pl-0"
                onMouseEnter={() => onHover?.(manga.id)}
              >
                <div className="w-full h-full absolute z-10 quick-opacity-gradient"></div>

                <Link
                  href={`/${manga.id}`}
                  className="absolute z-20 h-full w-full flex justify-start items-end ml-12"
                >
                  <div className="flex h-[70%]">
                    <Image
                      alt={`Carousel Main Image ${index}`}
                      className="rounded-md"
                      height={280}
                      width={180}
                      src={getProxiedImageUrl(`https://uploads.mangadex.org/covers/${manga.id}/${cover}.256.jpg`)}
                      decoding="sync"
                      {...(index < 2
                        ? { priority: true, loading: 'eager' }
                        : { loading: 'lazy' })}
                    />

                    <div className="h-full w-[75%] flex flex-col justify-between px-4 text-white pb-10">
                      <p className="font-bold text-2xl">{manga.attributes.title.en}</p>
                      <div className="flex gap-2">
                        {manga.attributes.tags?.slice(0, 6).map((tag, index) => (
                          <p key={index} className="bg-gray-800 rounded-2xl px-2 font-semibold">
                            {tag.attributes.name.en}
                          </p>
                        ))}
                      </div>
                      <p>
                        {manga.attributes.description.en.slice(0, 600)}
                        {manga.attributes.description.en.length > 600 && '...'}
                      </p>
                    </div>
                  </div>
                </Link>

                <Image
                  alt={`Carousel Background ${index}`}
                  className="w-full h-full object-cover object-top absolute top-0 left-0 image-box-sizing"
                  fill
                  src={getProxiedImageUrl(`https://uploads.mangadex.org/covers/${manga.id}/${cover}.512.jpg`)}
                  style={{ zIndex: -1 }}
                />
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious className="left-2 absolute z-20 top-1/2 transform -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full" />
        <CarouselNext className="right-2 absolute z-20 top-1/2 transform -translate-y-1/2 p-2 bg-gray-700 text-white rounded-full" />
      </Carousel>
    </div>
  );
};
