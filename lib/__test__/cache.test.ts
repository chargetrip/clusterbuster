const { getCacheKey } = require('../cache');

describe('getCacheKey', () => {
  it('should generate key', () => {
    expect(getCacheKey('table', 0, 1, 2, ['1', '2'])).toMatchSnapshot();
  });
});
