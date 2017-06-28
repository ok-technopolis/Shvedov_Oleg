let extendConstructor = require('../util/extendConstructor');
let Eventable         = require('../util/Eventable');
let TodoItem          = require('./TodoItem');
let appViewState      = require('../views/AppViewState');

/**
 * @extends {Eventable}
 * @param {HTMLElement} root
 * @constructor
 */
function TodosList(root) {
  this._initEventable();

  this._root = root;
  /**
   * @type {Array.<TodoItem>}
   * @private
   *
   */
  this._items = [];
  this._left = 0;

  appViewState.onChange(function (data) {
    this.filterShowedItems(data['filter']);
  }, this);
}

extendConstructor(TodosList, Eventable);

/**
 * @returns {Number}
 */
TodosList.prototype.getTodosCount = function () {
  return this._items.length;
};

/**
 * @param {TodoModel} model
 * @returns {TodosList}
 */
TodosList.prototype.addTodo = function (model) {
  let item = new TodoItem(model);
  this._items.push(item);

  item
    .on('todoChange', this._onTodoChange, this)
    .render(this._root);

  this.filterShowedItems();
  return this;
};

/**
 * @returns {TodosList}
 */
TodosList.prototype.clearCompleted = function () {
  for (let i = this._items.length; i--;) {
    if (this._items[i]._model.get('isReady')) {
      this._items[i].remove();
    }
  }
  return this;
};

/**
 * @param {Number} id
 * @returns {TodoItem}
 * @private
 */
TodosList.prototype._getItemById = function (id) {
  for (let i = this._items.length; i--;) {
    if (this._items[i]._model.get('id') === id) {
      return this._items[i];
    }
  }
  return null;
};

/**
 * @callback addTodo
 * @private
 * @returns {TodosList}
 */
TodosList.prototype._onTodoChange = function () {
  this.filterShowedItems(appViewState.getFilter());
  return this;
};

/**
 * @param {TodoModel} model
 * @returns {TodosList}
 */
TodosList.prototype.remove = function (model) {
  let item = this._getItemById(model.get('id'));
  if (item) {
    item.off('todoChange', this._onTodoChange, this);
    item.remove();
    let itemIndex = this._items.indexOf(item);
    this._items.splice(itemIndex, 1);
  }

  return this;
};

/**
 * @returns {TodosList}
 */
TodosList.prototype.selectAll = function () {
  this._items.forEach(function (item) {
    item.changeReady(true);
  });
  return this;
};

/**
 * @param {String} filter
 * @returns {TodosList}
 */
TodosList.prototype.filterShowedItems = function(filter) {
  if (!filter) {
    filter = appViewState.getFilter();
  }

  this._items.forEach(function (item) {
    switch (filter) {
      case 'all':
        item.visible(true);
        break;
      case 'completed':
        item.visible(item._model.get('isReady'));
        break;
      case 'active':
        item.visible(!item._model.get('isReady'));
        break;
    }
  });
  return this;
};

/**
 * @returns {HTMLElement|*}
 */
TodosList.prototype.getRoot = function () {
  return this._root;
};

module.exports = TodosList;
