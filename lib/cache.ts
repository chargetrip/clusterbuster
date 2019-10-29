import LRU from 'lru-cache';
import redis, { RedisClient } from 'redis';
import sha1 from 'sha1';
import { TileCacheOptions } from '../types';
import { gps2tile } from './gps';

let lruCache = null;
let redisCache: RedisClient = null;

/**
 * @description The default options for the cache
 */
export const defaultCacheOptions: TileCacheOptions = {
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
    url: process.env.REDIS_URL,
    return_buffers: true,
  },
};

/**
 * @description Init the cache system
 *
 * @param {TileCacheOptions} options The cache options
 */
export async function initCache(
  options: TileCacheOptions = defaultCacheOptions
): Promise<void> {
  if (!options.enable) {
    return;
  }

  if (options.type === 'lru-cache') {
    lruCache = new LRU({
      ...defaultCacheOptions.lruOptions,
      ...options.lruOptions,
    });
  } else if (options.type === 'redis') {
    redisCache = redis.createClient({
      ...defaultCacheOptions.redisOptions,
      ...options.redisOptions,
      ...{ return_buffers: true },
    });
  }
}

/**
 * @description Close the cache system
 *
 * @param {TileCacheOptions} options The cache options
 */
export async function closeCache(
  options: TileCacheOptions = defaultCacheOptions
): Promise<void> {
  if (!options.enable) {
    return;
  }

  if (options.type === 'lru-cache') {
    // Nothing to do here
  } else if (options.type === 'redis') {
    await new Promise((resolve, reject) =>
      redisCache.quit(error => (!error ? resolve() : reject(error)))
    );
  }
}

/**
 * @description Get the cache key for a table and tile data
 *
 * @param {string} table The cache table name
 * @param {number} z The tile zoom level
 * @param {number} x The tile x position
 * @param {number} y The tile y position
 * @returns The cache key
 */
export function getCacheKey(
  table: string,
  z: number,
  x: number,
  y: number
): string {
  return `${table}-${z}-${x}-${y}`;
}

/**
 * @description Get the cache filters key from the where statement of the filters
 *
 * @param {string[]} filters The where statement
 * @returns The cache filters key
 */
export function getCacheFiltersKey(filters: string[]): string {
  return sha1(filters.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0)).join('-'));
}

/**
 * @description Get the cache value of a cache key
 *
 * @param {string} key The cache key
 * @param {string} filtersKey The cache filters key
 * @param {TileCacheOptions} options The cache options
 * @returns The cache value or null if not found or disabled
 */
export async function getCacheValue(
  key: string,
  filtersKey: string,
  options: TileCacheOptions = defaultCacheOptions
): Promise<any> {
  if (!options.enable) {
    return null;
  }

  if (options.type === 'lru-cache') {
    return lruCache.get(key);
  }

  if (options.type === 'redis') {
    return await new Promise((resolve, reject) => {
      redisCache.hget(key, filtersKey, (error, value) => {
        if (error) {
          return reject(error);
        }
        resolve(value);
      });
    });
  }

  // Invalid type
  return null;
}

/**
 * @description Set the cache value for a cache key
 *
 * @param {string} key The cache key
 * @param {string} filtersKey The cache filters key
 * @param {any} value The cache value
 * @param {TileCacheOptions} options The cache options
 */
export async function setCacheValue(
  key: string,
  filtersKey: string,
  value: any,
  options: TileCacheOptions = defaultCacheOptions
): Promise<void> {
  if (!options.enable) {
    return;
  }

  if (options.type === 'lru-cache') {
    lruCache.set(key);

    return;
  }

  if (options.type === 'redis') {
    await new Promise((resolve, reject) => {
      redisCache.hset(key, filtersKey, value, error => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });

    if (!!options.redisOptions.ttl) {
      // If we have TTL, we apply it
      await new Promise((resolve, reject) => {
        redisCache.expire(key, options.redisOptions.ttl, error =>
          !error ? resolve() : reject(error)
        );
      });
    }

    return;
  }
}

/**
 * @description Invalidate a cache for a tile. LRU Cache don't allow invalidation.
 *
 * @param {string} table The tile table name
 * @param {number} z The tile zoom level
 * @param {number} x The tile x position
 * @param {number} y The tile y position
 * @param {TileCacheOptions} options The cache options
 */
export async function invalidateCache(
  table: string,
  z: number,
  x: number,
  y: number,
  options: TileCacheOptions = defaultCacheOptions
): Promise<void> {
  if (!options.enable) {
    return;
  }

  if (options.type === 'lru-cache') {
    // We cannot invalidate this one
    return;
  }

  if (options.type === 'redis') {
    if (redisCache === null) {
      // If the cache was not init, we init it here
      await initCache(options);
    }

    const keyPattern = getCacheKey(table, z, x, y) + '*',
      keys = await new Promise<string[]>((resolve, reject) =>
        redisCache.keys(keyPattern, (error, value: string[]) => {
          if (error) {
            return reject(error);
          }

          resolve(value);
        })
      );

    for (const key of keys) {
      try {
        await new Promise((resolve, reject) =>
          redisCache.del(key, error => (!error ? resolve() : reject(error)))
        );
      } catch (e) {
        // Ignore this, for now
      }
    }
  }
}

/**
 * @description Invalidate all the caches for a GPS location, for all the zoom levels. LRU Cache don't allow invalidation.
 *
 * @param {string} table The cache table name
 * @param {number} latitude The GPS latitude
 * @param {number} longitude The GPS longitude
 * @param {TileCacheOptions} options The cache options
 */
export async function invalidateCacheOfGPS(
  table: string,
  latitude: number,
  longitude: number,
  options: TileCacheOptions = defaultCacheOptions
): Promise<void> {
  if (!options.enable) {
    return;
  }

  if (options.type === 'lru-cache') {
    // We cannot invalidate this one
    return;
  }

  if (options.type === 'redis') {
    for (let zoom = 0; zoom <= 21; zoom++) {
      const { x, y } = gps2tile(latitude, longitude, zoom);

      await invalidateCache(table, zoom, x, y, options);
    }
  }
}
