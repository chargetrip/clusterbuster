require('dotenv').config();

import { Pool } from 'pg';

(async function() {
  const pool = new Pool();
  const exists = await pool.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points');`
  );

  if (!!exists && !!exists.rows && !!exists.rows[0] && !exists.rows[0].exists) {
    try {
      await pool.query('CREATE EXTENSION postgis;');
    } catch (e) {
      console.error(e.message);
    }

    await pool.query(`CREATE TABLE public.points
    (
      id TEXT,
      wkb_geometry geometry(Point,4326),
      speed TEXT,
      status TEXT,

      PRIMARY KEY(id)
    )
    TABLESPACE pg_default;`);

    const points = require('./points.json'),
      sql = `INSERT INTO public.points (
        id, 
        wkb_geometry, 
        speed,
        status
      )
      VALUES ($1, ST_SetSRID(ST_GeomFromGeoJSON($2),4326),$3,$4);`;

    for (const point of points) {
      const params = [
        point.id,
        JSON.stringify(point.geometry),
        point.properties.speed,
        point.properties.status,
      ];

      try {
        await pool.query(sql, params);
      } catch (e) {
        console.error(e.message);
      }
    }
  }
})().catch(console.error);
