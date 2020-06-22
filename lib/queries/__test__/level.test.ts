import {
  defaultGetLevelClusterQuery,
  defaultGetLevelGroupQuery,
} from '../level';
import { defaultZoomToDistance } from '../zoom';

describe('defaultGetLevelClusterQuery', () => {
  it('should work', () => {
    expect(
      defaultGetLevelClusterQuery({
        parentTable: 'base_query',
        zoomLevel: 14,
        radius: 10,
        attributes: ', id, name',
        zoomToDistance: defaultZoomToDistance,
      })
    ).toMatchSnapshot();
  });
});

describe('defaultGetLevelGroupQuery', () => {
  it('should work', () => {
    expect(
      defaultGetLevelGroupQuery({
        zoomLevel: 14,
        attributes: 'FIRST(id), FIRST(name), ',
      })
    ).toMatchSnapshot();
  });
});
