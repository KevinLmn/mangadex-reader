'use client';

import { useAuth } from '@/shared/context/AuthContext';
import { useAddFavorite, useIsFavorite, useRemoveFavorite } from '@/shared/lib/queries';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface FavoriteButtonProps {
  mangaId: string;
  className?: string;
}

export function FavoriteButton({ mangaId, className = '' }: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { data: isFavorite, isLoading } = useIsFavorite(mangaId);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add favorites');
      router.push('/login');
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync(mangaId);
        toast.success('Removed from favorites');
      } else {
        await addFavorite.mutateAsync(mangaId);
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update favorites');
    }
  };

  const isPending = addFavorite.isPending || removeFavorite.isPending;

  return (
    <button
      onClick={handleClick}
      disabled={isPending || isLoading}
      className={`p-2 rounded-full transition-colors ${
        isFavorite
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
    </button>
  );
}
