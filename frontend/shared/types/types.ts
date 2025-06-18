export interface Chapter {
    id: string;
    attributes: {
      chapter: string;
      title: string;
      volume: string;
      pages: number;
      publishAt: string;
      id: string;
    };
  }

interface MangaRelationship {
    type: string;
    id: string;
    attributes: {
      fileName: string;
      name?: string;
      [key: string]: any;
    };
  }

export   interface Manga {
    id: string;
    attributes: {
      title: {
        en: string;
      };
      description: {
        en: string;
      };
      tags: Array<{
        attributes: {
          name: {
            en: string;
          };
        };
      }>;
      lastChapter?: string;
      updatedAt?: string;
    };
    relationships: MangaRelationship[];
  }