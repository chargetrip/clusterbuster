import { ZoomToDistance } from '../ZoomToDistance';

/**
 * @description Input interface for the level cluster query builder
 */
export interface ILevelClusterQuery {
  parentTable: string;
  zoomLevel: number;
  radius: number;
  attributes: string;
  zoomToDistance: ZoomToDistance;
}

/**
 * @description The level cluster query builder callback definition
 */
export type GetLevelClusterQuery = (input: ILevelClusterQuery) => string;

/**
 * @description Input interface for the level group query builder
 */
export interface ILevelGroupQuery {
  zoomLevel: number;
  attributes: string;
}

/**
 * @description The level group query builder callback definition
 */
export type GetLevelGroupQuery = (input: ILevelGroupQuery) => string;
