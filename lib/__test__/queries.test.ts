const { createQueryForTile } = require('../queries');

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
