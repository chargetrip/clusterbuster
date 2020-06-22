import { defaultGetBaseQuery } from '../base';

describe('defaultGetBaseQuery', () => {
  it('should work', () => {
    expect(
      defaultGetBaseQuery({
        x: 0,
        y: 0,
        z: 0,
        table: 'table',
        geometry: 'geometry',
        maxZoomLevel: 12,
        attributes: ', id, name',
        query: [],
      })
    ).toMatchSnapshot();
    expect(
      defaultGetBaseQuery({
        x: 0,
        y: 0,
        z: 0,
        table: 'table',
        geometry: 'geometry',
        maxZoomLevel: 12,
        attributes: ', id, name',
        query: ["name = 'name'"],
      })
    ).toMatchSnapshot();
    expect(
      defaultGetBaseQuery({
        x: 0,
        y: 0,
        z: 0,
        table: 'table',
        geometry: 'geometry',
        maxZoomLevel: 12,
        attributes: ', id, name',
        query: ["name = 'name'", "id = '1'"],
      })
    ).toMatchSnapshot();
  });
});
