/**
 * @description Input interface for the tile query builder
 */
export interface ITileQuery {
  x: number;
  y: number;
  z: number;
  table: string;
  geometry: string;
  extent: number;
  bufferSize: number;
  attributes: string;
}

/**
 * @description The tile query builder callback definition
 */
export type GetTileQuery = (input: ITileQuery) => string;
