import { GetTileQuery, ITileQuery } from '../types/index';

/**
 * @description The default tile query builder
 */
export const defaultGetTileQuery: GetTileQuery = ({
  x,
  y,
  z,
  table,
  geometry,
  extent,
  bufferSize,
  attributes,
}: ITileQuery) => `
SELECT
  ST_AsMVTGeom(ST_Transform(${geometry}, 3857), TileBBox(${z}, ${x}, ${y}, 3857), ${extent}, ${bufferSize}, false) AS geom,
  jsonb_build_object(
    'count', size, 
    'expansionZoom', expansionZoom, 
    'lng', ST_X(ST_Transform(${geometry}, 4326)), 
    'lat', ST_Y(ST_Transform(${geometry}, 4326))${attributes}
  ) AS attributes
FROM ${table}
`;
