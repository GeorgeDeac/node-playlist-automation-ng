const Event = require('events');
const dateFormat = require('dateformat');
/**
 * the logger
 *
 * @param args
 * @returns {module.log|*}
 */
module.exports = function (args) {

    let that = this;
    let defaults = {};

    this.event = new Event();
    this.options = defaults;

    if (args) {
        if (args.options) {
            if (typeof args.options === 'object') {
                this.options = Object.assign({}, defaults, args.options);
            }
        }
    }

    this.init = function () {
    };

    this.log = function () {
        if (DEBUG === false) {
            return false;
        }
        let output = [
            '[',
            dateFormat(new Date(), "H:MM:ss - d.m.yyyy"),
            ']'
        ].concat(Array.from(arguments));
        console.log.apply(console, output);
    };

    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };

    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return that.log;

};