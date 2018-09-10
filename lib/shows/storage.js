const fs = require('fs-extra');
module.exports = function (path) {
    let that = this;
    this.label = 'SHOW STORAGE';
    that.path = path;

    this.fetchAll = function () {
        var data = STATION.storage.readDir(that.path, false, ['json']);
        LOG(that.label, 'ALL FETCHED', data.length, 'FROM', that.path);
        return data;
    };

    this.add = function (file, data) {
        fs.writeJsonSync(file, data);
    };

    this.checkFolder = function () {
        LOG(that.label, 'CHECK FOLDER', that.path);
        fs.mkdirsSync(that.path);
    };

    that.checkFolder();

    return {
        checkFolder: that.checkFolder,
        fetchAll : that.fetchAll,
        add: that.add

    };
};


