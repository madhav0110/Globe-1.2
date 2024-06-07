import AssociativeArray from "../Core/AssociativeArray.js";
import createGuid from "../Core/createGuid.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import Iso8601 from "../Core/Iso8601.js";
import JulianDate from "../Core/JulianDate.js";
import TimeInterval from "../Core/TimeInterval.js";
import Entity from "./Entity.js";

const entityOptionsScratch = {
  id: undefined,
};

function fireChangedEvent(collection) {
  if (collection._firing) {
    collection._refire = true;
    return;
  }

  if (collection._suspendCount === 0) {
    const added = collection._addedEntities;
    const removed = collection._removedEntities;
    const changed = collection._changedEntities;
    if (changed.length !== 0 || added.length !== 0 || removed.length !== 0) {
      collection._firing = true;
      do {
        collection._refire = false;
        const addedArray = added.values.slice(0);
        const removedArray = removed.values.slice(0);
        const changedArray = changed.values.slice(0);

        added.removeAll();
        removed.removeAll();
        changed.removeAll();
        collection._collectionChanged.raiseEvent(
          collection,
          addedArray,
          removedArray,
          changedArray
        );
      } while (collection._refire);
      collection._firing = false;
    }
  }
}

/**
 * An observable collection of {@link Entity} instances where each entity has a unique id.
 * @alias EntityCollection
 * @class
 * @param {DataSource|CompositeEntityCollection} [owner] The data source (or composite entity collection) which created this collection.
 */
function EntityCollection(owner) {
  this._owner = owner;
  this._entities = new AssociativeArray();
  this._addedEntities = new AssociativeArray();
  this._removedEntities = new AssociativeArray();
  this._changedEntities = new AssociativeArray();
  this._suspendCount = 0;
  this._collectionChanged = new Event();
  this._id = createGuid();
  this._show = true;
  this._firing = false;
  this._refire = false;
}

/**
 * Prevents {@link EntityCollection#collectionChanged} events from being raised
 * until a corresponding call is made to {@link EntityCollection#resumeEvents}, at which
 * point a single event will be raised that covers all suspended operations.
 * This allows for many items to be added and removed efficiently.
 * This function can be safely called multiple times as long as there
 * are corresponding calls to {@link EntityCollection#resumeEvents}.
 */
EntityCollection.prototype.suspendEvents = function () {
  this._suspendCount++;
};

/**
 * Resumes raising {@link EntityCollection#collectionChanged} events immediately
 * when an item is added or removed.  Any modifications made while while events were suspended
 * will be triggered as a single event when this function is called.
 * This function is reference counted and can safely be called multiple times as long as there
 * are corresponding calls to {@link EntityCollection#resumeEvents}.
 * @throws {DeveloperError} resumeEvents can not be called before suspendEvents.
 */
EntityCollection.prototype.resumeEvents = function () {
  //>>includeStart('debug', pragmas.debug);
  if (this._suspendCount === 0) {
    throw new DeveloperError(
      "resumeEvents can not be called before suspendEvents."
    );
  }
  //>>includeEnd('debug');

  this._suspendCount--;
  fireChangedEvent(this);
};

/**
 * The signature of the event generated by {@link EntityCollection#collectionChanged}.
 * @callback EntityCollection.CollectionChangedEventCallback
 * @param {EntityCollection} collection The collection that triggered the event.
 * @param {Entity[]} added The array of {@link Entity} instances that have been added to the collection.
 * @param {Entity[]} removed The array of {@link Entity} instances that have been removed from the collection.
 * @param {Entity[]} changed The array of {@link Entity} instances that have been modified.
 */

