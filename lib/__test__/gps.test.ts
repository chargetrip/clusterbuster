const { gps2tile } = require('../gps');

describe('gps2tile', () => {
  it('should convert latitude and longitude and zoom', () => {
    for (let zoom = 0; zoom <= 21; zoom++) {
      for (let lat = -90; lat <= 90; lat += 45) {
        for (let lng = -180; lng <= 180; lng += 45) {
          const latitude = lat === -90 ? -85 : lat === 90 ? 85 : lat,
            longitude = lng;

          expect({
            ...{ latitude, longitude },
            ...gps2tile(latitude, longitude, zoom),
          }).toMatchSnapshot();
        }
      }
    }
  });
});
