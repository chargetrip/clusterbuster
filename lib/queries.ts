import { IQueryInput } from './types/IQueryInput';
import { sql } from 'slonik';
import { ZoomToDistance } from '../types/ZoomToDistance';

/**
 * @description This query returns a tile with only points
 */
const unclusteredQuery = ({
  x,
  y,
  z,
  table,
  geometry,
  maxZoomLevel,
  sourceLayer,
  extent,
  bufferSize,
  attributes,
  query,
}: {
  x: number;
  y: number;
  z: number;
  table: string;
  geometry: string;
  sourceLayer: string;
  maxZoomLevel: number;
  extent: number;
  bufferSize: number;
  attributes: string[];
  query: string[];
}) =>
  sql`
WITH filtered AS
    (SELECT ${sql.raw(table)}.${sql.raw(geometry)} ${sql.raw(
    attributesToSelect(attributes)
  )}
    FROM ${sql.raw(table)}
    WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${sql.raw(
    geometry
  )}, 3857))
      ${sql.raw(query.length > 0 ? `AND ${query.join(' AND ')}` : '')}
    ),
    q as
    (SELECT 1 as c1,
            ST_AsMVTGeom(ST_Transform(${sql.raw(
              geometry
            )}, 3857), TileBBox(${z}, ${x}, ${y}, 3857), ${extent}, ${bufferSize}, false) AS geom,
            jsonb_build_object('count', 1, 'expansionZoom', ${sql.raw(
              `${maxZoomLevel}`
            )},'lng', ST_X (ST_Transform(${sql.raw(
              geometry
            )}, 4326)),'lat', ST_Y (ST_Transform(${sql.raw(
              geometry
            )}, 4326))${sql.raw(attributesToArray(attributes))}) AS attributes
     FROM filtered)
SELECT ST_AsMVT(q, ${sourceLayer}, ${extent}, 'geom') as mvt
from q
`;

/**
 * This query applies clustering per zoom zoomlevel between maxZoomLevel and the requested z zoomLevel
 */
const baseClusteredQuery = ({
  filterBlock,
  z,
  x,
  y,
  sourceLayer,
  extent,
  bufferSize,
  attributes = [],
}: {
  filterBlock: string;
  z: number;
  x: number;
  y: number;
  sourceLayer: string;
  extent: number;
  bufferSize: number;
  attributes: string[];
}) => sql`
    ${filterBlock}
     tiled as
    (SELECT center,
            expansionZoom,
            theCount ${sql.raw(attributesToSelect(attributes))}
     ${sql.raw(`FROM grouped_clusters_${z}`)}
     WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(center, 3857))),
     q as
    (SELECT 1 as c1,
            ST_AsMVTGeom(ST_Transform(center, 3857), TileBBox(${z}, ${x}, ${y}, 3857), ${extent}, ${bufferSize}, false) AS geom,
            jsonb_build_object('count', theCount, 'expansionZoom', expansionZoom,'lng', ST_X (ST_Transform(center, 4326)),'lat', ST_Y (ST_Transform(center, 4326))${sql.raw(
              attributesToArray(attributes)
            )}) as attributes
     FROM tiled)
SELECT ST_AsMVT(q, ${sourceLayer}, ${extent}, 'geom') as mvt
from q
`;

/**
 * Creates the initial point level and the cluster at the first zoom level that needs clustering
 */
const filterBlock = ({
  x,
  y,
  z,
  maxZoomLevel,
  radius,
  table,
  geometry,
  query,
  attributes,
  additionalLevels,
  zoomToDistance,
}: {
  x: number;
  y: number;
  z: number;
  maxZoomLevel: number;
  radius: number;
  table: string;
  geometry: string;
  query: string[];
  attributes: string[];
  additionalLevels: string;
  zoomToDistance: (zoomLevel: number, radius: number) => number;
}) =>
  sql`
  with filtered as
    (SELECT ${sql.raw(table)}.${sql.raw(geometry)}, 1 as theCount ${sql.raw(
    attributesToSelect(attributes)
  )}
    FROM ${sql.raw(table)}
    WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${sql.raw(
    geometry
  )}, 3857))
        ${sql.raw(query.length > 0 ? `AND ${query.join(' AND ')}` : '')}
    ),
    ${sql.raw(`clustered_${maxZoomLevel}`)} AS
    (SELECT ${sql.raw(geometry)} as center,
        theCount,
        ${sql.raw(
          `ST_ClusterDBSCAN(${geometry}, ${zoomToDistance(
            maxZoomLevel,
            radius
          )}, 1) over () AS clusters`
        )}
        ${sql.raw(attributesToSelect(attributes))}
    FROM filtered),
    ${sql.raw(`grouped_clusters_${maxZoomLevel}`)} AS
    (SELECT SUM(theCount) AS theCount,
            clusters AS clusterNo,
            ${sql.raw(`${maxZoomLevel + 1}`)} AS expansionZoom,
      ${sql.raw(attributesFirstToSelect(attributes))}
      ST_Centroid(ST_Collect(center)) AS center
    ${sql.raw(`FROM clustered_${maxZoomLevel}`)}
    GROUP BY clusters),
    ${sql.raw(additionalLevels)}
`;

