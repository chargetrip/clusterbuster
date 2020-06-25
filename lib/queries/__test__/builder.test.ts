import { createQueryForTile } from '../builder';

describe('createQueryForTile', () => {
  it('should work', () => {
    expect(
      createQueryForTile({
        z: 0,
        x: 0,
        y: 0,
        maxZoomLevel: 12,
        table: 'table',
        geometry: 'geometry',
        sourceLayer: 'points',
        radius: 15,
        extent: 4096,
        bufferSize: 256,
        attributes: ['id', 'name'],
        query: ["name='name'", 'op = 1`'],
        debug: false,
      })
    ).toMatchSnapshot();
    expect(
      createQueryForTile({
        z: 14,
        x: 0,
        y: 0,
        maxZoomLevel: 12,
        table: 'table',
        geometry: 'geometry',
        sourceLayer: 'points',
        radius: 15,
        extent: 4096,
        bufferSize: 256,
        attributes: ['id', 'name'],
        query: ["name='name'", 'op = 1`'],
        debug: true,
      })
    ).toMatchSnapshot();
  });
});
