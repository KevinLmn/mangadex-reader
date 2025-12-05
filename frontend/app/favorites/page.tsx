'use client';

import { FavoriteButton } from '@/shared/components/FavoriteButton';
import { Loading } from '@/shared/components/Loading';
import { useAuth } from '@/shared/context/AuthContext';
import { useFavorites } from '@/shared/lib/queries';
import { getProxiedImageUrl } from '@/shared/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '@/shared/lib/interceptor';

interface Favorite {
  id: string;
  mangaId: string;
  addedAt: string;
}

interface MangaInfo {
  id: string;
  title: string;
  coverUrl: string;
}

export default function FavoritesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { data: favorites, isLoading: isFavoritesLoading } = useFavorites();
  const [mangaInfos, setMangaInfos] = useState<Record<string, MangaInfo>>({});
  const [loadingMangas, setLoadingMangas] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    const fetchMangaInfos = async () => {
      if (!favorites || favorites.length === 0) return;

      setLoadingMangas(true);
      const infos: Record<string, MangaInfo> = {};

      for (const fav of favorites as Favorite[]) {
        try {
          const { data } = await api.post(`/manga/${fav.mangaId}?downloaded=false`, {
            limit: 1,
            offset: 0,
          });

          const manga = data.manga.data;
          const coverArt = manga.relationships.find(
            (r: any) => r.type === 'cover_art'
          );
          const fileName = coverArt?.attributes?.fileName;

          infos[fav.mangaId] = {
            id: fav.mangaId,
            title: manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Unknown',
            coverUrl: fileName
              ? getProxiedImageUrl(`https://uploads.mangadex.org/covers/${fav.mangaId}/${fileName}.256.jpg`)
              : '',
          };
        } catch (error) {
          console.error(`Failed to fetch manga ${fav.mangaId}:`, error);
        }
      }

      setMangaInfos(infos);
      setLoadingMangas(false);
    };

    fetchMangaInfos();
  }, [favorites]);

  if (isAuthLoading || isFavoritesLoading || loadingMangas) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 pt-20">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8">My Favorites</h1>

      {!favorites || favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">You haven't added any favorites yet.</p>
          <Link href="/" className="text-blue-500 hover:text-blue-400 mt-4 inline-block">
            Browse manga
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {(favorites as Favorite[]).map((fav) => {
            const manga = mangaInfos[fav.mangaId];
            if (!manga) return null;

            return (
              <Link
                key={fav.id}
                href={`/${fav.mangaId}`}
                className="group relative bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <div className="aspect-[2/3] relative">
                  {manga.coverUrl ? (
                    <Image
                      src={manga.coverUrl}
                      alt={manga.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-500">No cover</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FavoriteButton mangaId={fav.mangaId} />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium line-clamp-2">{manga.title}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
