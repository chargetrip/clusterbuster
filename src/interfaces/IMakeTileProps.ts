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
   * @description The name of the table, default is "public.points"
   */
  table?: string;

  /**
   * @description The geometry column name, default is "location"
   */
  geometry?: string;

  /**
   * @description The filters to apply, default is none
   */
  filters?: T;

  /**
   * @description Unique ID of the request, default is an empty string
   */
  id?: string;
}
