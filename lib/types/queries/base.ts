/**
 * @description Input interface for the base query builder
 */
export interface IBaseQueryInput {
  x: number;
  y: number;
  z: number;
  table: string;
  geometry: string;
  maxZoomLevel: number;
  attributes: string;
  query: string[];
}

/**
 * @description The base query builder callback definition
 */
export type GetBaseQuery = (input: IBaseQueryInput) => string;
