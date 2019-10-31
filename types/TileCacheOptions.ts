import { Options } from 'lru-cache';
import { ClientOpts } from 'redis';

export interface TileCacheOptions {
  /**
   * @description Flag which indicate if the cache should be enabled. Default is true.
   */
  enable?: boolean;

  /**
   * @description The type of the cache. Default is lru-cache
   */
  type?: 'lru-cache' | 'redis';

  /**
   * @description LRU cache options
   */
  lruOptions?: Options;

  /**
   * @description Redis connect options
   */
  redisOptions?: ClientOpts & {
    /**
     * @description The time to live in seconds. Default is 86400 (1 day)
     */
    ttl?: number;
  };
}
