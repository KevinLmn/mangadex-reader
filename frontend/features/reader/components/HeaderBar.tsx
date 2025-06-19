import Link from "next/link";
import { Quality } from "../constants/constants";
import { Button } from "@/shared/components/Button";

interface HeaderBarProps {
    id: string;
    page: number;
    total: number;
    quality: Quality;
    onToggleQuality: () => void;
    onShowShortcuts: () => void;
  }
  
  export function HeaderBar({ id, page, total, quality, onToggleQuality, onShowShortcuts }: HeaderBarProps) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm h-14">
        <div className="container mx-auto px-4 h-full flex justify-between items-center">
          <Link href={`/${id}`}>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 font-medium text-white/90 hover:text-white">
              ← Back to Chapter List
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-white/80">
              Page {page} of {total}
            </div>
            <Button variant="outline" size="sm" onClick={onToggleQuality} className="border-gray-700 text-white hover:bg-gray-800">
              Quality: {quality === Quality.HIGH ? 'High' : 'Low'}
            </Button>
            <Button variant="outline" size="sm" onClick={onShowShortcuts} className="border-gray-700 text-white hover:bg-gray-800">
              Shortcuts
            </Button>
          </div>
        </div>
      </header>
    );
  }
  