Object.defineProperties(EntityCollection.prototype, {
  /**
   * Gets the event that is fired when entities are added or removed from the collection.
   * The generated event is a {@link EntityCollection.CollectionChangedEventCallback}.
   * @memberof EntityCollection.prototype
   * @readonly
   * @type {Event<EntityCollection.CollectionChangedEventCallback>}
   */
  collectionChanged: {
    get: function () {
      return this._collectionChanged;
    },
  },
  /**
   * Gets a globally unique identifier for this collection.
   * @memberof EntityCollection.prototype
   * @readonly
   * @type {string}
   */
  id: {
    get: function () {
      return this._id;
    },
  },
  /**
   * Gets the array of Entity instances in the collection.
   * This array should not be modified directly.
   * @memberof EntityCollection.prototype
   * @readonly
   * @type {Entity[]}
   */
  values: {
    get: function () {
      return this._entities.values;
    },
  },
  /**
   * Gets whether or not this entity collection should be
   * displayed.  When true, each entity is only displayed if
   * its own show property is also true.
   * @memberof EntityCollection.prototype
   * @type {boolean}
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      if (value === this._show) {
        return;
      }

      //Since entity.isShowing includes the EntityCollection.show state
      //in its calculation, we need to loop over the entities array
      //twice, once to get the old showing value and a second time
      //to raise the changed event.
      this.suspendEvents();

      let i;
      const oldShows = [];
      const entities = this._entities.values;
      const entitiesLength = entities.length;

      for (i = 0; i < entitiesLength; i++) {
        oldShows.push(entities[i].isShowing);
      }

      this._show = value;

      for (i = 0; i < entitiesLength; i++) {
        const oldShow = oldShows[i];
        const entity = entities[i];
        if (oldShow !== entity.isShowing) {
          entity.definitionChanged.raiseEvent(
            entity,
            "isShowing",
            entity.isShowing,
            oldShow
          );
        }
      }

      this.resumeEvents();
    },
  },
  /**
   * Gets the owner of this entity collection, ie. the data source or composite entity collection which created it.
   * @memberof EntityCollection.prototype
   * @readonly
   * @type {DataSource|CompositeEntityCollection}
   */
  owner: {
    get: function () {
      return this._owner;
    },
  },
});

/**
 * Computes the maximum availability of the entities in the collection.
 * If the collection contains a mix of infinitely available data and non-infinite data,
 * it will return the interval pertaining to the non-infinite data only.  If all
 * data is infinite, an infinite interval will be returned.
 * @returns {TimeInterval} The availability of entities in the collection.
 */
EntityCollection.prototype.computeAvailability = function () {
  let startTime = Iso8601.MAXIMUM_VALUE;
  let stopTime = Iso8601.MINIMUM_VALUE;
  const entities = this._entities.values;
  for (let i = 0, len = entities.length; i < len; i++) {
    const entity = entities[i];
    const availability = entity.availability;
    if (defined(availability)) {
      const start = availability.start;
      const stop = availability.stop;
      if (
        JulianDate.lessThan(start, startTime) &&
        !start.equals(Iso8601.MINIMUM_VALUE)
      ) {
        startTime = start;
      }
      if (
        JulianDate.greaterThan(stop, stopTime) &&
        !stop.equals(Iso8601.MAXIMUM_VALUE)
      ) {
        stopTime = stop;
      }
    }
  }

  if (Iso8601.MAXIMUM_VALUE.equals(startTime)) {
    startTime = Iso8601.MINIMUM_VALUE;
  }
  if (Iso8601.MINIMUM_VALUE.equals(stopTime)) {
    stopTime = Iso8601.MAXIMUM_VALUE;
  }
  return new TimeInterval({
    start: startTime,
    stop: stopTime,
  });
};

/**
 * Add an entity to the collection.
 * @param {Entity | Entity.ConstructorOptions} entity The entity to be added.
 * @returns {Entity} The entity that was added.
 * @throws {DeveloperError} An entity with <entity.id> already exists in this collection.
 */
