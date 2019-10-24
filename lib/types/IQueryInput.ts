import { TileRequest } from '../../types/TileRequest';

export interface IQueryInput extends TileRequest {
  maxZoomLevel: number;
  table: string;
  geometry: string;
  resolution: number;
  attributes: string[];
  query: string[];
}
