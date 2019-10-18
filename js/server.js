require('dotenv').config();
var pg = require('pg');
var zlib = require('zlib');

const { createQueryForTile } = require('./createClusterQuery');

module.exports = async function({ maxZoomLevel, table, geometry }) {
    const pool = new pg.Pool();
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', err);
        process.exit(-1);
    });
    const client = await pool.connect();
    return async ({ z, x, y }) => {
        console.time('query');
        const result = await client.query(
            createQueryForTile({
                z,
                x,
                y,
                maxZoomLevel,
                table,
                geometry,
            })
        );
        console.timeEnd('query');

        return await new Promise(resolve => {
            zlib.gzip(result.rows[0].mvt, (err, result) => {
                if (!err) {
                    resolve(result);
                } else {
                    reject(err);
                }
            });
        });
    };
};
