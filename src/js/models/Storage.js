import local from './local';

export default class Storage {
  constructor() {
    window.addEventListener('online', () => this.checkStorage());
    //window.addEventListener('load', () => this.checkStorage());
  }

  checkStorage() {
    const offlineStorage = local.read('key');
    if (offlineStorage) {
      client.updateList(
        {
          time: offlineStorage.time,
          data: offlineStorage.data
        },
        response => {
          local.clear('key');
          return true;
        },
        err => false
      );
    }
    
    this.KEY = 'TODOS';
  }

  getEntriesList() {
    let list;

    return new Promise((resolve, reject) => {
      list = local.read(this.KEY);
      if (list) {
        resolve(list.data);
      }
      reject();
    });
  }

  putEntriesList(data) {
    const entry = {
      time: new Date().getTime(),
      data
    };

    return !!local.write(this.KEY, entry);
  }

  addListItem(item) {
    const now = new Date().getTime();
    let entry = local.read(this.KEY);

    if (!entry) {
      local.write(this.KEY, {
        time: now,
        data: []
      });
      entry = local.read(this.KEY);
    }

    entry.time = now;
    entry.data.push(item);

    return !!local.write(this.KEY, entry);
  }

  removeListItem(itemId) {
    const entry = local.read(this.KEY);

    if (entry) {
      for (let i = 0, l = entry.data.length; i < l; i++) {
        if (entry.data[i].id === itemId) {
          entry.data.splice(i, 1);
          break;
        }
      }

      if (local.write(this.KEY, entry)) {
        return true;
      }
    }
    return false;
  }

  changeListItem(item) {
    const entry = local.read(this.KEY);

    if (entry) {
      for (let i = 0, l = entry.data.length; i < l; i++) {
        if (entry.data[i].id === item.id) {
          entry.data[i] = item;
          break;
        }
      }

      if (local.write(this.KEY, entry)) {
        return true;
      }
    }
    return false;
  }
}
