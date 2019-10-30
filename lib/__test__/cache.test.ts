import { Cache } from '../cache';

describe('getCacheKey', () => {
  it('should generate key', () => {
    const cache = new Cache();
    expect(cache.getCacheKey('table', 0, 1, 2, ['1', '2'])).toMatchSnapshot();
    expect(cache.getCacheKey('table', 0, 1, 2, ['2', '1'])).toMatchSnapshot();
  });
});
