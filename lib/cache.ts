import sha1 from 'sha1';
import { TileCacheOptions, TTtl } from './types/index';

/**
 * @description The default options for the cache
 */
export const defaultCacheOptions: TileCacheOptions = {
  enabled: true,
  type: 'lru-cache',
  lruOptions: {
    max: 100000,
    length: function(n, key) {
      return n * 2 + key.length;
    },
    maxAge: 1000 * 60 * 60,
  },
  redisOptions: {
    ttl: 86400, // 24 hours
    host: process.env.REDIS_HOST,
  },
};

export function Cache(
  customCacheOptions: TileCacheOptions = defaultCacheOptions
) {
  let lruCache: any = null;
  let redisCache: any = null;
  const cacheOptions = {
    ...defaultCacheOptions,
    ...customCacheOptions,
    lruOptions: {
      ...defaultCacheOptions.lruOptions,
      ...customCacheOptions.lruOptions,
    },
    redisOptions: {
      ...defaultCacheOptions.redisOptions,
      ...customCacheOptions.redisOptions,
      dropBufferSupport: false,
    },
  };

  if (cacheOptions.enabled) {
    if (cacheOptions.type === 'lru-cache') {
      const LRU = require('lru-cache');
  
      lruCache = new LRU(cacheOptions.lruOptions);
    } else if (cacheOptions.type === 'redis') {
      const Redis = require('ioredis');
  
      redisCache = new Redis(cacheOptions.redisOptions);
    }
  }

  return {
    /**
     * @description Get the cache key for a table, tile data and where statement of the filters
     *
     * @param {string} table The cache table name
     * @param {number} z The tile zoom level
     * @param {number} x The tile x position
     * @param {number} y The tile y position
     * @param {string[]} filters The where statement
     * @returns The cache key
     */
    getCacheKey: (
      table: string,
      z: number,
      x: number,
      y: number,
      filters: string[]
    ): string | null => {
      if (!cacheOptions.enabled) {
        return null;
      }
      const where = sha1(
        filters.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)).join('-')
      );

      return `${table}-${z}-${x}-${y}-${where}`;
    },

    /**
     * @description Get the cache value of a cache key
     *
     * @param {string} key The cache key
     * @returns The cache value or null if not found or disabled
     */
    getCacheValue: async (key: string): Promise<any> => {
      if (!cacheOptions.enabled) {
        return null;
      }

      if (cacheOptions.type === 'lru-cache') {
        return lruCache.get(key);
      }

      if (cacheOptions.type === 'redis') {
        return await redisCache.getBuffer(key);
      }

      // Invalid type
      return null;
    },
    /**
     * @description Set the cache value for a cache key
     *
     * @param {string} key The cache key
     * @param {any} value The cache value
     * @param {number} zoomLevel The zoom level requested
     * @param {number | TTtl} ttl The time to leave of the cache
     */
    setCacheValue: async (
      key: string,
      value: any,
      ttl?: number
    ): Promise<void> => {
      if (!cacheOptions.enabled) {
        return;
      }

      if (cacheOptions.type === 'lru-cache') {
        lruCache.set(key, value);
      } else if (cacheOptions.type === 'redis') {
        if (!!ttl) {
          await redisCache.set(key, value, 'EX', ttl);
        } else {
          await redisCache.set(key, value);
        }
      }
    },

    /**
     * @description Get the cache TTL from the zoom level and request cache TTL or config cache TTL
     *
     * @param {number} zoomLevel The zoom level requested
     * @param {number | TTtl} ttl The time to leave of the cache
     */
    getCacheTtl: (zoomLevel: number, ttl?: number | TTtl): number => {
      if (
        !cacheOptions.enabled ||
        cacheOptions.type !== 'redis'
      ) {
        return 0;
      }

      const requestTtl = ttl || cacheOptions.redisOptions.ttl;

      if (!!requestTtl) {
        return !isNaN(requestTtl as number)
          ? (requestTtl as number)
          : (requestTtl as TTtl)(zoomLevel);
      }

      return 0;
    },
  };
}
