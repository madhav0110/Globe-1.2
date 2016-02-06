/*global defineSuite*/
defineSuite([
        'Core/FeatureDetection'
    ], function(
        FeatureDetection) {
    'use strict';

    //generally, these tests just make sure the function runs, the test can't expect a value of true or false
    it('detects fullscreen support', function() {
        var supportsFullscreen = FeatureDetection.supportsFullscreen();
        expect(typeof supportsFullscreen).toEqual('boolean');
    });

    it('detects web worker support', function() {
        var supportsWebWorkers = FeatureDetection.supportsWebWorkers();
        expect(typeof supportsWebWorkers).toEqual('boolean');
    });

    it('detects typed array support', function() {
        var supportsTypedArrays = FeatureDetection.supportsTypedArrays();
        expect(typeof supportsTypedArrays).toEqual('boolean');
    });

    function checkVersionArray(array) {
        expect(Array.isArray(array)).toEqual(true);
        array.forEach(function(d) {
            expect(typeof d).toEqual('number');
        });
    }

    it('detects Chrome', function() {
        var isChrome = FeatureDetection.isChrome();
        expect(typeof isChrome).toEqual('boolean');

        if (isChrome) {
            var chromeVersion = FeatureDetection.chromeVersion();
            checkVersionArray(chromeVersion);

            console.log('detected Chrome ' + chromeVersion.join('.'));
        }
    });

    it('detects Safari', function() {
        var isSafari = FeatureDetection.isSafari();
        expect(typeof isSafari).toEqual('boolean');

        if (isSafari) {
            var safariVersion = FeatureDetection.safariVersion();
            checkVersionArray(safariVersion);

            console.log('detected Safari ' + safariVersion.join('.'));
        }
    });

    it('detects Webkit', function() {
        var isWebkit = FeatureDetection.isWebkit();
        expect(typeof isWebkit).toEqual('boolean');

        if (isWebkit) {
            var webkitVersion = FeatureDetection.webkitVersion();
            checkVersionArray(webkitVersion);
            expect(typeof webkitVersion.isNightly).toEqual('boolean');

            console.log('detected Webkit ' + webkitVersion.join('.') + (webkitVersion.isNightly ? ' (Nightly)' : ''));
        }
    });

    it('detects Internet Explorer', function() {
        var isInternetExplorer = FeatureDetection.isInternetExplorer();
        expect(typeof isInternetExplorer).toEqual('boolean');

        if (isInternetExplorer) {
            var internetExplorerVersion = FeatureDetection.internetExplorerVersion();
            checkVersionArray(internetExplorerVersion);

            console.log('detected Internet Explorer ' + internetExplorerVersion.join('.'));
        }
    });

    it('detects Firefox', function() {
        var isFirefox = FeatureDetection.isFirefox();
        expect(typeof isFirefox).toEqual('boolean');

        if (isFirefox) {
            var firefoxVersion = FeatureDetection.firefoxVersion();

            checkVersionArray(firefoxVersion);

            console.log('detected Firefox ' + firefoxVersion.join('.'));
        }
    });
});
