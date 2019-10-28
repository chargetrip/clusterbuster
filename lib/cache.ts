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
 * @description Get the cache key for a table, tile data and filters set
 *
 * @param {string} table The cache table name
 * @param {number} z The tile zoom level
 * @param {number} x The tile x position
 * @param {number} y The tile y position
 * @param {string[]} filters The set of filters where conditions
 * @returns The cache key
 */
export function getCacheKey(
  table: string,
  z: number,
  x: number,
  y: number,
  filters: string[]
): string {
  return `${getCachePrefix(table, z, x, y)}${sha1(filters.join('-'))}`;
}

/**
 * @description Get the cache key prefix
 *
 * @param {string} table The cache table name
 * @param {number} z The tile zoom level
 * @param {number} x The tile x position
 * @param {number} y The tile y position
 * @returns The cache key prefix
 */
function getCachePrefix(
  table: string,
  z: number,
  x: number,
  y: number
): string {
  return `${table}-${z}-${x}-${y}-`;
}

/**
 * @description Get the cache value of a cache key
 *
 * @param {string} key The cache key
 * @param {TileCacheOptions} options The cache options
 * @returns The cache value or null if not found or disabled
 */
export async function getCacheValue(
  key: string,
  options: TileCacheOptions = defaultCacheOptions
): Promise<any> {
  if (!options.enable) {
    return null;
  }

  if (options.type === 'lru-cache') {
    return lruCache.get(key);
  }

  if (options.type === 'redis') {
    return await new Promise((resolve, reject) =>
      redisCache.get(key, (error, value) => {
        if (error) {
          return reject(error);
        }
        resolve(value);
      })
    );
  }

  // Invalid type
  return null;
}

/**
 * @description Set the cache value for a cache key
 *
 * @param {string} key The cache key
 * @param {any} value The cache value
 * @param {TileCacheOptions} options The cache options
 */
export async function setCacheValue(
  key: string,
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
    await new Promise((resolve, reject) =>
      redisCache.set(key, value, error => {
        if (error) {
          return reject(error);
        }

        resolve();
      })
    );

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
    const keyPattern = getCachePrefix(table, z, x, y) + '*',
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
