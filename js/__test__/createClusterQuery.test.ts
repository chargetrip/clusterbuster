const { createQueryForTile } = require('../createClusterQuery');

describe('createClusterQuery', () => {
  it('should create a clustered Query', () => {
    expect(
      createQueryForTile({
        z: 1,
        x: 0,
        y: 1,
        table: 'public.stations',
        geometry: 'wkb_geometry',
        maxZoomLevel: 10,
        resolution: 512,
        attributes: ['a'],
        query: ['status = status', '[1, 2] @> [2, 3]'],
      })
    ).toMatchSnapshot();
  });

  it('should create a unclustered Query', () => {
    expect(
      createQueryForTile({
        z: 15,
        x: 0,
        y: 1,
        table: 'public.stations',
        geometry: 'wkb_geometry',
        maxZoomLevel: 10,
        resolution: 512,
        attributes: ['a'],
        query: [],
      })
    ).toMatchSnapshot();
  });
});
// http://localhost:3005/stations/13/4400/2687/tile.mvt
// http://localhost:3005/stations/14/8609/5642/tile.mvt
// http://localhost:3005/stations/1/0/1/tile.mvt

// 9/284/168/tile.mvt
