export interface ICreateQueryForTileProps {
  z: number;
  x: number;
  y: number;
  maxZoomLevel: number;
  table: string;
  geometry: string;
  resolution: number;
  attributes: string[];
  query: string[];
}
