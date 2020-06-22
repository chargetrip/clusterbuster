import {
  GetLevelClusterQuery,
  GetLevelGroupQuery,
  ILevelClusterQuery,
  ILevelGroupQuery,
} from '../types/index';

/**
 * @description The default level query builder
 */
export const defaultGetLevelClusterQuery: GetLevelClusterQuery = ({
  parentTable,
  zoomLevel,
  radius,
  attributes,
  zoomToDistance,
}: ILevelClusterQuery) => `
SELECT
  center,
  expansionZoom,
  clusterNo AS previousClusterNo,
  size,
  ST_ClusterDBSCAN(center, ${zoomToDistance(
    zoomLevel,
    radius
  )}, 1) over () as clusters${attributes}
FROM ${parentTable}
`;

/**
 * @description The default level query builder
 */
export const defaultGetLevelGroupQuery: GetLevelGroupQuery = ({
  zoomLevel,
  attributes,
}: ILevelGroupQuery) => `
SELECT
  SUM(size) as size,
  clusters AS clusterNo,
  (
    CASE COUNT(previousClusterNo) 
      WHEN 1 THEN FIRST(expansionZoom) 
      ELSE ${zoomLevel + 1} END
  ) AS expansionZoom, ${attributes}
  ST_Centroid(ST_Collect(center)) as center
FROM clustered_${zoomLevel}
GROUP BY clusters
`;
