import { TileRequest } from './TileRequest';

/**
 * @description The required input values for the tile renderer
 */
export interface TileInput<T> extends TileRequest {
  /**
   * @description The name of the table, default is "public.points"
   */
  table?: string;

  /**
   * @description The geometry column name, default is "wkb_geometry". This column should be of type Geometry in PostGIS
   */
  geometry?: string;

  /**
   * @description The MVT source layer on which the points are rendered, default is points
   */
  sourceLayer?: string;

  /**
   * @description The cluster radius in pixels. Default is 20
   */
  radius?: number;

  /**
   * @description The query parameters used to filter
   */
  queryParams?: T | {};

  /**
   * @description Unique ID of the request, default is an empty string
   */
  id?: string;
}
