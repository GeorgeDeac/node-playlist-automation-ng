const Event = require('events');
const merge = require('deepmerge');
const fs = require('fs-extra');
const Show = require('./show');
const Storage = require('./storage');

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.shows;

    this.label = 'SHOWS';
    this.event = new Event();
    this.storage = null;
    this.options = defaults;
    this.data = [];
    this.ready = false;
    this.json_path = null;

    /**
     *
     */
    this.init = function () {
        LOG(that.label, 'INIT');
        that.mergeOptions();
        that.storage = new Storage(that.json_path);

        that.buildNew();
        that.on('ready', function () {
            that.ready = true;
            LOG(that.label, '>>>> READY');
        });
    };

    /**
     *
     */
    this.mergeOptions = function () {
        that.json_path = P(CONFIG.station.path.shows);
    };

    /**
     *
     */
    this.buildNew = function () {
        let shows = that.loadShows();
        let options_from;

        const walk = function (i) {
            if (i === that.options.length) {
                that.emit('ready');
                return;
            }
            LOG(that.label, 'BUILDING', (i+1), 'OF', that.options.length);
            let options = merge(CONFIG.show, options_from[i]);
            options.json_path = that.json_path;

            let show = new Show({
                options: options
            });
            if (i < that.options.length) {
                show.on('ready', function () {
                    walk(i + 1);
                });
            }
            that.data.push(show);
        };

        if (shows) {
            options_from = shows;
        } else {
            options_from = that.options
        }
        walk(0);


        /*
                let shows = that.loadShows();
                if (shows) {
                    let i = 0;
                    shows.forEach(function (show) {
                        that.data.push(new Show({
                            options: show
                        }));
                    });
                    walk();
                }

                // if non was loaded
                if (that.data.length === 0) {
                    let show = new Show({
                        options: {
                            json_path: that.json_path
                        }
                    });

                    show.on('ready', function () {

                    });
                    that.data.push(show);
                }
        */
        /*        setTimeout(function () {
                    that.emit('ready', that);
                }, 500);
        */
    };

    /**
     *
     * @returns {Array}
     */
    this.loadShows = function () {
        LOG(that.label, 'LOADING ...');
        const stored_shows = that.storage.fetchAll();
        let data = [];
        stored_shows.forEach(function (i) {
            const show_data = fs.readJsonSync(i.file_path);
            data.push(show_data);
        });

        if (data.length > 0) {
            return data;
        } else {
            LOG(that.label, 'NOT FOUND');
        }
    };

    /**
     *
     */
    this.getOptions = function () {
        return that.options;
    };

    /**
     *
     * @returns {Array|*}
     */
    this.getData = function () {
        return that.data;
    };

    /**
     *
     * @param key
     * @param match
     * @returns {T}
     */
    this.get = function (key, match) {
        if (typeof key === 'string') {
            return that.data.filter(function (show) {
                if (show[key] === match) {
                    return show;
                }
            })[0];
        }
        if (typeof key === 'number') {
            return that.data[key];
        }
    };


    this.isReady = function () {
        return that.ready;
    };
    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return {
        ready: that.isReady(),
        on: that.on,
        emit: that.emit,
        options: that.getOptions(),
        data: that.getData(),
        get: that.get,
        channel: that.channel
    }
};
