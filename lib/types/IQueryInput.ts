import { TileRequest } from '../../types/TileRequest';

export interface IQueryInput extends TileRequest {
  maxZoomLevel: number;
  table: string;
  geometry: string;
  sourceLayer: string;
  resolution: number;
  attributes: string[];
  query: string[];
}
