/**
 * @description The dafault implementation of zoom to distance
 */
export const defaultZoomToDistance = (zoomLevel: number, radius: number = 15) =>
  radius / Math.pow(2, zoomLevel);
