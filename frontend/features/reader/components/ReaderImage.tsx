import Image from 'next/image';

interface ReaderImageProps {
  objectUrl: string;
  alt: string;
}

export const ReaderImage = ({ objectUrl, alt }: ReaderImageProps) => {
  return (
    <Image
      key={objectUrl}
      src={objectUrl}
      alt={alt}
      width={1080}
      height={0}
      className="h-auto w-full object-contain"
      priority
      unoptimized
      onError={() => console.error('Image failed to load', objectUrl)}
    />
  );
};
