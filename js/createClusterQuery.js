const filterBlock = ({ x, y, z, maxZoomLevel, table, geometry, attributes }) =>
`   
    (SELECT ${table}.${geometry}, 1 as theCount
    FROM ${table}
    WHERE ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${table}.${geometry}, 3857))
    ),

    clustered_${maxZoomLevel} AS
(SELECT ${geometry} as center,
        theCount,
        ST_ClusterDBSCAN(${geometry}, ${zoomToDistance(maxZoomLevel)}, 1) over () as clusters
 FROM filtered),
 grouped_clusters_${maxZoomLevel} AS
(SELECT SUM(theCount) as theCount,
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
            ST_AsMVTGeom(ST_Transform(${geometry}, 3857), TileBBox(${z}, ${x}, ${y}, 3857), ${resolution}, 10, false) AS geom,
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
     FROM grouped_clusters_${z}
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
clustered_${zoomLevel} AS
(SELECT center,
        theCount,
        ST_ClusterDBSCAN(center, ${zoomToDistance(zoomLevel)}, 1) over () as clusters
 FROM grouped_clusters_${zoomLevel + 1}),
grouped_clusters_${zoomLevel} AS
(SELECT SUM(theCount) as theCount,
        ST_Centroid(ST_Collect(center)) as center
 FROM clustered_${zoomLevel}
 GROUP BY clusters),
`;

const zoomToDistance = zoomLevel => 10 / (Math.pow(2, zoomLevel));
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
        console.log(ret);
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
        // console.log(ret);
        return ret;
    }
}

module.exports = {
    createQueryForTile,
    zoomToDistance,
    attributeMapToFeatureAttribute,
};
