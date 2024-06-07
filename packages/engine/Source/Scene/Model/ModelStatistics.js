import AssociativeArray from "../../Core/AssociativeArray.js";
import Check from "../../Core/Check.js";

/**
 * Rendering statistics for a single model.
 * @alias ModelStatistics
 * @class
 * @see Cesium3DTilesetStatistics
 * @private
 */
function ModelStatistics() {
  /**
   * Total number of points across all POINTS primitives in this model.
   * @type {number}
   * @private
   */
  this.pointsLength = 0;

  /**
   * Total number of triangles across all TRIANGLES, TRIANGLE_STRIP or
   * TRIANGLE_FAN primitives in this model.
   * @type {number}
   * @private
   */
  this.trianglesLength = 0;

  /**
   * Total size of all geometry buffers in bytes. This accounts for the vertex
   * attributes (which includes feature IDs and property attributes) and index
   * buffers of all the model's primitives. Any attributes generated by the
   * pipeline are included in this total.
   * @type {number}
   * @private
   */
  this.geometryByteLength = 0;

  /**
   * Total size of all textures in bytes. This includes materials,
   * feature ID textures, and property textures.
   * @type {number}
   * @private
   */
  this.texturesByteLength = 0;

  /**
   * Total size of property tables. This excludes the batch textures used for
   * picking and styling.
   * @type {number}
   * @private
   */
  this.propertyTablesByteLength = 0;

  // Sets of buffers and textures that have already been counted.
  // This is to prevent double-counting cached assets.
  this._bufferIdSet = {};
  this._textureIdSet = {};

  // Associated array of batch textures that have already been counted.
  // This allows for quick look-up to check if a texture has been counted,
  // while also allowing for dynamic texture counting.
  this._batchTextureIdMap = new AssociativeArray();
}

Object.defineProperties(ModelStatistics.prototype, {
  /**
   * Total size of the batch textures used for picking and styling.
   * Batch textures are created asynchronously, so this iterates
   * over the textures to ensure their memory values are accurate.
   * @memberof ModelStatistics.prototype
   * @type {number}
   * @readonly
   * @private
   */
  batchTexturesByteLength: {
    get: function () {
      const length = this._batchTextureIdMap.length;
      const values = this._batchTextureIdMap.values;

      let memory = 0;
      for (let i = 0; i < length; i++) {
        memory += values[i].byteLength;
      }

      return memory;
    },
  },
});

/**
 * Reset the memory counts for this model. This should be called each time the
 * draw command pipeline is rebuilt.
 * @private
 */
ModelStatistics.prototype.clear = function () {
  this.pointsLength = 0;
  this.trianglesLength = 0;
  this.geometryByteLength = 0;
  this.texturesByteLength = 0;
  this.propertyTablesByteLength = 0;

  this._bufferIdSet = {};
  this._textureIdSet = {};
  this._batchTextureIdMap.removeAll();
};

/**
 * Counts the given buffer's memory in bytes. If a buffer has
 * already been counted by these statistics, it will not be
 * counted again.
 * @param {Buffer} buffer The GPU buffer associated with the model.
 * @param {boolean} hasCpuCopy Whether the buffer has a copy on the CPU via typed array.
 * @private
 */
ModelStatistics.prototype.addBuffer = function (buffer, hasCpuCopy) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("buffer", buffer);
  Check.typeOf.bool("hasCpuCopy", hasCpuCopy);
  //>>includeEnd('debug');

  if (!this._bufferIdSet.hasOwnProperty(buffer._id)) {
    // If there's a CPU copy, count the memory twice.
    const copies = hasCpuCopy ? 2 : 1;
    this.geometryByteLength += buffer.sizeInBytes * copies;
  }

  // Simulate set insertion.
  this._bufferIdSet[buffer._id] = true;
};

/**
 * Counts the given texture's memory in bytes. If a texture has
 * already been counted by these statistics, it will not be
 * counted again.
 * <p>
 * This is used to count the materials and property textures of
 * a model. Batch textures function differently and are counted
 * using <code>addBatchTexture</code> instead.
 * </p>
 * @param {Texture} texture The texture associated with the model.
 * @private
 */
ModelStatistics.prototype.addTexture = function (texture) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("texture", texture);
  //>>includeEnd('debug');

  if (!this._textureIdSet.hasOwnProperty(texture._id)) {
    this.texturesByteLength += texture.sizeInBytes;
  }

  // Simulate set insertion.
  this._textureIdSet[texture._id] = true;
};

/**
 * Counts the batch texture's memory in bytes. If a batch texture
 * has already been counted by these statistics, it will not be
 * counted again.
 * <p>
 * Batch textures are handled differently than other textures. They
 * include the batch and pick textures for the feature table, which
 * are created dynamically. As such, they may not have both textures
 * loaded by the time they are added to the statistics. Their memory
 * will thus be counted dynamically.
 * </p>
 * @param {BatchTexture} batchTexture The batch texture associated with the model.
 * @private
 */
ModelStatistics.prototype.addBatchTexture = function (batchTexture) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("batchTexture", batchTexture);
  //>>includeEnd('debug');

  if (!this._batchTextureIdMap.contains(batchTexture._id)) {
    this._batchTextureIdMap.set(batchTexture._id, batchTexture);
  }
};

export default ModelStatistics;
