/*global define*/
define([
        '../../Core/defineProperties',
        '../../Core/DeveloperError',
        '../../Core/destroyObject',
        '../getElement',
        './SelectionIndicatorViewModel',
        '../../ThirdParty/knockout'
    ], function(
        defineProperties,
        DeveloperError,
        destroyObject,
        getElement,
        SelectionIndicatorViewModel,
        knockout) {
    "use strict";

    /**
     * A widget for displaying an indicator on a selected object.
     *
     * @alias SelectionIndicator
     * @constructor
     *
     * @param {Element|String} container The DOM element or ID that will contain the widget.
     * @param {Scene} scene The Scene instance to use.
     *
     * @exception {DeveloperError} container is required.
     * @exception {DeveloperError} Element with id "container" does not exist in the document.
     */
    var SelectionIndicator = function(container, scene) {
        if (typeof container === 'undefined') {
            throw new DeveloperError('container is required.');
        }

        container = getElement(container);

        this._container = container;
        container.setAttribute('data-bind', 'css: { "cesium-selection-container" : true, "cesium-selection-container-visible" : showSelection }');

        var el = document.createElement('div');
        this._element = el;
        el.className = 'cesium-selection-wrapper';
        container.appendChild(el);
        el.setAttribute('data-bind', 'style: { "bottom" : _positionY, "left" : _positionX}');
        this._element = el;

        var viewModel = new SelectionIndicatorViewModel(scene, this._element, this._container);
        this._viewModel = viewModel;

        knockout.applyBindings(this._viewModel, this._container);
    };

    defineProperties(SelectionIndicator.prototype, {
        /**
         * Gets the parent container.
         * @memberof SelectionIndicator.prototype
         *
         * @type {Element}
         */
        container : {
            get : function() {
                return this._container;
            }
        },

        /**
         * Gets the view model.
         * @memberof SelectionIndicator.prototype
         *
         * @type {SelectionIndicatorViewModel}
         */
        viewModel : {
            get : function() {
                return this._viewModel;
            }
        }
    });

    /**
     * @memberof SelectionIndicator
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    SelectionIndicator.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the widget.  Should be called if permanently
     * removing the widget from layout.
     * @memberof SelectionIndicator
     */
    SelectionIndicator.prototype.destroy = function() {
        var container = this._container;
        knockout.cleanNode(container);
        container.removeChild(this._element);
        return destroyObject(this);
    };

    return SelectionIndicator;
});