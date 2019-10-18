const table = 'public.stations';
const geometry = 'wkb_geometry';
const maxZoomLevel = 14;

require('./createClusterQuery').createForZoomLevel({
    targetZoomLevel: 3,
    maxZoomLevel,
    table,
    geometry,
});
