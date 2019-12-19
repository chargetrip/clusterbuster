import { Cache } from '../cache';

jest.mock('ioredis');
jest.mock('lru-cache');

describe('getCacheKey', () => {
  it('should generate key', () => {
    const cache = Cache();
    expect(cache.getCacheKey('table', 0, 1, 2, ['1', '2'])).toMatchSnapshot();
    expect(cache.getCacheKey('table', 0, 1, 2, ['2', '1'])).toMatchSnapshot();
  });
});

describe('getCacheValue', () => {
  it('should get no value', async () => {
    const cache = Cache({
      enabled: false,
      enable: false,
    });
    expect(await cache.getCacheValue('key')).toMatchSnapshot();
  });

  it('should get lru with a value', async () => {
    const cache = Cache({
      enabled: true,
      enable: true,
      type: 'lru-cache',
    });
    expect(await cache.getCacheValue('key')).toMatchSnapshot();
  });

  it('should get redis with a value', async () => {
    const cache = Cache({
      enabled: true,
      enable: true,
      type: 'redis',
    });
    expect(await cache.getCacheValue('key')).toMatchSnapshot();
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
