import * as pg from 'pg';
import { TileInput, TileRenderer, TileServerConfig } from './types/index';
import { Cache, defaultCacheOptions } from './cache';
import {
  createQueryForTile,
  zoomToDistance as defaultZoomToDistance,
} from './queries';
import createSupportingSQLFunctions from './supporting';
import { zip } from './zip';

export async function TileServer<T>({
  maxZoomLevel = 12,
  cacheOptions = defaultCacheOptions,
  pgPoolOptions = {},
  filtersToWhere = null,
  attributes = [],
  debug = false,
}: TileServerConfig<T>): Promise<TileRenderer<T>> {
  const pool = new pg.Pool({
    max: 100,
    ...pgPoolOptions,
  });
  pool.on('error', err => {
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
  }: TileInput<T>) => {
    try {
      const filtersQuery = !!filtersToWhere ? filtersToWhere(queryParams) : [];

      debug && console.time('query' + id);
      const cacheKey = cache.getCacheKey(table, z, x, y, filtersQuery);
      try {
        const value = await cache.getCacheValue(cacheKey);
        if (value) {
          return value;
        }
      } catch (e) {
        // In case the cache get fail, we continue to generate the tile
        debug && console.log({ e });
      }
      let query;

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
        });
        const result = await pool.query<{ mvt: any }>(query.sql, query.values);
        debug && console.timeEnd('query' + id);

        debug && console.time('gzip' + id);
        const tile = await zip(result.rows[0].mvt);
        debug && console.timeEnd('gzip' + id);

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

        return tile;
      } catch (e) {
        debug && console.log(query ? query.sql : '');
        debug && console.log(query ? query.values : '');
        debug && console.log({ e });
      }
    } catch (e) {
      debug && console.log('e in connect', e);
    }
  };
}
