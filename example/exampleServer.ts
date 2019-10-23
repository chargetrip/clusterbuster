const express = require('express');
const uuid = require('uuid');

const port = 80;

const table = 'public.stations';
const geometry = 'wkb_geometry';
const maxZoomLevel = 12;

const supertiler = require('../dist');
supertiler({
  maxZoomLevel,
  geometry,
  table,
  resolution: 512, // Mapbox default, try 256 if you are unsure what your mapping front-end library uses
  attributes: ['status'],
  urlQueryToSql: filters => {
    const whereStatements = [];
    if (filters.status) {
      whereStatements.push(`status = '${filters.status}'`);
    }
    if (filters.speed) {
      whereStatements.push(`speed = '${filters.speed}'`);
    }
    return whereStatements;
  }
}).then(server => {
  const app = express();
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    next();
  });
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });
  app.get('/stations/:z/:x/:y/tile.mvt', (req, res) => {
    req.id = uuid.v4();
    console.time(req.id);
    server({
      z: req.params.z,
      x: req.params.x,
      y: req.params.y,
      query: req.query,
      id: req.id,
    })
      .then(result => {
        res.setHeader('Content-Type', 'application/x-protobuf');
        res.setHeader('Content-Encoding', 'gzip');
        console.time('send' + req.id);
        res.status(200).send(result);
        console.timeEnd('send' + req.id);
        console.timeEnd(req.id);
      })
      .catch(e => {
        res.status(400).send('Oops');
      });
  });
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
});
