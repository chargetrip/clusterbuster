import { PoolConfig } from 'pg';
import { TileCacheOptions } from './TileCacheOptions';

/**
 * @description Configuration options for the tile server
 */
export interface TileServerConfig<T> {
  /**
   * @description The highest zoom level at which data is clustered.
   * Any tile requests at zoom levels higher than this will return individual points only.
   */
  maxZoomLevel?: number;

  /**
   * @description LRU tile cache options, each tile request is stored in this cache.
   * clusterbuster tries to provide sane defaults
   */
  cacheOptions?: TileCacheOptions;

  /**
   * @description Configuration options for the postgres connection pool
   * clusterbuster tries to provide sane defaults
   */
  pgPoolOptions?: PoolConfig;

  /**
   * @description Optional callback to map the filters to where conditions in PostGreSQL
   */
  filtersToWhere?: (queryParams: T | {}) => string[];

  /**
   * @description Attributes to select from the table
   */
  attributes: string[];

  /**
   * @description Show debug logging, default false
   */
  debug?: boolean;
}
