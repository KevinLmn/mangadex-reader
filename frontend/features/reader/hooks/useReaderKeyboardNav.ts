import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Quality } from '../constants/constants';

export function useReaderKeyboardNav({
  id,
  chapterId,
  page,
  total,
  quality,
  setQuality,
}: {
  id: string;
  chapterId: string;
  page: number;
  total: number;
  quality: Quality;
  setQuality: (q: Quality) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const base = `/${id}/chapter/${chapterId}`;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if ((key === 'arrowleft' || key === 'a') && page > 1) router.push(`${base}/${page - 1}`);
      else if ((key === 'arrowright' || key === 'd') && page < total) router.push(`${base}/${page + 1}`);
      else if (key === 'h') setQuality(quality === Quality.HIGH ? Quality.LOW : Quality.HIGH);
      else if (key === 'home' && page > 1) router.push(`${base}/1`);
      else if (key === 'end' && page < total) router.push(`${base}/${total}`);
      else if (key === 'escape') router.push(`/${id}`);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, chapterId, page, total, quality, setQuality, router]);
}
