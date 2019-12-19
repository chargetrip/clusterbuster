import { Cache } from '../cache';

describe('getCacheKey', () => {
  it('should generate key', () => {
    const cache = Cache();
    expect(cache.getCacheKey('table', 0, 1, 2, ['1', '2'])).toMatchSnapshot();
    expect(cache.getCacheKey('table', 0, 1, 2, ['2', '1'])).toMatchSnapshot();
  });
});

describe('getCacheTtl', () => {
  const cache = Cache({
      enabled: true,
      enable: true,
      type: 'redis',
      redisOptions: {
        ttl: 3600,
      },
    }),
    zoomLevelCache = [3600, 2400, 1800];

  it('should use global ttl', () => {
    expect(cache.getCacheTtl(0)).toMatchSnapshot();
  });

  it('should use request ttl as number', () => {
    expect(cache.getCacheTtl(0, 1800)).toMatchSnapshot();
  });

  it('should use request ttl as function', () => {
    expect(cache.getCacheTtl(0, () => 2400)).toMatchSnapshot();
  });

  it('should use request ttl from array', () => {
    for (const z of [0, 1, 2, 3, 4, 5]) {
      expect(
        cache.getCacheTtl(z, (zoomLevel: number) =>
          typeof zoomLevelCache[zoomLevel] !== 'undefined'
            ? zoomLevelCache[zoomLevel]
            : 0
        )
      ).toMatchSnapshot();
    }
  });
});
