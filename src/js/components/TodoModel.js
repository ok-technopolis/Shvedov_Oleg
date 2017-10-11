import extendConstructor from '../util/extendConstructor';
import Eventable from '../util/Eventable';

/**
 * @param {Object} data
 * @constructor
 */
export default class TodoModel {
  constructor(data) {
    this._initEventable();

    this._model = {
      id: data.id,
      isReady: data.isReady || false,
      text: data.text
    };
  }

  /**
   * @param {String} field
   * @param {*} value
   * @fires TodoModel#modelFieldChange
   * @returns {TodoModel}
   */
  set(field, value) {
    this._model[field] = value;
    /** @event TodoModel~modelFieldChange */
    this.trigger('modelFieldChange', { field: field, value: value });

    return this;
  }

  /** TODO: FOR NETWORK INTERACTION USING **/
  /**
   * @param {String} field
   * @param {*} value
   * @fires TodoModel#modelFieldChange
   * @returns {TodoModel}
   */
  /*
  async asyncSet(field, value) {
    this._model[field] = value;
    await this.asyncTrigger('modelFieldChange', { field: field, value: value });

    return this;
  }
  */
  /** ---------------------------- **/

  /**
   * @param {String} field
   * @returns {*}
   */
  get(field) {
    return this._model[field];
  }

  /**
   * @param {String} field
   * @param {Function} handler
   * @param {Object} [ctx]
   * @returns {TodoModel}
   */
  onChange(field, handler, ctx) {
    this.on('modelFieldChange', data => {
      if (data.field === field) {
        handler.call(ctx, data);
      }
    }, this);

    return this;
  }

  /**
   * @param {Function} handler
   * @param {Object} [ctx]
   * @returns {TodoModel}
   */
  onAnyChange(handler, ctx) {
    //this.on('modelFieldChange', async data => { // TODO: async for network interaction using
    this.on('modelFieldChange', data => {
      //await handler.call(ctx, data); // TODO: await for network interaction using
      handler.call(ctx, data);
      this.trigger('modelChange', this);
    }, this);

    return this;
  }
}

extendConstructor(TodoModel, Eventable);
