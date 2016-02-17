/*global defineSuite*/
defineSuite([
        'Core/EllipsoidOutlineGeometry',
        'Core/Cartesian3',
        'Specs/createPackableSpecs'
    ], function(
        EllipsoidOutlineGeometry,
        Cartesian3,
        createPackableSpecs) {
    'use strict';

    it('constructor throws if stackPartitions less than 1', function() {
        expect(function() {
            return new EllipsoidOutlineGeometry({
                stackPartitions: 0
            });
        }).toThrowDeveloperError();
    });

    it('constructor throws if slicePartitions less than 0', function() {
        expect(function() {
            return new EllipsoidOutlineGeometry({
                slicePartitions: -1
            });
        }).toThrowDeveloperError();
    });

    it('constructor throws if subdivisions less than 0', function() {
        expect(function() {
            return new EllipsoidOutlineGeometry({
                subdivisions: -2
            });
        }).toThrowDeveloperError();
    });

    it('computes positions', function() {
        var m = EllipsoidOutlineGeometry.createGeometry(new EllipsoidOutlineGeometry({
            stackPartitions : 3,
            slicePartitions: 3,
            subdivisions: 3
        }));

        expect(m.attributes.position.values.length).toEqual(14 * 3);
        expect(m.indices.length).toEqual(15 * 2);
        expect(m.boundingSphere.radius).toEqual(1);
    });

    it('undefined is returned if the x, y, or z radii are equal to 0', function() {
        var ellipsoidOutline0 = new EllipsoidOutlineGeometry({
            radii : new Cartesian3(0.0, 500000.0, 500000.0)
        });
        var ellipsoidOutline1 = new EllipsoidOutlineGeometry({
            radii : new Cartesian3(1000000.0, 0.0, 500000.0)
        });
        var ellipsoidOutline2 = new EllipsoidOutlineGeometry({
            radii : new Cartesian3(1000000.0, 500000.0, 0.0)
        });

        var geometry0 = EllipsoidOutlineGeometry.createGeometry(ellipsoidOutline0);
        var geometry1 = EllipsoidOutlineGeometry.createGeometry(ellipsoidOutline1);
        var geometry2 = EllipsoidOutlineGeometry.createGeometry(ellipsoidOutline2);

        expect(geometry0).toBe(undefined);
        expect(geometry1).toBe(undefined);
        expect(geometry2).toBe(undefined);
    });

    var ellipsoidgeometry = new EllipsoidOutlineGeometry({
        radii : new Cartesian3(1.0, 2.0, 3.0),
        slicePartitions: 3,
        stackPartitions: 3,
        subdivisions: 3
    });
    var packedInstance = [1.0, 2.0, 3.0, 3.0, 3.0, 3.0];
    createPackableSpecs(EllipsoidOutlineGeometry, ellipsoidgeometry, packedInstance);
});
