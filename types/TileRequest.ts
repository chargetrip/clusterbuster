/**
 * The specification of the tile request
 */
export interface TileRequest {
  /**
   * @description The zoom level ranging from 0 - 20
   */
  z: number;

  /**
   * @description The tile x offset on Mercator Projection
   */
  x: number;

  /**
   * @description The tile y offset on Mercator Projection
   */
  y: number;
}
