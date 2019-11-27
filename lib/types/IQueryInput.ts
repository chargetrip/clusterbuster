import { TileRequest } from '../../types/TileRequest';
import { ZoomToDistance } from '../../types/ZoomToDistance';

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
