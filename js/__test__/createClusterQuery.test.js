const {
    createQueryForTile,
    attributeMapToFeatureAttribute,
} = require('../createClusterQuery');

describe('createClusterQuery', () => {
    it('should create an unclustered Query', () => {
        expect(
            createQueryForTile({
                z: 1,
                x: 0,
                y: 1,
                table: 'public.stations',
                geometry: 'wkb_geometry',
                maxZoomLevel: 10,
                resolution: 512,
                attributeMap: { a: 'b' },
            })
        ).toMatchSnapshot();
    });

    it('should map attributes to features select array', () => {
        expect(attributeMapToFeatureAttribute({
            a: 'b',
            c: 'd',
            e: 'f',
        })).toMatchSnapshot();
    });
});

// http://localhost:3005/stations/13/4400/2687/tile.mvt
// http://localhost:3005/stations/14/8609/5642/tile.mvt
// http://localhost:3005/stations/1/0/1/tile.mvt

// 9/284/168/tile.mvt