EntityCollection.prototype.add = function (entity) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required.");
  }
  //>>includeEnd('debug');

  if (!(entity instanceof Entity)) {
    entity = new Entity(entity);
  }

  const id = entity.id;
  const entities = this._entities;
  if (entities.contains(id)) {
    throw new DeveloperError(
      `An entity with id ${id} already exists in this collection.`
    );
  }

  entity.entityCollection = this;
  entities.set(id, entity);

  if (!this._removedEntities.remove(id)) {
    this._addedEntities.set(id, entity);
  }
  entity.definitionChanged.addEventListener(
    EntityCollection.prototype._onEntityDefinitionChanged,
    this
  );

  fireChangedEvent(this);
  return entity;
};

/**
 * Removes an entity from the collection.
 * @param {Entity} entity The entity to be removed.
 * @returns {boolean} true if the item was removed, false if it did not exist in the collection.
 */
EntityCollection.prototype.remove = function (entity) {
  if (!defined(entity)) {
    return false;
  }
  return this.removeById(entity.id);
};

/**
 * Returns true if the provided entity is in this collection, false otherwise.
 * @param {Entity} entity The entity.
 * @returns {boolean} true if the provided entity is in this collection, false otherwise.
 */
EntityCollection.prototype.contains = function (entity) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(entity)) {
    throw new DeveloperError("entity is required");
  }
  //>>includeEnd('debug');
  return this._entities.get(entity.id) === entity;
};

/**
 * Removes an entity with the provided id from the collection.
 * @param {string} id The id of the entity to remove.
 * @returns {boolean} true if the item was removed, false if no item with the provided id existed in the collection.
 */
EntityCollection.prototype.removeById = function (id) {
  if (!defined(id)) {
    return false;
  }

  const entities = this._entities;
  const entity = entities.get(id);
  if (!this._entities.remove(id)) {
    return false;
  }

  if (!this._addedEntities.remove(id)) {
    this._removedEntities.set(id, entity);
    this._changedEntities.remove(id);
  }
  this._entities.remove(id);
  entity.definitionChanged.removeEventListener(
    EntityCollection.prototype._onEntityDefinitionChanged,
    this
  );
  fireChangedEvent(this);

  return true;
};

/**
 * Removes all Entities from the collection.
 */
EntityCollection.prototype.removeAll = function () {
  //The event should only contain items added before events were suspended
  //and the contents of the collection.
  const entities = this._entities;
  const entitiesLength = entities.length;
  const array = entities.values;

  const addedEntities = this._addedEntities;
  const removed = this._removedEntities;

  for (let i = 0; i < entitiesLength; i++) {
    const existingItem = array[i];
    const existingItemId = existingItem.id;
    const addedItem = addedEntities.get(existingItemId);
    if (!defined(addedItem)) {
      existingItem.definitionChanged.removeEventListener(
        EntityCollection.prototype._onEntityDefinitionChanged,
        this
      );
      removed.set(existingItemId, existingItem);
    }
  }

  entities.removeAll();
  addedEntities.removeAll();
  this._changedEntities.removeAll();
  fireChangedEvent(this);
};

/**
 * Gets an entity with the specified id.
 * @param {string} id The id of the entity to retrieve.
 * @returns {Entity|undefined} The entity with the provided id or undefined if the id did not exist in the collection.
 */
EntityCollection.prototype.getById = function (id) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  //>>includeEnd('debug');

  return this._entities.get(id);
};

/**
 * Gets an entity with the specified id or creates it and adds it to the collection if it does not exist.
 * @param {string} id The id of the entity to retrieve or create.
 * @returns {Entity} The new or existing object.
 */
EntityCollection.prototype.getOrCreateEntity = function (id) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  //>>includeEnd('debug');

  let entity = this._entities.get(id);
  if (!defined(entity)) {
    entityOptionsScratch.id = id;
    entity = new Entity(entityOptionsScratch);
    this.add(entity);
  }
  return entity;
};

EntityCollection.prototype._onEntityDefinitionChanged = function (entity) {
  const id = entity.id;
  if (!this._addedEntities.contains(id)) {
    this._changedEntities.set(id, entity);
  }
  fireChangedEvent(this);
};
export default EntityCollection;
