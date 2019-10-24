import LRU, { Options } from 'lru-cache';
import pg from 'pg';
import { IMakeTileProps, IServer } from '../interfaces';
import { TMakeTileFunction } from '../types';
import { createQueryForTile } from './createClusterQuery';
import createSupportingSQLFunctions from './supporting';
import { zip } from './zip';

export async function Server<T>({
  maxZoomLevel = 12,
  resolution = 512,
  cacheOptions = {},
  filtersToWhere = null,
  attributes = [],
}: IServer<T>): Promise<TMakeTileFunction<T>> {
  const pool = pg.Pool({
    totalCount: 100,
  });
  pool.on('error', err => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });

  const options: Options = {
    max: 100000,
    length: function(n, key) {
      return n * 2 + key.length;
    },
    maxAge: 1000 * 60 * 60,
  };

  const cache = new LRU({ ...options, ...cacheOptions });

  await createSupportingSQLFunctions(pool);

  return async ({
    z,
    x,
    y,
    table = 'points',
    geometry = 'location',
    filters = null,
    id = '',
  }: IMakeTileProps<T>) => {
    try {
      const filtersQuery = filtersToWhere(filters);

      console.time('query' + id);
      const cacheKey = `${z}, ${x}, ${y}, ${filtersQuery.join(', ')}`;
      const value = cache.get(cacheKey);
      if (value) {
        return value;
      }

      try {
        const result = await pool.query(
          createQueryForTile({
            z,
            x,
            y,
            maxZoomLevel,
            table,
            geometry,
            resolution,
            attributes,
            query: filtersQuery,
          })
        );
        console.timeEnd('query' + id);

        const tile = await zip(result.rows[0].mvt);
        console.timeEnd('gzip' + id);

        cache.set(cacheKey, tile);

        return tile;
      } catch (e) {
        console.log({ e });
      }
    } catch (e) {
      console.log('e in connect', e);
    }
  };
}
