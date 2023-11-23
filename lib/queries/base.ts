import { GetBaseQuery, IBaseQueryInput } from '../types/index';

/**
 * @description The default base query builder
 */
export const defaultGetBaseQuery: GetBaseQuery = ({
  x,
  y,
  z,
  table,
  geometry,
  maxZoomLevel,
  attributes,
  query,
}: IBaseQueryInput) => `
SELECT
st_flipcoordinates(${geometry}) AS center,
  1 AS size,
  0 AS clusterNo,
  ${maxZoomLevel + 1} AS expansionZoom${attributes}
FROM ${table}
WHERE 
	ST_Intersects(TileBBox(${z}, ${x}, ${y}, 3857), ST_Transform(${geometry}, 3857))
	${query.length > 0 ? `AND ${query.join(' AND ')}` : ''}
`;
