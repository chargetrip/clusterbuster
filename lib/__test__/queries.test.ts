const { createQueryForTile } = require('../queries');

describe('createClusterQuery', () => {
  it('should create a clustered Query', () => {
    const query = createQueryForTile({
      z: 1,
      x: 0,
      y: 1,
      table: 'public.stations',
      geometry: 'wkb_geometry',
      sourceLayer: 'points',
      maxZoomLevel: 10,
      extent: 4096,
      bufferSize: 256,
      attributes: ['a'],
      query: ['status = status', '[1, 2] @> [2, 3]'],
    });
    expect(query.sql).toMatchSnapshot();
    expect(query.values).toMatchSnapshot();
  });

  it('should create a unclustered Query', () => {
    expect(
      createQueryForTile({
        z: 15,
        x: 0,
        y: 1,
        table: 'public.stations',
        geometry: 'wkb_geometry',
        sourceLayer: 'points',
        maxZoomLevel: 10,
        extent: 4096,
        bufferSize: 256,
        attributes: ['a'],
        query: [],
      })
    ).toMatchSnapshot();
  });
});
