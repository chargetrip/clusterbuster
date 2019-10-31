import pg from 'pg';
import { TileInput, TileRenderer, TileServerConfig } from '../types';
import { Cache, defaultCacheOptions } from './cache';
import { createQueryForTile } from './queries';
import createSupportingSQLFunctions from './supporting';
import { zip } from './zip';

export async function TileServer<T>({
  maxZoomLevel = 12,
  resolution = 512,
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
    queryParams = {},
    id = '',
  }: TileInput<T>) => {
    try {
      const filtersQuery = !!filtersToWhere ? filtersToWhere(queryParams) : [];

      debug && console.time('query' + id);
      const cacheKey = cache.getCacheKey(table, z, x, y, filtersQuery);
      const value = await cache.getCacheValue(cacheKey);
      if (value) {
        return value;
      }
      let query;

      try {
        query = createQueryForTile({
          z,
          x,
          y,
          maxZoomLevel,
          table,
          geometry,
          sourceLayer,
          resolution,
          attributes,
          query: filtersQuery,
          debug,
        });
        const result = await pool.query(query.sql, query.values);
        debug && console.timeEnd('query' + id);

        debug && console.time('gzip' + id);
        const tile = await zip(result.rows[0].mvt);
        debug && console.timeEnd('gzip' + id);

        await cache.setCacheValue(cacheKey, tile);

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
