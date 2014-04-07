/*global define*/
define(['../Core/Color',
        '../Core/ColorGeometryInstanceAttribute',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/FanGeometry',
        '../Core/FanOutlineGeometry',
        '../Core/Event',
        '../Core/GeometryInstance',
        '../Core/Iso8601',
        '../Core/Matrix3',
        '../Core/Matrix4',
        '../Core/ShowGeometryInstanceAttribute',
        '../DynamicScene/ColorMaterialProperty',
        '../DynamicScene/ConstantProperty',
        '../DynamicScene/MaterialProperty',
        '../DynamicScene/Property',
        '../Scene/MaterialAppearance',
        '../Scene/PerInstanceColorAppearance',
        '../Scene/Primitive'
    ], function(
        Color,
        ColorGeometryInstanceAttribute,
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        FanGeometry,
        FanOutlineGeometry,
        Event,
        GeometryInstance,
        Iso8601,
        Matrix3,
        Matrix4,
        ShowGeometryInstanceAttribute,
        ColorMaterialProperty,
        ConstantProperty,
        MaterialProperty,
        Property,
        MaterialAppearance,
        PerInstanceColorAppearance,
        Primitive) {
    "use strict";

    var positionScratch;
    var orientationScratch;
    var matrix3Scratch;

    var defaultMaterial = ColorMaterialProperty.fromColor(Color.WHITE);
    var defaultShow = new ConstantProperty(true);
    var defaultFill = new ConstantProperty(true);
    var defaultOutline = new ConstantProperty(false);
    var defaultOutlineColor = new ConstantProperty(Color.BLACK);
    var defaultNumberOfRings = new ConstantProperty(6);

    var GeometryOptions = function(dynamicObject) {
        this.id = dynamicObject;
        this.vertexFormat = undefined;
        this.directions = undefined;
        this.radius = undefined;
        this.perDirectionRadius = undefined;
        this.numberOfRings = undefined;
    };

    /**
     * A {@link GeometryUpdater} for fans.
     * Clients do not normally create this class directly, but instead rely on {@link DataSourceDisplay}.
     * @alias FanGeometryUpdater
     * @constructor
     *
     * @param {DynamicObject} dynamicObject The object containing the geometry to be visualized.
     */
    var FanGeometryUpdater = function(dynamicObject) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(dynamicObject)) {
            throw new DeveloperError('dynamicObject is required');
        }
        //>>includeEnd('debug');

        this._dynamicObject = dynamicObject;
        this._dynamicObjectSubscription = dynamicObject.definitionChanged.addEventListener(FanGeometryUpdater.prototype._onDynamicObjectPropertyChanged, this);
        this._fillEnabled = false;
        this._dynamic = false;
        this._outlineEnabled = false;
        this._geometryChanged = new Event();
        this._showProperty = undefined;
        this._materialProperty = undefined;
        this._hasConstantOutline = true;
        this._showOutlineProperty = undefined;
        this._outlineColorProperty = undefined;
        this._options = new GeometryOptions(dynamicObject);
        this._onDynamicObjectPropertyChanged(dynamicObject, 'fan', dynamicObject.fan, undefined);
    };

    defineProperties(FanGeometryUpdater, {
        /**
         * Gets the type of Appearance to use for simple color-based geometry.
         * @memberof FanGeometryUpdater
         * @type {Appearance}
         */
        perInstanceColorAppearanceType : {
            value : PerInstanceColorAppearance
        },
        /**
         * Gets the type of Appearance to use for material-based geometry.
         * @memberof FanGeometryUpdater
         * @type {Appearance}
         */
        materialAppearanceType : {
            value : MaterialAppearance
        }
    });

    defineProperties(FanGeometryUpdater.prototype, {
        /**
         * Gets the object associated with this geometry.
         * @memberof FanGeometryUpdater.prototype
         * @type {DynamicObject}
         */
        dynamicObject :{
            get : function() {
                return this._dynamicObject;
            }
        },
        /**
         * Gets a value indicating if the geometry has a fill component.
         * @memberof FanGeometryUpdater.prototype
         * @type {Boolean}
         */
        fillEnabled : {
            get : function() {
                return this._fillEnabled;
            }
        },
        /**
         * Gets a value indicating if fill visibility varies with simulation time.
         * @memberof FanGeometryUpdater.prototype
         * @type {Boolean}
         */
        hasConstantFill : {
            get : function() {
                return !this._fillEnabled ||
                       (!defined(this._dynamicObject.availability) &&
                        Property.isConstant(this._showProperty) &&
                        Property.isConstant(this._fillProperty));
            }
        },
        /**
         * Gets the material property used to fill the geometry.
         * @memberof FanGeometryUpdater.prototype
         * @type {MaterialProperty}
         */
        fillMaterialProperty : {
            get : function() {
                return this._materialProperty;
            }
        },
        /**
         * Gets a value indicating if the geometry has an outline component.
         * @memberof FanGeometryUpdater.prototype
         * @type {Boolean}
         */
        outlineEnabled : {
            get : function() {
                return this._outlineEnabled;
            }
        },
        /**
         * Gets a value indicating if the geometry has an outline component.
         * @memberof FanGeometryUpdater.prototype
         * @type {Boolean}
         */
        hasConstantOutline : {
            get : function() {
                return !this._outlineEnabled ||
                       (!defined(this._dynamicObject.availability) &&
                        Property.isConstant(this._showProperty) &&
                        Property.isConstant(this._showOutlineProperty));
            }
        },
        /**
         * Gets the {@link Color} property for the geometry outline.
         * @memberof FanGeometryUpdater.prototype
         * @type {Property}
         */
        outlineColorProperty : {
            get : function() {
                return this._outlineColorProperty;
            }
        },
        /**
         * Gets a value indicating if the geometry is time-varying.
         * If true, all visualization is delegated to the {@link DynamicGeometryUpdater}
         * returned by GeometryUpdater#createDynamicUpdater.
         *
         * @memberof FanGeometryUpdater.prototype
         * @type {Boolean}
         */
        isDynamic : {
            get : function() {
                return this._dynamic;
            }
        },
        /**
         * Gets a value indicating if the geometry is closed.
         * This property is only valid for static geometry.
         * @memberof FanGeometryUpdater.prototype
         * @type {Boolean}
         */
        isClosed : {
            get : function() {
                return false;
            }
        },
        /**
         * Gets an event that is raised whenever the public properties
         * of this updater change.
         * @memberof FanGeometryUpdater.prototype
         * @type {Boolean}
         */
        geometryChanged : {
            get : function() {
                return this._geometryChanged;
            }
        }
    });

    /**
     * Checks if the geometry is outlined at the provided time.
     * @memberof FanGeometryUpdater
     * @function
     *
     * @param {JulianDate} time The time for which to retrieve visibility.
     * @returns {Boolean} true if geometry is outlined at the provided time, false otherwise.
     */
    FanGeometryUpdater.prototype.isOutlineVisible = function(time) {
        var dynamicObject = this._dynamicObject;
        return this._outlineEnabled && dynamicObject.isAvailable(time) && this._showProperty.getValue(time) && this._showOutlineProperty.getValue(time);
    };

    /**
     * Checks if the geometry is filled at the provided time.
     * @memberof FanGeometryUpdater
     * @function
     *
     * @param {JulianDate} time The time for which to retrieve visibility.
     * @returns {Boolean} true if geometry is filled at the provided time, false otherwise.
     */
    FanGeometryUpdater.prototype.isFilled = function(time) {
        var dynamicObject = this._dynamicObject;
        return this._fillEnabled && dynamicObject.isAvailable(time) && this._showProperty.getValue(time) && this._fillProperty.getValue(time);
    };

    /**
     * Creates the geometry instance which represents the fill of the geometry.
     * @memberof FanGeometryUpdater
     * @function
     *
     * @param {JulianDate} time The time to use when retrieving initial attribute values.
     * @returns {GeometryInstance} The geometry instance representing the filled portion of the geometry.
     *
     * @exception {DeveloperError} This instance does not represent a filled geometry.
     */
    FanGeometryUpdater.prototype.createFillGeometryInstance = function(time) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }

        if (!this._fillEnabled) {
            throw new DeveloperError('This instance does not represent a filled geometry.');
        }
        //>>includeEnd('debug');

        var dynamicObject = this._dynamicObject;
        var isAvailable = dynamicObject.isAvailable(time);

        var attributes;

        var color;
        var show = new ShowGeometryInstanceAttribute(isAvailable && this._showProperty.getValue(time) && this._fillProperty.getValue(time));
        if (this._materialProperty instanceof ColorMaterialProperty) {
            var currentColor = Color.WHITE;
            if (defined(this._materialProperty.color) && (this._materialProperty.color.isConstant || isAvailable)) {
                currentColor = this._materialProperty.color.getValue(time);
            }
            color = ColorGeometryInstanceAttribute.fromColor(currentColor);
            attributes = {
                show : show,
                color : color
            };
        } else {
            attributes = {
                show : show
            };
        }

        positionScratch = dynamicObject.position.getValue(Iso8601.MINIMUM_VALUE, positionScratch);
        orientationScratch = dynamicObject.orientation.getValue(Iso8601.MINIMUM_VALUE, orientationScratch);
        matrix3Scratch = Matrix3.fromQuaternion(orientationScratch, matrix3Scratch);

        return new GeometryInstance({
            id : dynamicObject,
            geometry : new FanGeometry(this._options),
            modelMatrix : Matrix4.fromRotationTranslation(matrix3Scratch, positionScratch),
            attributes : attributes
        });
    };

    /**
     * Creates the geometry instance which represents the outline of the geometry.
     * @memberof FanGeometryUpdater
     * @function
     *
     * @param {JulianDate} time The time to use when retrieving initial attribute values.
     * @returns {GeometryInstance} The geometry instance representing the outline portion of the geometry.
     *
     * @exception {DeveloperError} This instance does not represent an outlined geometry.
     */
    FanGeometryUpdater.prototype.createOutlineGeometryInstance = function(time) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }

        if (!this._outlineEnabled) {
            throw new DeveloperError('This instance does not represent an outlined geometry.');
        }
        //>>includeEnd('debug');

        var dynamicObject = this._dynamicObject;
        var isAvailable = dynamicObject.isAvailable(time);

        positionScratch = dynamicObject.position.getValue(Iso8601.MINIMUM_VALUE, positionScratch);
        orientationScratch = dynamicObject.orientation.getValue(Iso8601.MINIMUM_VALUE, orientationScratch);
        matrix3Scratch = Matrix3.fromQuaternion(orientationScratch, matrix3Scratch);

        return new GeometryInstance({
            id : dynamicObject,
            geometry : new FanOutlineGeometry(this._options),
            modelMatrix : Matrix4.fromRotationTranslation(matrix3Scratch, positionScratch),
            attributes : {
                show : new ShowGeometryInstanceAttribute(isAvailable && this._showProperty.getValue(time) && this._showOutlineProperty.getValue(time)),
                color : ColorGeometryInstanceAttribute.fromColor(isAvailable ? this._outlineColorProperty.getValue(time) : Color.BLACK)
            }
        });
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * @memberof FanGeometryUpdater
     * @function
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    FanGeometryUpdater.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys and resources used by the object.  Once an object is destroyed, it should not be used.
     * @memberof FanGeometryUpdater
     * @function
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     */
    FanGeometryUpdater.prototype.destroy = function() {
        this._dynamicObjectSubscription();
        destroyObject(this);
    };

    FanGeometryUpdater.prototype._onDynamicObjectPropertyChanged = function(dynamicObject, propertyName, newValue, oldValue) {
        if (!(propertyName === 'availability' || propertyName === 'position' || propertyName === 'fan')) {
            return;
        }

        var fan = this._dynamicObject.fan;

        if (!defined(fan)) {
            if (this._fillEnabled || this._outlineEnabled) {
                this._fillEnabled = false;
                this._outlineEnabled = false;
                this._geometryChanged.raiseEvent(this);
            }
            return;
        }

        var fillProperty = fan.fill;
        var fillEnabled = defined(fillProperty) && fillProperty.isConstant ? fillProperty.getValue(Iso8601.MINIMUM_VALUE) : true;

        var outlineProperty = fan.outline;
        var outlineEnabled = defined(outlineProperty);
        if (outlineEnabled && outlineProperty.isConstant) {
            outlineEnabled = outlineProperty.getValue(Iso8601.MINIMUM_VALUE);
        }

        if (!fillEnabled && !outlineEnabled) {
            if (this._fillEnabled || this._outlineEnabled) {
                this._fillEnabled = false;
                this._outlineEnabled = false;
                this._geometryChanged.raiseEvent(this);
            }
            return;
        }

        var position = this._dynamicObject.position;
        var orientation = this._dynamicObject.orientation;
        var radius = fan.radius;
        var perDirectionRadius = fan.perDirectionRadius;
        var directions = fan.directions;

        var show = fan.show;
        if ((defined(show) && show.isConstant && !show.getValue(Iso8601.MINIMUM_VALUE)) || //
            (!defined(position) || !defined(orientation) || (!defined(perDirectionRadius) && !defined(radius)))) {
            if (this._fillEnabled || this._outlineEnabled) {
                this._fillEnabled = false;
                this._outlineEnabled = false;
                this._geometryChanged.raiseEvent(this);
            }
            return;
        }

        var material = defaultValue(fan.material, defaultMaterial);
        var isColorMaterial = material instanceof ColorMaterialProperty;
        this._materialProperty = material;
        this._fillProperty = defaultValue(fillProperty, defaultFill);
        this._showProperty = defaultValue(show, defaultShow);
        this._showOutlineProperty = defaultValue(fan.outline, defaultOutline);
        this._outlineColorProperty = outlineEnabled ? defaultValue(fan.outlineColor, defaultOutlineColor) : undefined;

        this._fillEnabled = fillEnabled;
        this._outlineEnabled = outlineEnabled;

        var numberOfRings = defaultValue(fan.numberOfRings, defaultNumberOfRings);
        if (!position.isConstant ||
            !orientation.isConstant ||
            (defined(perDirectionRadius) && !perDirectionRadius.isConstant) ||
            (defined(radius) && !radius.isConstant) ||
            !directions.isConstant ||
            !numberOfRings.isConstant) {
            if (!this._dynamic) {
                this._dynamic = true;
                this._geometryChanged.raiseEvent(this);
            }
        } else {
            var options = this._options;
            options.vertexFormat = isColorMaterial ? PerInstanceColorAppearance.VERTEX_FORMAT : MaterialAppearance.VERTEX_FORMAT;
            options.directions = directions.getValue(Iso8601.MINIMUM_VALUE, options.directions);
            options.radius = defined(radius) ? radius.getValue(Iso8601.MINIMUM_VALUE) : undefined;
            options.perDirectionRadius = defined(perDirectionRadius) ? perDirectionRadius.getValue(Iso8601.MINIMUM_VALUE) : undefined;
            options.numberOfRings = defined(numberOfRings) ? numberOfRings.getValue(Iso8601.MINIMUM_VALUE) : undefined;

            this._dynamic = false;
            this._geometryChanged.raiseEvent(this);
        }
    };

    /**
     * Creates the dynamic updater to be used when GeometryUpdater#isDynamic is true.
     * @memberof FanGeometryUpdater
     * @function
     *
     * @param {CompositePrimitive} primitives The primitive collection to use.
     * @returns {DynamicGeometryUpdater} The dynamic updater used to update the geometry each frame.
     *
     * @exception {DeveloperError} This instance does not represent dynamic geometry.
     */
    FanGeometryUpdater.prototype.createDynamicUpdater = function(primitives) {
        //>>includeStart('debug', pragmas.debug);
        if (!this._dynamic) {
            throw new DeveloperError('This instance does not represent dynamic geometry.');
        }

        if (!defined(primitives)) {
            throw new DeveloperError('primitives is required.');
        }
        //>>includeEnd('debug');

        return new DynamicGeometryUpdater(primitives, this);
    };

    /**
     * @private
     */
    var DynamicGeometryUpdater = function(primitives, geometryUpdater) {
        this._primitives = primitives;
        this._primitive = undefined;
        this._outlinePrimitive = undefined;
        this._geometryUpdater = geometryUpdater;
        this._options = new GeometryOptions(geometryUpdater._dynamicObject);
    };

    DynamicGeometryUpdater.prototype.update = function(time) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }
        //>>includeEnd('debug');

        var geometryUpdater = this._geometryUpdater;

        if (defined(this._primitive)) {
            this._primitives.remove(this._primitive);
        }

        if (defined(this._outlinePrimitive)) {
            this._primitives.remove(this._outlinePrimitive);
        }

        var dynamicObject = geometryUpdater._dynamicObject;
        var fan = dynamicObject.fan;
        var show = fan.show;

        if (!dynamicObject.isAvailable(time) || (defined(show) && !show.getValue(time))) {
            return;
        }

        var directions = fan.directions;
        var radius = fan.radius;
        var perDirectionRadius = fan.perDirectionRadius;
        var numberOfRings = fan.numberOfRings;

        var options = this._options;
        options.directions = directions.getValue(time, options.directions);
        options.radius = defined(radius) ? radius.getValue(time) : undefined;
        options.perDirectionRadius = defined(perDirectionRadius) ? perDirectionRadius.getValue(time) : undefined;
        options.numberOfRings = defined(numberOfRings) ? numberOfRings.getValue(time) : undefined;

        positionScratch = dynamicObject.position.getValue(time, positionScratch);
        orientationScratch = dynamicObject.orientation.getValue(time, orientationScratch);
        matrix3Scratch = Matrix3.fromQuaternion(orientationScratch, matrix3Scratch);

        if (!defined(fan.fill) || fan.fill.getValue(time)) {
            this._material = MaterialProperty.getValue(time, geometryUpdater.fillMaterialProperty, this._material);
            var material = this._material;
            var appearance = new MaterialAppearance({
                material : material,
                translucent : material.isTranslucent(),
                closed : defined(options.extrudedHeight)
            });
            options.vertexFormat = appearance.vertexFormat;

            this._primitive = new Primitive({
                geometryInstances : new GeometryInstance({
                    id : dynamicObject,
                    geometry : new FanGeometry(options),
                    modelMatrix : Matrix4.fromRotationTranslation(matrix3Scratch, positionScratch)
                }),
                appearance : appearance,
                asynchronous : false
            });
            this._primitives.add(this._primitive);
        }

        if (defined(fan.outline) && fan.outline.getValue(time)) {
            options.vertexFormat = PerInstanceColorAppearance.VERTEX_FORMAT;

            var outlineColor = defined(fan.outlineColor) ? fan.outlineColor.getValue(time) : Color.BLACK;
            this._outlinePrimitive = new Primitive({
                geometryInstances : new GeometryInstance({
                    id : dynamicObject,
                    geometry : new FanOutlineGeometry(options),
                    modelMatrix : Matrix4.fromRotationTranslation(matrix3Scratch, positionScratch),
                    attributes : {
                        color : ColorGeometryInstanceAttribute.fromColor(outlineColor)
                    }
                }),
                appearance : new PerInstanceColorAppearance({
                    flat : true,
                    translucent : outlineColor.alpha !== 1.0
                }),
                asynchronous : false
            });
            this._primitives.add(this._outlinePrimitive);
        }
    };

    DynamicGeometryUpdater.prototype.isDestroyed = function() {
        return false;
    };

    DynamicGeometryUpdater.prototype.destroy = function() {
        if (defined(this._primitive)) {
            this._primitives.remove(this._primitive);
        }

        if (defined(this._outlinePrimitive)) {
            this._primitives.remove(this._outlinePrimitive);
        }
        destroyObject(this);
    };

    return FanGeometryUpdater;
});