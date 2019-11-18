import { TileRequest } from '../../types/TileRequest';

export interface IQueryInput extends TileRequest {
  maxZoomLevel: number;
  table: string;
  geometry: string;
  sourceLayer: string;
  radius: number;
  resolution: number;
  attributes: string[];
  query: string[];
  debug: boolean;
}
