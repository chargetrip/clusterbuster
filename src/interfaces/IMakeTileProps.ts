/**
 * @description Input data for the make tile action
 */
export interface IMakeTileProps<T> {
  /**
   * @description The zoom level
   */
  z: number;

  /**
   * @description The tile x value
   */
  x: number;

  /**
   * @description The tile y value
   */
  y: number;

  /**
   * @description The name of the table
   */
  table?: string;

  /**
   * @description The geometry column name
   */
  geometry?: string;

  /**
   * @description The filters to apply
   */
  filters?: T;

  /**
   * @description Unique ID of the request
   */
  id?: string;
}
