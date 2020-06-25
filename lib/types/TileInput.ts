import { GetBaseQuery } from './queries/index';
import { TileRequest } from './TileRequest';
import { TTtl } from './TTtl';
import { ZoomToDistance } from './ZoomToDistance';

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
   * @description The cluster radius in pixels. Default is 15
   */
  radius?: number;

  /**
   * @description The tile extent is the grid dimension value as specified by ST_AsMVT. The default is 4096.
   * @see https://postgis.net/docs/ST_AsMVT.html
   */
  extent?: number;

  /**
   * @description The buffer around the tile extent in the number of grid cells as specified by ST_AsMVT. The default is 256.
   * @see https://postgis.net/docs/ST_AsMVT.html
   */
  bufferSize?: number;

  /**
   * @description The query parameters used to filter
   */
  queryParams?: T | {};

  /**
   * @description Unique ID of the request, default is an empty string
   */
  id?: string;

  /**
   * @description Mapping function from zoomLevel to eps distance in ST_ClusterDBSCAN
   * Default is `(zoomLevel: number, radius: number = 15) => radius / Math.pow(2, zoomLevel);`
   * and should be sufficient for most scenario's. Override this function can be useful to tweak
   * cluster radius for specific zoom levels.
   *
   */
  zoomToDistance?: ZoomToDistance;

  /**
   * @description Function which create the based query with applied filters
   * Default is using the table name to select from and add the intersect within the BBox of the tiles,
   * also add the filters to where in the query
   * Be aware, if you overwrite this you need to make sure the result return the following columns:
   * - "geometry" AS center
   * - 1 AS size
   * - 0 AS clusterNo
   * - "maxZoomLevel + 1" AS expansionZoom
   * - all the attibutes from the list
   */
  getBaseQuery?: GetBaseQuery;

  /**
   * @description The highest zoom level at which data is clustered.
   * Any tile requests at zoom levels higher than this will return individual points only.
   * This will overwrite the `maxZoomLevel` provided to the server initialization
   */
  maxZoomLevel?: number;

  /**
   * @description Optional cache TTL to overwrite the server cache configuration
   */
  cacheTtl?: number | TTtl;
}
