'use client';

import { useAuth } from '@/shared/context/AuthContext';
import { Heart, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchBar } from './SearchBar';

export function Header() {
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  // Hide header on reader pages (they have their own header)
  if (pathname?.includes('/chapter/')) {
    return null;
  }

  return (
    <header className="fixed top-0 right-0 z-50 p-4 flex items-center gap-4 bg-gray-900/80 backdrop-blur-sm rounded-bl-lg">
      <SearchBar className="w-64" />

      <div className="flex items-center gap-3 shrink-0">
        {isLoading ? (
          <div className="h-10 w-24 bg-gray-800 rounded-lg animate-pulse" />
        ) : user ? (
          <>
            <Link
              href="/favorites"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favorites</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 backdrop-blur rounded-lg">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/80 backdrop-blur hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-2 bg-gray-800/80 backdrop-blur hover:bg-gray-700 rounded-lg transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600/80 backdrop-blur hover:bg-blue-700 rounded-lg transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
