import { getCacheKey } from '../cache';

describe('getCacheKey', () => {
  it('should generate key', () => {
    expect(getCacheKey('table', 0, 1, 2, ['1', '2'])).toMatchSnapshot();
    expect(getCacheKey('table', 0, 1, 2, ['2', '1'])).toMatchSnapshot();
  });
});
