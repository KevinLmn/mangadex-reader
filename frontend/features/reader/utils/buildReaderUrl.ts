export function buildReaderUrl(mangaId: string, chapterId: string, page: number) {
    return `/${mangaId}/chapter/${chapterId}/${page}`;
  }