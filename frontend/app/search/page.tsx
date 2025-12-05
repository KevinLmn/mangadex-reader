'use client';

import { FavoriteButton } from '@/shared/components/FavoriteButton';
import { Loading } from '@/shared/components/Loading';
import { useSearchManga } from '@/shared/lib/queries';
import { getProxiedImageUrl } from '@/shared/lib/utils';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

interface MangaResult {
  id: string;
  attributes: {
    title: { en?: string; [key: string]: string | undefined };
    description?: { en?: string };
  };
  relationships: Array<{
    type: string;
    attributes?: { fileName?: string };
  }>;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isError } = useSearchManga(query, limit, page * limit);

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <p className="text-center text-gray-400">Enter a search term to find manga.</p>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <p className="text-center text-red-500">Failed to search. Please try again.</p>
      </div>
    );
  }

  const results = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">
        Search results for "{query}"
      </h1>
      <p className="text-gray-400 mb-6">{total} results found</p>

      {results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No manga found matching your search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((manga: MangaResult) => {
              const coverArt = manga.relationships.find((r) => r.type === 'cover_art');
              const fileName = coverArt?.attributes?.fileName;
              const title =
                manga.attributes.title.en ||
                Object.values(manga.attributes.title)[0] ||
                'Unknown';
              const coverUrl = fileName
                ? getProxiedImageUrl(
                    `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg`
                  )
                : '';

              return (
                <Link
                  key={manga.id}
                  href={`/${manga.id}`}
                  className="group relative bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                >
                  <div className="aspect-[2/3] relative">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={title}
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
                      <FavoriteButton mangaId={manga.id} />
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-gray-400">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchResults />
    </Suspense>
  );
}
