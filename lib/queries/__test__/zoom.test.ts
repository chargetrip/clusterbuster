import { defaultZoomToDistance } from '../zoom';

describe('defaultZoomToDistance', () => {
  it('should work', () => {
    expect(defaultZoomToDistance(0, 2)).toMatchSnapshot();
    expect(defaultZoomToDistance(1, 2)).toMatchSnapshot();
    expect(defaultZoomToDistance(5, 2)).toMatchSnapshot();
    expect(defaultZoomToDistance(10, 2)).toMatchSnapshot();
    expect(defaultZoomToDistance(14, 2)).toMatchSnapshot();
    expect(defaultZoomToDistance(0)).toMatchSnapshot();
    expect(defaultZoomToDistance(7)).toMatchSnapshot();
    expect(defaultZoomToDistance(14)).toMatchSnapshot();
  });
});
