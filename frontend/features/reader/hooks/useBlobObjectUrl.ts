import { useEffect, useMemo, useRef } from 'react';

export function useBlobObjectUrl(blob?: Blob | null) {
  const url = useMemo(() => (blob instanceof Blob ? URL.createObjectURL(blob) : null), [blob]);
  const prevRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevRef.current) URL.revokeObjectURL(prevRef.current);
    prevRef.current = url;

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}
