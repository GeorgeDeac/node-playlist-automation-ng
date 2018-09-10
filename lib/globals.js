const path = require('path');
const Event = require('events');
const Log = require('./log.js');
const Config = require('./config.js');

/**
 * Defining some global things here:
 *
 */
global.EVENT = new Event();
global.DEBUG = process.env.NODE_DEBUG || false;
if(DEBUG === 'true') global.DEBUG = true;
if(DEBUG === 'false') global.DEBUG = false;

global.ENV = process.env.NODE_ENV || 'production';
global.APP_DIR = path.resolve(process.env.PWD);

global.P = function(dir){
    if(dir.substring(0, 1) === '/'){
        return path.resolve(dir);
    } else {
        if (CONFIG.station.path.storage.substring(0, 1) === '/') {
            return path.resolve(`${CONFIG.station.path.storage}/${dir}`);
        } else {
            return path.resolve(`${APP_DIR}/${CONFIG.station.path.storage}/${dir}`);
        }
    }
};

global.LOG = new Log();
global.CONFIG = new Config();

