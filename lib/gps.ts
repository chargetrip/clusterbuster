function longitude2tile(longitude: number, zoom: number) {
  return Math.floor(((longitude + 180) / 360) * Math.pow(2, zoom));
}
function latitude2tile(latitude: number, zoom: number) {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((latitude * Math.PI) / 180) +
          1 / Math.cos((latitude * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

/**
 * @description Convert a set of GPS coordinates to tile position.
 * @see https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
 *
 * @param {number} latitude The GPS latitude
 * @param {number} longitude The GPS longitude
 * @param {number} zoom The zoom level
 * @returns The tile position
 */
export function gps2tile(
  latitude: number,
  longitude: number,
  zoom: number
): { z: number; x: number; y: number } {
  return {
    z: zoom,
    x: longitude2tile(longitude, zoom),
    y: latitude2tile(latitude, zoom),
  };
}
