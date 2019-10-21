const filterBlock = ({ x, y, z, maxZoomLevel, table, geometry, attributes }) =>
`   
    (SELECT ${table}.${geometry}
    FROM ${table}
    WHERE ST_Intersects(TileDoubleBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${table}.${geometry}, 3857))
    ),
    clustered as
    (SELECT unnest(ST_ClusterWithin(wkb_geometry, 0.006)) as clusters
    FROM filtered),
    clusters_with_meta_${maxZoomLevel} as
    (SELECT ST_Centroid(ST_CollectionExtract(clusters, 1)) as center,
            ST_NumGeometries(clusters) as theCount
    FROM clustered),`;

const unclusteredQuery = ({
    x,
    y,
    z,
    table,
    geometry,
    resolution,
    attributes,
}) =>
    `
WITH filtered AS
    (SELECT ${table}.${geometry}${attributeMapToSelect(attributes)}
    FROM ${table}
    WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${table}.${geometry}, 3857))
    ),
    q as
    (SELECT 1 as c1,
            ${geometry} AS geom,
            jsonb_build_object('count', 1${attributeMapToFeatureAttribute(
                attributes
            )}) as attributes
     FROM filtered)
SELECT ST_AsMVT(q, 'stations', ${resolution}, 'geom') as mvt
from q
`;

const base_query = ({
    filterBlock,
    additionalLevels,
    z,
    x,
    y,
    resolution,
    attributes,
}) => `
with filtered AS
    ${filterBlock}
    ${additionalLevels}
     tiled as
    (SELECT center,
            theCount
     FROM clusters_with_meta_${z}
     WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(center, 3857))),
     q as
    (SELECT 1 as c1,
            ST_AsMVTGeom(ST_Transform(center, 3857), TileBBox(${z}, ${x}, ${y}, 3857), ${resolution}, 10, false) AS geom,
            jsonb_build_object('count', theCount) as attributes
     FROM tiled)
SELECT ST_AsMVT(q, 'stations', ${resolution}, 'geom') as mvt
from q
`;

const additionalLevel = ({ zoomLevel, attributes }) => `
    clustered_${zoomLevel} as
    (SELECT unnest(ST_ClusterWithin(center, ${zoomToDistance(
        zoomLevel
    )})) as clusters
     FROM clusters_with_meta_${zoomLevel + 1}),
     clusters_with_meta_${zoomLevel} as
    (SELECT ST_Centroid(ST_CollectionExtract(clusters, 1)) as center,
            ST_NumGeometries(clusters) as theCount
     FROM clustered_${zoomLevel}),
`;

const zoomToDistance = zoomLevel => 10 / (zoomLevel * zoomLevel);
const attributeMapToFeatureAttribute = attributeMap =>
    `${
        Object.keys(attributeMap).length > 0
            ? Object.entries(attributeMap)
                  .map(([key, value]) => `,${key},${value}`)
                  .join('')
            : ''
    }`;
const attributeMapToSelect = attributes =>
    Object.entries(attributes)
        .map(([_, value]) => `,${value}`)
        .join('');

function createQueryForTile({
    z,
    x,
    y,
    maxZoomLevel,
    table,
    geometry,
    resolution,
    attributeMap,
}) {
    if (z < maxZoomLevel) {
        let additionalLevels = '';
        for (let i = maxZoomLevel - 1; i >= z; --i) {
            additionalLevels += additionalLevel({
                zoomLevel: i,
                attributes: attributeMap,
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
                resolution,
                attributes: attributeMap,
            }),
            z,
            x,
            y,
            additionalLevels,
            resolution,
            attributes: attributeMap,
        });

        return ret;
    } else {
        const ret = unclusteredQuery({
            x,
            y,
            z,
            table,
            geometry,
            resolution,
            attributes: attributeMap,
        });
        return ret;
    }
}

module.exports = {
    createQueryForTile,
    zoomToDistance,
    attributeMapToFeatureAttribute,
};
