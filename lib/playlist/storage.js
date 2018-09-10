const fs = require('fs-extra');
module.exports = function () {
    let that = this;
    this.label = 'PLAYLIST STORAGE';
    this.path = '';

    this.init = function () {
    };

    this.fetch = function (folder, recursive) {
        const data = STATION.storage.readDir(folder, recursive, ['mp3']);
        LOG('STORAGE FETCHED AUDIO SOURCES', data.length, 'FILES  IN', folder, 'RECURSIVE', recursive);
        return data;
    };

    return {
        fetch: that.fetch
    };
};


