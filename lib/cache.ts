import sha1 from 'sha1';
import { TileCacheOptions } from '../types';

/**
 * @description The default options for the cache
 */
export const defaultCacheOptions: TileCacheOptions = {
  enabled: true,
  enable: true,
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
    dropBufferSupport: false,
  },
};

export function Cache(options: TileCacheOptions = defaultCacheOptions) {

  let lruCache = null;
  let redisCache = null;

  if (options.type === 'lru-cache') {
    const LRU = require('lru-cache');
    lruCache = new LRU({
      ...defaultCacheOptions.lruOptions,
      ...options.lruOptions,
    });
  } else if (options.type === 'redis') {
    const Redis = require('ioredis');

    redisCache = new Redis({
      ...defaultCacheOptions.redisOptions,
      ...options.redisOptions,
      ...{ dropBufferSupport: false },
    });
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
    ): string => {
      if (!options.enabled || !options.enable) {
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
     * @param {TileCacheOptions} options The cache options
     * @returns The cache value or null if not found or disabled
     */
    getCacheValue: async (key: string): Promise<any> => {
      if (!options.enabled || !options.enable) {
        return null;
      }

      if (options.type === 'lru-cache') {
        return lruCache.get(key);
      }

      if (options.type === 'redis') {
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
     * @param {TileCacheOptions} options The cache options
     */
    setCacheValue: async (key: string, value: any): Promise<void> => {
      if (!options.enabled || !options.enable) {
        return null;
      }

      if (options.type === 'lru-cache') {
        lruCache.set(key);

        return;
      }

      if (options.type === 'redis') {
        if (!!options.redisOptions.ttl) {
          await redisCache.set(key, value, 'EX', options.redisOptions.ttl);
        } else {
          await await redisCache.set(key, value);
        }

        return;
      }
    },
  };
}
