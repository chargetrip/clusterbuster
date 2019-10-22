require('dotenv').config();
const pg = require('pg');
const zlib = require('zlib');
const LRU = require('lru-cache');
const options = {
    max: 100000,
    length: function(n, key) {
        return n * 2 + key.length;
    },
    maxAge: 1000 * 60 * 60,
};

const cache = new LRU(options);

const { createQueryForTile } = require('./createClusterQuery');

module.exports = async function({ maxZoomLevel, table, geometry, resolution, attributeMap }) {
    const pool = new pg.Pool();
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
    return async ({ z, x, y, id }) => {
        try {
            console.time('query' + id);
            const value = cache.get(`${z}, ${x}, ${y}`);
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
                        attributeMap
                    })
                );
                
                console.timeEnd('query' + id);
    
                return await new Promise(resolve => {
                    console.time('gzip' + id);
                    zlib.gzip(result.rows[0].mvt, (err, result) => {
                        if (!err) {
                            cache.set(`${z}, ${x}, ${y}`, result);
                            resolve(result);
                            console.timeEnd('gzip' + id);
                        } else {
                            reject(err);
                        }
                    });
                });
            } catch (e) {
                console.log({ e });
            }
        } catch (e) {
            console.log('e in connect', e);
        }
        
    };
};
