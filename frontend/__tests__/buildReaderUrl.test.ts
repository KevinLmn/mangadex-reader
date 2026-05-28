import { buildReaderUrl } from '@/features/reader/utils/buildReaderUrl';

describe('buildReaderUrl', () => {
  it('builds the canonical reader path', () => {
    expect(buildReaderUrl('manga-1', 'ch-2', 3)).toBe('/manga-1/chapter/ch-2/3');
  });

  it('handles page 1', () => {
    expect(buildReaderUrl('m', 'c', 1)).toBe('/m/chapter/c/1');
  });

  it('does not encode (caller passes already-safe ids)', () => {
    expect(buildReaderUrl('abc-def', 'xyz', 42)).toBe('/abc-def/chapter/xyz/42');
  });
});
