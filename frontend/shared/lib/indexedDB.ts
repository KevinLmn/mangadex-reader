import Dexie from 'dexie';

const CACHE_DURATION = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
  IMAGE: 7 * 24 * 60 * 60 * 1000, // 7 days
};

interface ImageEntry {
  key: string;
  blob: Blob;
  timestamp: number;
}

interface TotalPagesEntry {
  key: string;
  value: string;
  timestamp: number;
}

class MangaDB extends Dexie {
  images!: Dexie.Table<ImageEntry, string>;
  totalPages!: Dexie.Table<TotalPagesEntry, string>;

  constructor() {
    super('mangaDB');
    this.version(1).stores({
      images: 'key, timestamp',
      totalPages: 'key, timestamp',
    });
  }
}

const db = new MangaDB();

export const setImageInDB = async (key: string, blob: Blob): Promise<boolean> => {
  try {
    const timestamp = Date.now();
    await db.images.put({ key, blob, timestamp });
    return true;
  } catch (error) {
    console.error('Failed to store image in IndexedDB:', error);
    return false;
  }
};

export const getImageFromDB = async (key: string): Promise<Blob | null> => {
  try {
    const entry = await db.images.get(key);
    return entry ? entry.blob : null;
  } catch (error) {
    console.error('Failed to retrieve image from IndexedDB:', error);
    return null;
  }
};

export const setTotalPagesInDB = async (key: string, value: number): Promise<boolean> => {
  try {
    const timestamp = Date.now();
    await db.totalPages.put({ key, value: String(value), timestamp });
    return true;
  } catch (error) {
    console.error('Failed to store total pages in IndexedDB:', error);
    return false;
  }
};

export const getTotalPagesFromDB = async (key: string): Promise<number | null> => {
  try {
    const entry = await db.totalPages.get(key);
    return entry ? Number(entry.value) : null;
  } catch (error) {
    console.error('Failed to retrieve total pages from IndexedDB:', error);
    return null;
  }
};

export const cleanOldEntries = async (): Promise<void> => {
  try {
    const now = Date.now();

    // Clean up images more aggressively
    const oldImages = await db.images
      .where('timestamp')
      .below(now - CACHE_DURATION.SHORT)
      .toArray();

    if (oldImages.length > 0) {
      await db.images.bulkDelete(oldImages.map(image => image.key));
      console.log(`Cleaned ${oldImages.length} old images from cache`);
    }

    // Keep total pages entries longer
    const oldTotalPages = await db.totalPages
      .where('timestamp')
      .below(now - CACHE_DURATION.MEDIUM)
      .toArray();

    if (oldTotalPages.length > 0) {
      await db.totalPages.bulkDelete(oldTotalPages.map(entry => entry.key));
      console.log(`Cleaned ${oldTotalPages.length} old total pages entries from cache`);
    }

    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  } catch (error) {
    console.error('Error cleaning old entries from IndexedDB:', error);
  }
};

const clearDatabase = async (): Promise<void> => {
  try {
    await db.images.clear();
    await db.totalPages.clear();
    console.log('IndexedDB storage cleared');
  } catch (error) {
    console.error('Failed to clear IndexedDB storage:', error);
  }
};
