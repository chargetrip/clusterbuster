import { Options } from 'lru-cache';
import { PoolConfig } from 'pg';

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
   * @description The tile resolution in pixels, default is 512, but try 256 if you
   * are unsure what your mapping front-end library uses
   */
  resolution?: number;

  /**
   * @description LRU tile cache options, each tile request is stored in this cache.
   * super-tiler tries to provide sane defaults
   */
  cacheOptions?: Options;

  /**
   * @description Configuration options for the postgres connection pool
   * super-tiler tries to provide sane defaults
   */
  pgPoolOptions?: PoolConfig;

  /**
   * @description Optional callback to map the filters to where conditions in PostGreSQL
   */
  filtersToWhere?: (filters: T) => string[];

  /**
   * @description Attributes to select from the table
   */
  attributes: string[];
}
