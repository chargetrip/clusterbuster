import { IQueryInput } from './types/IQueryInput';
import { sql } from 'slonik';

/**
 * @description This query returns a tile with only points
 */
const unclusteredQuery = ({
  x,
  y,
  z,
  table,
  geometry,
  sourceLayer,
  resolution,
  attributes,
  query,
}) =>
  sql`
WITH filtered AS
    (SELECT ${table}.${geometry} ${attributesToSelect(attributes)}
    FROM ${sql.raw(table)}
    WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${table}.${geometry}, 3857))
      ${query.length > 0 ? `AND ${query.join(' AND ')}` : ''}
    ),
    q as
    (SELECT 1 as c1,
            ST_AsMVTGeom(ST_Transform(${geometry}, 3857), TileBBox(${z}, ${x}, ${y}, 3857), ${resolution}, 10, false) AS geom,
            jsonb_build_object('count', 1${attributesToArray(
              attributes
            )}) as attributes
     FROM filtered)
SELECT ST_AsMVT(q, '${sourceLayer}', ${resolution}, 'geom') as mvt
from q
`;

/**
 * This query applies clustering per zoom zoomlevel between maxZoomLevel and the requested z zoomLevel
 */
const baseClusteredQuery = ({
  filterBlock,
  additionalLevels,
  z,
  x,
  y,
  sourceLayer,
  resolution,
  attributes = [],
}) => sql`
with filtered AS
    ${filterBlock}
    ${sql.raw(additionalLevels)}
     tiled as
    (SELECT center,
            theCount ${attributesToSelect(attributes)}
     FROM grouped_clusters_${z}
     WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(center, 3857))),
     q as
    (SELECT 1 as c1,
            ST_AsMVTGeom(ST_Transform(center, 3857), TileBBox(${z}, ${x}, ${y}, 3857), ${resolution}, 10, false) AS geom,
            jsonb_build_object('count', theCount${attributesToArray(
              attributes
            )}) as attributes
     FROM tiled)
SELECT ST_AsMVT(q, '${sourceLayer}', ${resolution}, 'geom') as mvt
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
  table,
  geometry,
  query,
  attributes,
}) =>
  sql`   
    (SELECT ${table}.${geometry}, 1 as theCount ${attributesToSelect(
    attributes
  )}
    FROM ${sql.raw(table)}
    WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${table}.${geometry}, 3857))
        ${query.length > 0 ? `AND ${query.join(' AND ')}` : ''}
    ),
    clustered_${maxZoomLevel} AS
    (SELECT ${geometry} as center,
        theCount,
        ST_ClusterDBSCAN(${geometry}, ${zoomToDistance(
    maxZoomLevel
  )}, 1) over () as clusters ${attributesToSelect(attributes)}
    FROM filtered),
    grouped_clusters_${maxZoomLevel} AS
    (SELECT SUM(theCount) as theCount,
        ${attributesFirstToSelect(attributes)}
        ST_Centroid(ST_Collect(center)) as center
    FROM clustered_${maxZoomLevel}
    GROUP BY clusters),
`;

/**
 * Creates an SQL fragment for the particular zoomLevel depending on zoomLevel - 1 for its data
 */
const additionalLevel = ({ zoomLevel, attributes }) => `
    clustered_${zoomLevel} AS
        (SELECT center,
            theCount,
            ST_ClusterDBSCAN(center, ${zoomToDistance(
              zoomLevel
            )}, 1) over () as clusters ${attributesToSelect(attributes)}
        FROM grouped_clusters_${zoomLevel + 1}),
    grouped_clusters_${zoomLevel} AS
        (SELECT SUM(theCount) as theCount,
            ${attributesFirstToSelect(attributes)}
            ST_Centroid(ST_Collect(center)) as center
        FROM clustered_${zoomLevel}
        GROUP BY clusters),
`;

/**
 * Calculates the radius applied to ST_ClusterDBSCAN for the zoomLevel
 */
const zoomToDistance = zoomLevel => 10 / Math.pow(2, zoomLevel);

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
  resolution,
  attributes,
  query,
}: IQueryInput) {
  if (z < maxZoomLevel) {
    // Clustered multi-zoom level case
    let additionalLevels = '';
    for (let i = maxZoomLevel - 1; i >= z; --i) {
      additionalLevels += additionalLevel({
        zoomLevel: i,
        attributes,
      });
    }
    console.log({ additionalLevels });
    const ret = baseClusteredQuery({
      filterBlock: filterBlock({
        z,
        x,
        y,
        maxZoomLevel,
        table,
        geometry,
        query,
        attributes,
      }),
      z,
      x,
      y,
      sourceLayer,
      additionalLevels,
      resolution,
      attributes,
    });
    // console.log(ret);
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
      resolution,
      attributes,
      query,
    });
    // console.log(ret);
    return ret;
  }
}
