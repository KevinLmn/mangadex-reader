import { renderHook } from '@testing-library/react';
import { useReaderKeyboardNav } from '@/features/reader/hooks/useReaderKeyboardNav';
import { Quality } from '@/features/reader/constants/constants';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockReset();
});

function fireKey(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
}

const baseProps = {
  id: 'manga-1',
  chapterId: 'ch-1',
  page: 5,
  total: 10,
  quality: Quality.HIGH,
  setQuality: jest.fn(),
};

describe('useReaderKeyboardNav', () => {
  it('navigates to the next page on ArrowRight', () => {
    renderHook(() => useReaderKeyboardNav(baseProps));
    fireKey('ArrowRight');
    expect(pushMock).toHaveBeenCalledWith('/manga-1/chapter/ch-1/6');
  });

  it('navigates to the previous page on ArrowLeft', () => {
    renderHook(() => useReaderKeyboardNav(baseProps));
    fireKey('ArrowLeft');
    expect(pushMock).toHaveBeenCalledWith('/manga-1/chapter/ch-1/4');
  });

  it('also responds to D / A keys', () => {
    renderHook(() => useReaderKeyboardNav(baseProps));
    fireKey('d');
    fireKey('a');
    expect(pushMock).toHaveBeenNthCalledWith(1, '/manga-1/chapter/ch-1/6');
    expect(pushMock).toHaveBeenNthCalledWith(2, '/manga-1/chapter/ch-1/4');
  });

  it('does not navigate before page 1', () => {
    renderHook(() => useReaderKeyboardNav({ ...baseProps, page: 1 }));
    fireKey('ArrowLeft');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('does not navigate past last page', () => {
    renderHook(() => useReaderKeyboardNav({ ...baseProps, page: 10, total: 10 }));
    fireKey('ArrowRight');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('Home jumps to page 1, End jumps to last', () => {
    renderHook(() => useReaderKeyboardNav(baseProps));
    fireKey('Home');
    fireKey('End');
    expect(pushMock).toHaveBeenNthCalledWith(1, '/manga-1/chapter/ch-1/1');
    expect(pushMock).toHaveBeenNthCalledWith(2, '/manga-1/chapter/ch-1/10');
  });

  it('Escape returns to the manga page', () => {
    renderHook(() => useReaderKeyboardNav(baseProps));
    fireKey('Escape');
    expect(pushMock).toHaveBeenCalledWith('/manga-1');
  });

  it('H toggles quality (HIGH → LOW)', () => {
    const setQuality = jest.fn();
    renderHook(() =>
      useReaderKeyboardNav({ ...baseProps, setQuality, quality: Quality.HIGH })
    );
    fireKey('h');
    expect(setQuality).toHaveBeenCalledWith(Quality.LOW);
  });

  it('cleans up the listener on unmount', () => {
    const { unmount } = renderHook(() => useReaderKeyboardNav(baseProps));
    unmount();
    fireKey('ArrowRight');
    expect(pushMock).not.toHaveBeenCalled();
  });
});
