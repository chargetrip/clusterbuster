import { getCacheFiltersKey, getCacheKey } from '../cache';

describe('getCacheKey', () => {
  it('should generate key', () => {
    expect(getCacheKey('table', 0, 1, 2)).toMatchSnapshot();
  });
});

describe('getCacheFiltersKey', () => {
  it('should generate key', () => {
    expect(getCacheFiltersKey(['1', '2'])).toMatchSnapshot();
    expect(getCacheFiltersKey(['2', '1'])).toMatchSnapshot();
  });
});
