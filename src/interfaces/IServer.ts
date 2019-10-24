import { Options } from 'lru-cache';

/**
 * @description Input data for the server action
 */
export interface IServer<T> {
  /**
   * @description The max zoom level of clustering data, default is 12
   */
  maxZoomLevel?: number;

  /**
   * @description The tile resolution in pixels, default is 512, but try 256 if you
   * are unsure what your mapping front-end library uses
   */
  resolution?: number;

  /**
   * @description LRU Cache options
   */
  cacheOptions?: Options;

  /**
   * @description Optional callback to map the filters to where conditions in PostGreSQL
   */
  filtersToWhere?: (filters: T) => string[];

  /**
   * @description ???
   */
  attributes: string[];
}
