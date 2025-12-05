import '@/styles/globals.css';
import { Header } from '@/shared/components/Header';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-gray-50`}>
        <Providers>
          <Header />
          {children}
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
