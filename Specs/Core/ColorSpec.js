/*global defineSuite*/
defineSuite(['Core/Color',
             'Core/Math'
            ], function(
              Color,
              CesiumMath) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn,runs,waits,waitsFor*/

    it('Constructing without arguments produces expected defaults', function() {
        var v = new Color();
        expect(v.red).toEqual(1.0);
        expect(v.green).toEqual(1.0);
        expect(v.blue).toEqual(1.0);
        expect(v.alpha).toEqual(1.0);
    });

    it('Constructing with arguments sets property values', function() {
        var v = new Color(0.1, 0.2, 0.3, 0.4);
        expect(v.red).toEqual(0.1);
        expect(v.green).toEqual(0.2);
        expect(v.blue).toEqual(0.3);
        expect(v.alpha).toEqual(0.4);
    });

    it('fromBytes without arguments produces expected defaults', function() {
        var v = new Color();
        expect(v.red).toEqual(1.0);
        expect(v.green).toEqual(1.0);
        expect(v.blue).toEqual(1.0);
        expect(v.alpha).toEqual(1.0);
    });

    it('fromBytes with arguments sets property values', function() {
        var v = Color.fromBytes(0, 255, 51, 102);
        expect(v.red).toEqual(0.0);
        expect(v.green).toEqual(1.0);
        expect(v.blue).toEqual(0.2);
        expect(v.alpha).toEqual(0.4);
    });

    it('toBytes returns the same values that fromBytes took', function() {
        var r = 5;
        var g = 87;
        var b = 23;
        var a = 88;
        var c = Color.fromBytes(r, g, b, a);
        var bytes = c.toBytes();
        expect(bytes).toEqual([r, g, b, a]);
    });

    it('byteToFloat works in all cases', function() {
        expect(Color.byteToFloat(0)).toEqual(0);
        expect(Color.byteToFloat(255)).toEqual(1.0);
        expect(Color.byteToFloat(127)).toEqual(127 / 255);
    });

    it('floatToByte works in all cases', function() {
        expect(Color.floatToByte(0)).toEqual(0);
        expect(Color.floatToByte(1.0)).toEqual(255);
        expect(Color.floatToByte(127 / 255)).toEqual(127);
    });

    it('clone with no parameters returns a new identical copy.', function() {
        var v = new Color(0.1, 0.2, 0.3, 0.4);
        var v2 = v.clone();
        expect(v).toEqual(v2);
        expect(v === v2).toEqual(false);
    });

    it('clone with a parameter modifies the parameter.', function() {
        var v = new Color(0.1, 0.2, 0.3, 0.4);
        var v2 = new Color();
        var v3 = v.clone(v2);
        expect(v).toEqual(v2);
        expect(v3 === v2).toEqual(true);
    });

    it('equals works', function() {
        var v = new Color(0.1, 0.2, 0.3, 0.4);
        var v2 = new Color(0.1, 0.2, 0.3, 0.4);
        var v3 = new Color(0.1, 0.2, 0.3, 0.5);
        var v4 = new Color(0.1, 0.2, 0.5, 0.4);
        var v5 = new Color(0.1, 0.5, 0.3, 0.4);
        var v6 = new Color(0.5, 0.2, 0.3, 0.4);
        expect(v.equals(v2)).toEqual(true);
        expect(v.equals(v3)).toEqual(false);
        expect(v.equals(v4)).toEqual(false);
        expect(v.equals(v5)).toEqual(false);
        expect(v.equals(v6)).toEqual(false);
    });

    it('equalsEpsilon works', function() {
        var v = new Color(0.1, 0.2, 0.3, 0.4);
        var v2 = new Color(0.1, 0.2, 0.3, 0.4);
        var v3 = new Color(0.1, 0.2, 0.3, 0.5);
        var v4 = new Color(0.1, 0.2, 0.5, 0.4);
        var v5 = new Color(0.1, 0.5, 0.3, 0.4);
        var v6 = new Color(0.5, 0.2, 0.3, 0.4);
        expect(v.equalsEpsilon(v2, 0.0)).toEqual(true);
        expect(v.equalsEpsilon(v3, 0.0)).toEqual(false);
        expect(v.equalsEpsilon(v4, 0.0)).toEqual(false);
        expect(v.equalsEpsilon(v5, 0.0)).toEqual(false);
        expect(v.equalsEpsilon(v6, 0.0)).toEqual(false);

        expect(v.equalsEpsilon(v2, 0.1)).toEqual(true);
        expect(v.equalsEpsilon(v3, 0.1)).toEqual(true);
        expect(v.equalsEpsilon(v4, 0.2)).toEqual(true);
        expect(v.equalsEpsilon(v5, 0.3)).toEqual(true);
        expect(v.equalsEpsilon(v6, 0.4)).toEqual(true);
    });

    it('toCssColorString produces expected output', function() {
        expect(Color.WHITE.toCssColorString()).toEqual('rgb(255,255,255)');
        expect(Color.RED.toCssColorString()).toEqual('rgb(255,0,0)');
        expect(Color.BLUE.toCssColorString()).toEqual('rgb(0,0,255)');
        expect(Color.LIME.toCssColorString()).toEqual('rgb(0,255,0)');
        expect(new Color(0.0, 0.0, 0.0, 1.0).toCssColorString()).toEqual('rgb(0,0,0)');
        expect(new Color(0.1, 0.2, 0.3, 0.4).toCssColorString()).toEqual('rgba(25,51,76,0.4)');
    });

    it('fromCssColorString supports the #rgb format', function() {
        expect(Color.fromCssColorString('#369')).toEqual(new Color(0.2, 0.4, 0.6, 1.0));
    });

    it('fromCssColorString supports the #rgb format with lowercase', function() {
        expect(Color.fromCssColorString('#f00')).toEqual(Color.RED);
        expect(Color.fromCssColorString('#0f0')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('#00f')).toEqual(Color.BLUE);
    });

    it('fromCssColorString supports the #rgb format with uppercase', function() {
        expect(Color.fromCssColorString('#F00')).toEqual(Color.RED);
        expect(Color.fromCssColorString('#0F0')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('#00F')).toEqual(Color.BLUE);
    });

    it('fromCssColorString supports the #rrggbb', function() {
        expect(Color.fromCssColorString('#336699')).toEqual(new Color(0.2, 0.4, 0.6, 1.0));
    });

    it('fromCssColorString supports the #rrggbb format with lowercase', function() {
        expect(Color.fromCssColorString('#ff0000')).toEqual(Color.RED);
        expect(Color.fromCssColorString('#00ff00')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('#0000ff')).toEqual(Color.BLUE);
    });

    it('fromCssColorString supports the #rrggbb format with uppercase', function() {
        expect(Color.fromCssColorString('#FF0000')).toEqual(Color.RED);
        expect(Color.fromCssColorString('#00FF00')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('#0000FF')).toEqual(Color.BLUE);
    });

    it('fromCssColorString supports the rgb() format with absolute values', function() {
        expect(Color.fromCssColorString('rgb(255, 0, 0)')).toEqual(Color.RED);
        expect(Color.fromCssColorString('rgb(0, 255, 0)')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('rgb(0, 0, 255)')).toEqual(Color.BLUE);
        expect(Color.fromCssColorString('rgb(51, 102, 204)')).toEqual(new Color(0.2, 0.4, 0.8, 1.0));
    });

    it('fromCssColorString supports the rgb() format with percentages', function() {
        expect(Color.fromCssColorString('rgb(100%, 0, 0)')).toEqual(Color.RED);
        expect(Color.fromCssColorString('rgb(0, 100%, 0)')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('rgb(0, 0, 100%)')).toEqual(Color.BLUE);
        expect(Color.fromCssColorString('rgb(20%, 40%, 80%)')).toEqual(new Color(0.2, 0.4, 0.8, 1.0));
    });

    it('fromCssColorString supports the rgba() format with absolute values', function() {
        expect(Color.fromCssColorString('rgba(255, 0, 0, 1.0)')).toEqual(Color.RED);
        expect(Color.fromCssColorString('rgba(0, 255, 0, 1.0)')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('rgba(0, 0, 255, 1.0)')).toEqual(Color.BLUE);
        expect(Color.fromCssColorString('rgba(51, 102, 204, 0.6)')).toEqual(new Color(0.2, 0.4, 0.8, 0.6));
    });

    it('fromCssColorString supports the rgba() format with percentages', function() {
        expect(Color.fromCssColorString('rgba(100%, 0, 0, 1.0)')).toEqual(Color.RED);
        expect(Color.fromCssColorString('rgba(0, 100%, 0, 1.0)')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('rgba(0, 0, 100%, 1.0)')).toEqual(Color.BLUE);
        expect(Color.fromCssColorString('rgba(20%, 40%, 80%, 0.6)')).toEqual(new Color(0.2, 0.4, 0.8, 0.6));
    });

    it('fromCssColorString supports named colors regardless of case', function() {
        expect(Color.fromCssColorString('red')).toEqual(Color.RED);
        expect(Color.fromCssColorString('GREEN')).toEqual(Color.GREEN);
        expect(Color.fromCssColorString('BLue')).toEqual(Color.BLUE);
    });

    it('fromCssColorString supports the hsl() format', function() {
        expect(Color.fromCssColorString('hsl(0, 100%, 50%)')).toEqual(Color.RED);
        expect(Color.fromCssColorString('hsl(120, 100%, 50%)')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('hsl(240, 100%, 50%)')).toEqual(Color.BLUE);
        expect(Color.fromCssColorString('hsl(220, 60%, 50%)')).toEqualEpsilon(new Color(0.2, 0.4, 0.8), CesiumMath.EPSILON15);
    });

    it('fromCssColorString supports the hsla() format', function() {
        expect(Color.fromCssColorString('hsla(0, 100%, 50%, 1.0)')).toEqual(Color.RED);
        expect(Color.fromCssColorString('hsla(120, 100%, 50%, 1.0)')).toEqual(Color.LIME);
        expect(Color.fromCssColorString('hsla(240, 100%, 50%, 1.0)')).toEqual(Color.BLUE);
        expect(Color.fromCssColorString('hsla(220, 60%, 50%, 0.6)')).toEqualEpsilon(new Color(0.2, 0.4, 0.8, 0.6), CesiumMath.EPSILON15);
    });

    it('fromCssColorString wraps hue into valid range for hsl() format', function() {
        expect(Color.fromCssColorString('hsl(720, 100%, 50%)')).toEqual(Color.RED);
        expect(Color.fromCssColorString('hsla(720, 100%, 50%, 1.0)')).toEqual(Color.RED);
    });

    it('fromCssColorString returns undefined for unknown colors', function() {
        expect(Color.fromCssColorString('not a color')).toBeUndefined();
    });

    it('fromCssColorString throws with undefined', function() {
        expect(function() {
            Color.fromCssColorString(undefined);
        }).toThrow();
    });

    it('fromHsl produces expected output', function() {
        expect(Color.fromHsl(0.0, 1.0, 0.5, 1.0)).toEqual(Color.RED);
        expect(Color.fromHsl(120.0 / 360.0, 1.0, 0.5, 1.0)).toEqual(Color.LIME);
        expect(Color.fromHsl(240.0 / 360.0, 1.0, 0.5, 1.0)).toEqual(Color.BLUE);
        expect(Color.fromHsl(220.0 / 360.0, 0.6, 0.5, 0.7)).toEqualEpsilon(new Color(0.2, 0.4, 0.8, 0.7), CesiumMath.EPSILON15);
    });

    it('fromHsl properly wraps hue into valid range', function() {
        expect(Color.fromHsl(5, 1.0, 0.5, 1.0)).toEqual(Color.RED);
    });

    it('fromRandom generates a random color with no options', function() {
        var options = {
                red: undefined,
                green: undefined,
                blue: undefined,
                alpha: undefined
        };
        var randomColor = Color.fromRandom(options);
        expect(randomColor.red <= 1.0 && randomColor. red >= 0.0).toBe(true);
        expect(randomColor.green <= 1.0 && randomColor.green >= 0.0).toBe(true);
        expect(randomColor.blue <= 1.0 && randomColor.blue >= 0.0).toBe(true);
        expect(randomColor.alpha <= 1.0 && randomColor.alpha >= 0.0).toBe(true);
    });

    it('fromRandom generates a random color with a custom seed', function() {
        var options = {
                red: undefined,
                green: undefined,
                blue: undefined,
                alpha: undefined,
                seed: 42
        };
        var randomColor = Color.fromRandom(options);
        expect(randomColor.red <= 1.0 && randomColor. red >= 0.0).toBe(true);
        expect(randomColor.green <= 1.0 && randomColor.green >= 0.0).toBe(true);
        expect(randomColor.blue <= 1.0 && randomColor.blue >= 0.0).toBe(true);
        expect(randomColor.alpha <= 1.0 && randomColor.alpha >= 0.0).toBe(true);
    });

    it('fromRandom generates the same color when seed is re-used', function() {
        var options = {
                red: undefined,
                green: undefined,
                blue: undefined,
                alpha: undefined,
                seed: 42
        };
        var randomColor = Color.fromRandom(options);
        var anotherRandomColor = Color.fromRandom(options);
        expect(randomColor).toEqual(anotherRandomColor);
    });

    it('fromRandom works with all components specified', function() {
        var options = {
                red: 1,
                green: 1,
                blue: 1,
                alpha: 1
        };
        var randomColor = Color.fromRandom(options);
        expect(randomColor.red).toEqual(1);
        expect(randomColor.green).toEqual(1);
        expect(randomColor.blue).toEqual(1);
        expect(randomColor.alpha).toEqual(1);
    });

    it('fromRandom works with all components specified and a result paramenter', function() {
        var options = {
                red: 1,
                green: 1,
                blue: 1,
                alpha: 1
        };
        var randomColor = new Color(0, 0, 0, 0);
        Color.fromRandom(options, randomColor);
        expect(randomColor.red).toEqual(1);
        expect(randomColor.green).toEqual(1);
        expect(randomColor.blue).toEqual(1);
        expect(randomColor.alpha).toEqual(1);
    });

    it('fromRandom generates a random kind of Red color within intervals', function() {
        var options = {
                red: undefined,
                minimumRed: 0,
                maximumRed: 0.5,
                green: 0,
                blue: 0,
                alpha: 0
        };
        var randomColor = Color.fromRandom(options);
        expect(randomColor.red <= 0.5 && randomColor.red >= 0.0).toBe(true);
        expect(randomColor.green).toEqual(0);
        expect(randomColor.blue).toEqual(0);
        expect(randomColor.alpha).toEqual(0);
    });

    it('fromRandom generates a random kind of Green color within intervals', function() {
        var options = {
                red: 0,
                green: undefined,
                minimumGreen: 0,
                maximumGreen: 0.5,
                blue: 0,
                alpha: 0
        };
        var randomColor = Color.fromRandom(options);
        expect(randomColor.red).toEqual(0);
        expect(randomColor.green <= 0.5 && randomColor.green >= 0.0).toBe(true);
        expect(randomColor.blue).toEqual(0);
        expect(randomColor.alpha).toEqual(0);
    });

    it('fromRandom generates a random kind of Blue color within intervals', function() {
        var options = {
                red: 0,
                green: 0,
                blue: undefined,
                minimumBlue: 0,
                maximumBlue: 0.5,
                alpha: 0
        };
        var randomColor = Color.fromRandom(options);
        expect(randomColor.red).toEqual(0);
        expect(randomColor.green).toEqual(0);
        expect(randomColor.blue <= 0.5 && randomColor.blue >= 0.0).toBe(true);
        expect(randomColor.alpha).toEqual(0);
    });

    it('fromRandom generates a random kind of Alpha component within intervals', function() {
        var options = {
                red: 0,
                green: 0,
                blue: 0,
                alpha: undefined,
                minimumAlpha: 0,
                maximumAlpha: 0.5
        };
        var randomColor = Color.fromRandom(options);
        expect(randomColor.red).toEqual(0);
        expect(randomColor.green).toEqual(0);
        expect(randomColor.blue).toEqual(0);
        expect(randomColor.alpha <= 0.5 && randomColor.alpha >= 0.0).toBe(true);
    });

    it('fromRandom throws with invalid min\\max components', function() {
        var options = {
                red: undefined,
                minimumRed: 1,
                maximumRed: 0,
                green: 0,
                blue: 0,
                alpha: 0.5
        };
        expect(function() {
            Color.fromRandom(options);
        }).toThrow();
    });


    it('toString produces correct results', function() {
        expect(new Color(0.1, 0.2, 0.3, 0.4).toString()).toEqual('(0.1, 0.2, 0.3, 0.4)');
    });

    it('can convert to and from RGBA', function() {
        // exact values will depend on endianness, but it should round-trip.
        var color = Color.fromBytes(0xFF, 0xCC, 0x00, 0xEE);

        var rgba = color.toRgba();
        expect(rgba).toBeGreaterThan(0);

        var newColor = Color.fromRgba(rgba);
        expect(color).toEqual(newColor);

        var newRgba = newColor.toRgba();
        expect(rgba).toEqual(newRgba);
    });
});
