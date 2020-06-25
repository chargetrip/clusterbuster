import { defaultGetTileQuery } from '../tile';

describe('defaultGetTileQuery', () => {
  it('should work', () => {
    expect(
      defaultGetTileQuery({
        x: 0,
        y: 0,
        z: 0,
        table: 'table',
        geometry: 'geometry',
        extent: 4096,
        bufferSize: 256,
        attributes: ", 'id', id, 'name', name",
      })
    ).toMatchSnapshot();
  });
});
