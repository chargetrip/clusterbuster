import { TileRequest } from './TileRequest';
import { ZoomToDistance } from './ZoomToDistance';

export interface IQueryInput extends TileRequest {
  maxZoomLevel: number;
  table: string;
  geometry: string;
  sourceLayer: string;
  radius: number;
  extent: number;
  bufferSize: number;
  attributes: string[];
  query: string[];
  debug: boolean;
  zoomToDistance: ZoomToDistance;
}
