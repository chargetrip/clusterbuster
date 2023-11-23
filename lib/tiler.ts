import { Cache, defaultCacheOptions } from './cache';
import {
  createQueryForTile,
  defaultGetBaseQuery,
  defaultZoomToDistance,
} from './queries/index';
import createSupportingSQLFunctions from './supporting';
import { TileInput, TileRenderer, TileServerConfig } from './types/index';
import { zip } from './zip';

export async function TileServer<T>({
  maxZoomLevel = 12,
  cacheOptions = defaultCacheOptions,
  pgPoolOptions = {},
  filtersToWhere = () => [],
  attributes = [],
  debug = false,
}: TileServerConfig<T>): Promise<TileRenderer<T>> {
  const { Pool } = require('pg');
  const pool = new Pool({
    max: 100,
    ...pgPoolOptions,
  });
  pool.on('error', (err) => {
    debug && console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  const cache = Cache(cacheOptions);

  await createSupportingSQLFunctions(pool);

  return async ({
    z,
    x,
    y,
    table = 'public.points',
    geometry = 'wkb_geometry',
    sourceLayer = 'points',
    maxZoomLevel: requestMaxZoomLevel = undefined,
    cacheTtl = undefined,
    radius = 15,
    extent = 4096,
    bufferSize = 256,
    queryParams = {},
    id = '',
    zoomToDistance = defaultZoomToDistance,
    getBaseQuery = defaultGetBaseQuery,
  }: TileInput<T>) => {
    try {
      const filtersQuery = !!filtersToWhere ? filtersToWhere(queryParams) : [];

      debug && console.time('query' + id);
      const cacheKey = cache.getCacheKey(table, z, x, y, filtersQuery);
      if (cacheKey) {
        try {
          const value = await cache.getCacheValue(cacheKey);
          if (value) {
            return value;
          }
        } catch (e) {
          // In case the cache get fail, we continue to generate the tile
          debug && console.log({ e });
        }
      }
      let query: string = '';

      z = parseInt(`${z}`, 10);
      if (isNaN(z)) {
        throw new Error('Invalid zoom level');
      }

      x = parseInt(`${x}`, 10);
      y = parseInt(`${y}`, 10);
      if (isNaN(x) || isNaN(y)) {
        throw new Error('Invalid tile coordinates');
      }

      try {
        query = createQueryForTile({
          z,
          x,
          y,
          maxZoomLevel: requestMaxZoomLevel || maxZoomLevel,
          table,
          geometry,
          radius,
          sourceLayer,
          extent,
          bufferSize,
          attributes,
          query: filtersQuery,
          debug,
          zoomToDistance,
          getBaseQuery,
        });
        const result = await pool.query(query);
        debug && console.timeEnd('query' + id);

        debug && console.time('gzip' + id);
        const tile = await zip(result.rows[0].mvt);
        debug && console.timeEnd('gzip' + id);

        if (cacheKey) {
          try {
            await cache.setCacheValue(
              cacheKey,
              tile,
              await cache.getCacheTtl(z, cacheTtl)
            );
          } catch (e) {
            // In case the cache set fail, we should return the generated tile
            debug && console.log({ e });
          }
        }
        return tile;
      } catch (e) {
        debug && console.log(query);
        debug && console.log({ e });
      }
    } catch (e) {
      debug && console.log('e in connect', e);
    }
  };
}
