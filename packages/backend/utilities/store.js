const Store = require('electron-store');

const store = new Store();

exports.getData = async(name) => {
    return await store.get(name);
};


exports.setData = async(name, data) => {
    store.set(name, data);
};
