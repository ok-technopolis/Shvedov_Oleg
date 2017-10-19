import extendConstructor from '../util/extendConstructor';
import Eventable from'../util/Eventable';
import Storage from '../models/Storage';
import TodoModel from './TodoModel';

const uuidv4 = require('uuid/v4');
const StorageInstance = new Storage();
/**
 * @constructor
 */
export default class TodosListModel {
  constructor() {
    this._initEventable();

    /**
     * @type {Array.<TodoModel>}
     * @private
     */
    this._items_models = [];
    this._left = 0;
  }

  updateList() {
    StorageInstance.getEntriesList()
      .then(async data => {
        const entries = data;

        for (let i = 0, l = entries.length; i < l; i++) {
          this.add(entries[i], true);
        }

        // I really don't know how to properly initialize model of ready item: ready changing listeners doesn't active while model is under construction
        for (let i = 0, l = this._items_models.length; i < l; i++) {
          if (this._items_models[i].get('isReady')) {
            await this._items_models[i].asyncSet('isReady', false);
            await this._items_models[i].asyncSet('isReady', true);
          }
        }
      })
      .catch(() => {
        let data = [];
        let elem;

        for (let i = 0, l = this._items_models.length; i < l; i++) {
          elem = this._items_models[i];
          data.push({
            id: elem.get('id'),
            isReady: elem.get('isReady'),
            text: elem.get('text')
          });
        }

        StorageInstance.putEntriesList(data);
      });
  }

  /**
   * Returns list models.
   * @returns {Array.<TodoModel>}
   */
  getList() {
    return this._items_models;
  }

  /**
   * @returns {Number}
   */
  getLeftTodosCount() {
    return this._left;
  }

  /**
   *
   * @param {Function} handler
   * @param {Object} [ctx]
   * @returns {TodosListModel}
   */
  onChange(handler, ctx) {
    this
      .on('todoAdd', handler)
      .on('todoRemoved', handler)
      .on('todoChange', handler)
      .on('modelReadyChange', model => {
        switch (model.get('isReady')) {
          case true:
            if (this._left !== 0) {
              this._left -= 1;
            }
            break;
          case false:
            this._left += 1;
        }
        this.trigger('todoChange');
        handler.call(ctx);
      }, this)
      .on('modelRemove', model => {
        this.remove(model.get('id'));
        this.trigger('todoChange');
        handler.call(ctx);
      }, this)
      .on('modelChange', () => {
        this.trigger('todoChange');
        handler.call(ctx)
      }, this);

    return this;
  }

  /**
   *
   * @param {Object} inputData
   * @param {Boolean} fromStorage
   * @fires TodosListModel~todoAdd
   * @returns {TodosListModel}
   */
  add(inputData, fromStorage) {
    let model;

    if (inputData.id) {
      model = new TodoModel(inputData);
    } else {
      model = new TodoModel(Object.assign({ id: uuidv4() }, inputData));
    }

    model.onAnyChange(async data => {
      switch(data['field']) {
        case 'text':
          this.trigger('modelTextChange', model);
          break;
        case 'isReady':
          this.trigger('modelReadyChange', model);
          break;
        case 'deleted':
          this.trigger('modelRemove', model);
          break;
        default:
          this.trigger('modelChange', model);
          break;
      }
      await StorageInstance.changeListItem({
        id: model.get('id'),
        isReady: model.get('isReady'),
        text: model.get('text')
      });
    }, this);

    this._items_models.push(model);

    if (model.get('isReady') === false) {
      this._left += 1;
    }

    if (!fromStorage) {
      StorageInstance.addListItem({
        id: model.get('id'),
        isReady: model.get('isReady'),
        text: model.get('text')
      });
    }

    /** @event TodosListModel#todoAdd */
    this.trigger('todoAdd', model);
    return this;
  }

  /**
   * @param {Number} id
   * @returns {TodoModel|null}
   * @private
   */
  _getModelById(id) {
    for (let i = 0, l = this._items_models.length; i !== l; i++) {
      if (this._items_models[i].get('id') === id) {
        return this._items_models[i];
      }
    }
    return null;
  }

  /**
   * @fires TodosListModel#todoRemove
   * @fires TodosListModel#todoRemoved
   * @param {Number} id
   * @returns {TodosListModel}
   */
  async remove(id) {
    let model = this._getModelById(id);

    if (model) {
      if (!model.get('isReady')) {
        this._left -= 1;
      }

      /** @event TodosListModel~todoRemove */
      this.trigger('todoRemove', model);

      model.off('modelFieldChange', this);

      let modelIndex = this.getList().indexOf(model);
      this.getList().splice(modelIndex, 1);
      await StorageInstance.removeListItem(id);
      /** @event TodosListModel~todoRemoved */
      this.trigger('todoRemoved');
    }

    return this;
  }

  /**
   * @returns {TodosListModel}
   */
  async clearCompleted() {
    let copyModels = this.getList().slice();
    for (let i = 0, l = copyModels.length; i !== l; i++) {
      if (copyModels[i].get('isReady')) {
        await this.remove(copyModels[i].get('id'));
      }
    }
    return this;
  }

  /**
   * @returns {TodosListModel}
   */
  async selectAll() {
    const list = this.getList();
    for (let i = 0, l = list.length; i !== l; i++) {
      await list[i].asyncSet('isReady', true);
    }
    return this;
  }
}

extendConstructor(TodosListModel, Eventable);
