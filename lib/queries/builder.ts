import {
  GetBaseQuery,
  GetLevelClusterQuery,
  GetLevelGroupQuery,
  GetTileQuery,
  TileRequest,
  ZoomToDistance,
} from '../types/index';
import {
  attributesFirstToSelect,
  attributesToArray,
  attributesToSelect,
} from './attributes';
import { defaultGetBaseQuery } from './base';
import {
  defaultGetLevelClusterQuery,
  defaultGetLevelGroupQuery,
} from './level';
import { defaultGetTileQuery } from './tile';
import { defaultZoomToDistance } from './zoom';

export interface ITileQueryInput extends TileRequest {
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
  zoomToDistance?: ZoomToDistance;
  getBaseQuery?: GetBaseQuery;
  getTileQuery?: GetTileQuery;
  getLevelClusterQuery?: GetLevelClusterQuery;
  getLevelGroupQuery?: GetLevelGroupQuery;
}

export function createQueryForTile({
  z,
  x,
  y,
  maxZoomLevel,
  table,
  geometry,
  sourceLayer,
  radius,
  extent,
  bufferSize,
  attributes,
  query,
  debug,
  zoomToDistance = defaultZoomToDistance,
  getBaseQuery = defaultGetBaseQuery,
  getTileQuery = defaultGetTileQuery,
  getLevelClusterQuery = defaultGetLevelClusterQuery,
  getLevelGroupQuery = defaultGetLevelGroupQuery,
}: ITileQueryInput): string {
  const queryParts: string[] = [];
  queryParts.push(
    `WITH base_query AS (${getBaseQuery({
      x,
      y,
      z,
      table,
      geometry,
      maxZoomLevel,
      attributes: attributesToSelect(attributes),
      query,
    })})`
  );

  let parentTable = 'base_query';
  if (z <= maxZoomLevel) {
    for (let i = maxZoomLevel; i >= z; --i) {
      queryParts.push(
        `clustered_${i} AS (${getLevelClusterQuery({
          parentTable,
          zoomLevel: i,
          radius,
          attributes: attributesToSelect(attributes),
          zoomToDistance,
        })})`
      );

      queryParts.push(
        `grouped_clusters_${i} AS (${getLevelGroupQuery({
          zoomLevel: i,
          attributes: attributesFirstToSelect(attributes),
        })})`
      );

      parentTable = `grouped_clusters_${i}`;
    }
  }

  queryParts.push(
    `tile AS (${getTileQuery({
      x,
      y,
      z,
      table: parentTable,
      geometry: 'center',
      extent,
      bufferSize,
      attributes: attributesToArray(attributes),
    })})`
  );

  const sql: string = `${queryParts.join(
    ',\n'
  )}\nSELECT ST_AsMVT(tile, '${sourceLayer}', ${extent}, 'geom') AS mvt FROM tile`;

  debug && console.log(sql);

  return sql;
}