/**
 * Creates an SQL fragment for the particular zoomLevel depending on zoomLevel - 1 for its data
 */
const additionalLevel = ({
  zoomLevel,
  radius,
  attributes,
  zoomToDistance,
}: {
  zoomLevel: number;
  radius: number;
  attributes: string[];
  zoomToDistance: ZoomToDistance;
}) => `
    clustered_${zoomLevel} AS
        (SELECT center,
            expansionZoom,
            clusterNo AS previousClusterNo,
            theCount,
            ST_ClusterDBSCAN(center, ${zoomToDistance(
              zoomLevel,
              radius
            )}, 1) over () as clusters ${attributesToSelect(attributes)}
        FROM grouped_clusters_${zoomLevel + 1}),
    grouped_clusters_${zoomLevel} AS
        (SELECT SUM(theCount) as theCount,
                clusters AS clusterNo,
                (CASE COUNT(previousClusterNo) WHEN 1 THEN FIRST(expansionZoom) ELSE ${zoomLevel +
                  1} END) AS expansionZoom,
            ${attributesFirstToSelect(attributes)}
            ST_Centroid(ST_Collect(center)) as center
        FROM clustered_${zoomLevel}
        GROUP BY clusters),
`;

/**
 * Calculates the eps applied to ST_ClusterDBSCAN for the zoomLevel based on a specified radius
 */
export const zoomToDistance = (zoomLevel: number, radius: number = 15) =>
  radius / Math.pow(2, zoomLevel);

/**
 * Creates an SQL fragment of the dynamic attributes to an sql select statement
 */
const attributesToSelect = attributes =>
  attributes.length > 0 ? `, ${attributes.join(', ')}` : '';

/**
 * Creates an SQL fragmemt which selects the first value of an attribute using the FIRST aggregate function
 */
const attributesFirstToSelect = attributes =>
  attributes.length > 0
    ? `${attributes
        .map(attribute => `FIRST(${attribute}) as ${attribute}`)
        .join(', ')},`
    : '';

/**
 * Creates an SQL fragment that selects the dynamic attributes to be used by each zoom level query
 */
const attributesToArray = attributes =>
  attributes.length > 0
    ? ', ' +
      attributes.map(attribute => `'${attribute}', ${attribute}`).join(', ')
    : '';

/**
 * Compiles the query request to a SQL query
 */
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
  zoomToDistance,
}: IQueryInput) {
  if (z < maxZoomLevel) {
    // Clustered multi-zoom level case
    let additionalLevels = '';
    for (let i = maxZoomLevel - 1; i >= z; --i) {
      additionalLevels += additionalLevel({
        zoomLevel: i,
        radius,
        attributes,
        zoomToDistance
      });
    }
    const ret = baseClusteredQuery({
      filterBlock: filterBlock({
        z,
        x,
        y,
        maxZoomLevel,
        radius,
        table,
        geometry,
        query,
        additionalLevels,
        attributes,
        zoomToDistance,
      }),
      z,
      x,
      y,
      sourceLayer,
      extent,
      bufferSize,
      attributes,
    });
    debug && console.log(ret.sql);
    debug && console.log(ret.values);
    return ret;
  } else {
    // Unclustered case
    const ret = unclusteredQuery({
      x,
      y,
      z,
      table,
      geometry,
      sourceLayer,
      maxZoomLevel,
      extent,
      bufferSize,
      attributes,
      query,
    });
    debug && console.log(ret.sql);
    debug && console.log(ret.values);
    return ret;
  }
}
