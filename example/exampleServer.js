const express = require('express');
require('../js/server');

const port = 3005;

const table = 'public.stations';
const geometry = 'wkb_geometry';
const maxZoomLevel = 14;

const supertiler = require('../js/server');
supertiler({
    maxZoomLevel,
    geometry,
    table,
}).then(server => {
    const app = express();
    app.get('/stations/:z/:x/:y/tile.mvt', (req, res) => {
        server({ z: req.params.z, x: req.params.x, y: req.params.y }).then(
            result => {
                res.setHeader('Content-Type', 'application/x-protobuf');
                res.setHeader('Content-Encoding', 'gzip');
                res.status(200).send(result);
            }
        ).catch(e => {
            res.status(400).send('Oops');
        });
    });
    app.listen(port, () =>
        console.log(`Example app listening on port ${port}!`)
    );
});
