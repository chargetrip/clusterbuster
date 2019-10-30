require('dotenv').config();
const express = require('express');
const uuid = require('uuid');

const port = 3005;

const table = 'public.points';
const geometry = 'wkb_geometry';
const maxZoomLevel = 12;

const { TileServer } = require('../dist');
TileServer({
  maxZoomLevel,
  resolution: 512,
  attributes: ['status', 'speed'],
  filtersToWhere: (filters = { status: undefined, speed: undefined }) => {
    // You are responsible for protecting against SQL injection in this function. Because there are many ways to filter, it depends on the filter type on how to approach this.

    // For example a number can be safely used by passing it thorugh parseFloat
    const whereStatements = [];

    // The below statement checks that filters.status is one of 'free' or 'busy' to prevent a potential SQL injection
    if (
      filters.status &&
      (filters.status === 'free' || filters.status === 'busy')
    ) {
      whereStatements.push(`status = '${filters.status}'`);
    }
    if (
      filters.speed &&
      (filters.speed === 'fast' || filters.speed === 'slow')
    ) {
      whereStatements.push(`speed = '${filters.speed}'`);
    }
    return whereStatements;
  },
}).then(server => {
  const app = express();
  app.use((_, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
  });
  app.get('/health', (_, res) => {
    res.status(200).send('OK');
  });
  app.get('/points/:z/:x/:y/tile.mvt', (req, res) => {
    req.id = uuid.v4();
    console.time(req.id);
    server({
      z: req.params.z,
      x: req.params.x,
      y: req.params.y,
      query: req.query,
      table,
      geometry,
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
