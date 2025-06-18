export function usePaginationRange(totalPages: number, page: number): (number | string)[] {
  const range: (number | string)[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      range.push(i);
    }
  } else {
    if (page > 3 && page < totalPages - 2) {
      range.push(1, '...', page - 1, page, page + 1, '...', totalPages);
    } else if (page > 3 && page === totalPages - 1) {
      range.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    } else if (page > 3 && page === totalPages - 2) {
      range.push(1, '...', page - 1, page, page + 1, page + 2);
    } else if (page > 3 && page === totalPages) {
      range.push(1, '...', totalPages - 1, totalPages);
    } else if (page === 3) {
      range.push(1, 2, 3, 4, '...', totalPages);
    } else {
      range.push(1, 2, 3, '...', totalPages);
    }
  }

  return range;
}