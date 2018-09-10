const fs = require("fs");
/**
 * Autoloads from config folder by environment NODE_ENV
 *
 */
module.exports = function () {
    let that = this;

    this.name = 'CONFIG';
    this.path = null;
    this.excludes = ['name', 'path', 'set', 'load'];

    this.set = function(){
        that.path = `${APP_DIR}/config/${ENV}`;
        LOG(that.name, 'USING', ENV, 'IN', that.path);
    };

    this.load = function(){
        fs.readdirSync(that.path).forEach(function (file) {
            LOG(that.name, 'READING FILE:', file);
            let key = file.replace(/\.js/,'');
            if(that.excludes.includes(key)){
                return false;
            }
            let req = require(`${that.path}/${file}`);
            that[key] = req;
        });
        const count = Object.keys(that).length - that.excludes.length;
        if(count === 0){
            LOG(that.name, 'NO FILE FOUND');
        } else {
            LOG(that.name, count, 'FILES LOADED');
        }
        LOG(that.name, '>>> READY');
    };

    that.set();
    that.load();

    return that;
};