## Intro

Clusterbuster is a tile server that produces map tiles (in MVT format) from a table with a PostGIS geometry column. It uses this table to first filter the row (based on a query you provide) and the resulting points are then clustered dynamically. The combination of clusters and points is transformed into a vector tile. The MVT tiles are much smaller than the original data, moving all the heavy lifting from the front-end to the tile server. This allows the display of large data sets, that change regularly, on maps in resource constrained environments, such as mobile devices and embedded systems. Clusterbuster has a built-in and configurable in-memory LRU-cache for the resulting tiles, with which it can serve many concurrent users.

## Getting started

Clusterbuster is designed to be used in a NodeJS server connected to a PostgreSQL database, with PostGIS extensions installed. You have to bring your own web framework, allowing clusterbuster to be easily integrated in any existing API that uses express.js, Koa, Hapi, etc..

```Javascript
const { TileServer } = require('clusterbuster');

TileServer({
    // types/TileServerConfig.ts
  maxZoomLevel,
  attributes: ['status', 'speed'],
  filtersToWhere: filters => {
    // You are responsible for protecting against SQL injection in this function. Because there are many ways to filter, it depends on the filter type on how to approach this.

    // For example a number can be safely used by passing it through parseFloat, strings are best treated by checking for a set of allowed values
    const whereStatements = [];

    // The below statement checks that filters.status is one of 'free' or 'busy' to prevent potential SQL injection
    if (filters.status && ['busy', 'free'].includes(filters.status)) {
      whereStatements.push(`status = '${filters.status}'`);
    }
    if (filters.speed && ['slow', 'fast'].includes(filters.speed)) {
      whereStatements.push(`speed = '${filters.speed}'`);
    }
    return whereStatements;
  },
}).then(async tileServer => {
    const tile = await tileServer({
        // types/TileRequest.ts
        z: 1,
        x: 0,
        y: 1,
        table: 'public.my_points_table',
        geometry: 'my_geometry_column'
        extent: 4096,
        bufferSize: 256,
    });
    // send the tile in binary MVT format to the front-end
});
```

See the [express.js example](/example) for a fully functioning server that exposes the above tile server on a REST endpoint. You can see the [TileServerConfig](/lib/types/TileServerConfig.ts) for the initial configuration options, to configure the cache, connection pool, filters, etc..

The [TileRequest](/lib/types/TileRequest.ts) defines the per tile request options.

The above example assumes a postgres database with a `public.my_points_table` table matching:

```SQL
CREATE EXTENSION postgis;

-- Table: public.my_points_table
CREATE TABLE public.my_points_table
(
    id TEXT,
    my_geometry_column geometry(Point,4326),
    speed TEXT,
    status TEXT,

    PRIMARY KEY(id)
)

TABLESPACE pg_default;

GRANT ALL ON TABLE public.my_points_table TO "tiler";
```

The internal [postgress client](https://node-postgres.com/) can be configured with the following env vars:

```ENV
PGUSER=tiler
PGHOST=localhost
PGPASSWORD=
PGDATABASE=points
PGPORT=5432
```

## Filtering

The `filtersToWhere` function can be used to implement custom filtering logic. It should return an array of SQL snippets, which clusterbuster transforms into the WHERE clause using AND between each statement.

The resulting SQL query looks something like this:

```SQL
SELECT ...
WHERE whereStatement1 AND whereStatement2
```

## Caching

The default cache is a in-memory LRU cache local to the tile server. This cache is ideal for a single instance tile server. If you are going to use clusterbuster in a loadbalanced multi instance server environment, the cache can be a redis instance or cluster instead, allowing all tile server instances to share the same tile cache.

You need to install the peer dependency `npm i ioredis` and configure the tile server to use redis instead of LRU. See the [TileCacheOptions](/TileCacheOptions.ts) for all the configuration options.

```json
{ "cacheOptions": { "type": "redis" } }
```

## Internals

The tile server creates clusters using the PostGIS ST_ClusterDBSCAN starting at the maximum zoomlevel and continues clustering iteratively for each zoom level until the zoom level of the tile request is reached. This 'cluster of clusters' clustering algorithm is inspired by the excellent [supercluster](https://github.com/mapbox/supercluster) library, which many people use to cluster on the front-end and even on the back-end (using something like supertiler).

PostGIS is used for all the work such as selecting points in the region of the tile and even for creating the binary tiles themselves, using ST_asMVT. The NodeJS server only creates the SQL statements which then create the tiles in the database. These tiles are then gzipped and stored in an in-memory LRU cache inside the NodeJS process.

The main performance bottleneck for clusterbuster is the PostgreSQL server as the clustering algorithm requires a lot of CPU cycles, especially at low (1-5) zoom levels. Because the lower zoom levels contain fewer total tiles to cover the whole map (1 tile for the whold world at zoom level 0),the LRU cache effectively shields the database from becoming overloaded when many users are using the map concurrently. The number of different filters reduces the effectiveness of the LRU cache, as each filter combination creates a unique set of cache keys for all tiles. Typically the 'default' filter settings will provide enough caching to keep the database from becoming overloaded by many concurrent users, but mileage may vary per use case.

## Alternative tile servers (which inspired clusterbuster)

- [Martin](https://github.com/urbica/martin) - A Rust based tile server, which has the option to provide PL/pgSQL function instead of a table, allows for filtering of data before tiling.
- [Tilestrata](https://github.com/naturalatlas/tilestrata) (and especially [tilestrata-postgis-mvt](https://github.com/Stezii/tilestrata-postgismvt)) - Tilestrata is a tile server framework with an elaborate plugin architecture. The tilestrata-postgis-mvt plugin uses the same ST_asMvt functions provided by PostGIS as ClusterBuster does.
- [Tegola](https://tegola.io/) - A Go based tile server

## Alternative static tile generators

- [tippecanoe](https://github.com/mapbox/tippecanoe)
- [supertiler](https://github.com/ChrisLoer/supertiler)

All of these tile servers and tile generators offer some subset of the functionality we required, but lacked atleast one, which is our motivation for making clusterbuster.

| Tiler         | dynamic data | filtering | backend clustering |
| ------------- | ------------ | --------- | ---------- |
| Clusterbuster | ✓            | ✓         | ✓          |
| Martin        | ✓            | ✓         | x          |
| Tilestrata    | ✓            | x         | x          |
| Tegola        | ✓            | x         | x          |
| Tippecanoe    | x            | x         | ✓          |
| Supertiler    | x            | x         | ✓          |

## When not to use clusterbuster

- Your data is static (and no filtering is required) - use tippecanoe or supertiler to prerender all tiles and serve from a file hosting service such as S3 (which is much more economical and loads faster to the front-end)
- Your data needs to be filtered, but not clustered:
  Using Martin you can implement filtering using PL/pgSQL
- You don't need filtering or clustering, you just need tiles from a dynamic data set: You can use any of the dynamic tile servers in the table above.

## Sponsors

[![Chargetrip logo](https://chargetrip-files.s3.eu-central-1.amazonaws.com/logo-1.png)](https://www.chargetrip.com)
