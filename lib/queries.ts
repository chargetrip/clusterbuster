import { IQueryInput } from './types/IQueryInput';

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
  `   
    (SELECT ${table}.${geometry}, 1 as theCount ${attributesToSelect(
    attributes
  )}
    FROM ${table}
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
  `
WITH filtered AS
    (SELECT ${table}.${geometry} ${attributesToSelect(attributes)}
    FROM ${table}
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

const base_query = ({
  filterBlock,
  additionalLevels,
  z,
  x,
  y,
  sourceLayer,
  resolution,
  attributes = [],
}) => `
with filtered AS
    ${filterBlock}
    ${additionalLevels}
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

const zoomToDistance = zoomLevel => 10 / Math.pow(2, zoomLevel);

const attributesToSelect = attributes =>
  attributes.length > 0 ? `, ${attributes.join(', ')}` : '';
const attributesFirstToSelect = attributes =>
  attributes.length > 0
    ? `${attributes
        .map(attribute => `FIRST(${attribute}) as ${attribute}`)
        .join(', ')},`
    : '';
const attributesToArray = attributes =>
  attributes.length > 0
    ? ', ' +
      attributes.map(attribute => `'${attribute}', ${attribute}`).join(', ')
    : '';

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
    let additionalLevels = '';
    for (let i = maxZoomLevel - 1; i >= z; --i) {
      additionalLevels += additionalLevel({
        zoomLevel: i,
        attributes,
      });
    }
    const ret = base_query({
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
