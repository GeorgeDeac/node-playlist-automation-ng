var Event = require('events');
var merge = require('deepmerge');
var fs = require('fs-extra');
var Channel = require('./channel');

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.channels;

    this.name = 'CHANNELS';
    this.event = new Event();
    this.options = defaults;
    this.channels = [];

    /**
     *
     *
     */
    this.init = function () {
        LOG(that.name, 'INIT');

        that.on('ready', function () {
            LOG(that.name, '>>> READY');
        });

        that.mergeOptions();
        that.buildNew();
    };

    /**
     *
     */
    this.mergeOptions = function () {
        if (CONFIG.station.load_channels === true) {
            that.loadOptions();
        } else {
            if (args) {
                if (args.options) {
                    if (typeof args.options === 'object') {
                        that.options = merge(defaults, args.options);
                    }
                }
            }
        }
    };

    /**
     *
     */
    this.loadOptions = function () {
        LOG(that.name, 'LOADING CHANNELS');
        var options = [];
        var stored_channels = STATION.storage.fetchChannels();
        stored_channels.forEach(function (i) {
            options.push(fs.readJsonSync(i.file_path));
        });
        if (stored_channels.length > 0) {
            that.options = options;
        } else {
            LOG(that.name, 'NO CHANNELS FOUND');
        }
    };

    /**
     *
     */
    this.buildNew = function () {
        var walk = function (i) {
            var options = that.options[i];
            if (options.mpd)
                options.mpd = merge(CONFIG.mpd, options.mpd);
            if (options.mpc)
                options.mpc = merge(CONFIG.mpc, options.mpc);

            setTimeout(function () {
                var add = new Channel({
                    channels: that,
                    options: options
                });
                add.on('ready', function () {
                    if (i < that.options.length - 1)
                        walk(i + 1);

                    if (i === that.options.length - 1) {
                        that.emit('ready');
                    }
                });
                that.channels.push(add);
            }, CONFIG.station.add_channel_delay);
        };
        walk(0);
    };

    /**
     *
     * @param key
     * @param match
     * @returns {T}
     */
    this.get = function (key, match) {
        if (typeof key === 'string') {
            return that.channels.filter(function (show) {
                if (show[key] === match) {
                    return show;
                }
            })[0];
        }
        if (typeof key === 'number') {
            return that.channels[key];
        }
    };

    /**
     *
     *
     */
    this.updatePlaylists = function () {
        that.channels.forEach(function (channel) {
            if (channel.options.autostart === true) {
                channel.updatePlaylist();
            }
        });
    };

    /**
     *
     * @returns {*}
     */
    this.getOptions = function () {
        return that.options;
    };

    /**
     *
     * @returns {Array}
     */
    this.getData = function () {
        return that.channels;
    };

    this.shutdown = function(){
        that.channels.forEach(function (channel) {
            channel.shutdown();
        });
    };

    /**
     *
     *
     */
    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return {
        on: that.on,
        emit: that.emit,
        checkReady: that.checkReady,
        options: that.getOptions(),
        data: that.getData(),
        updatePlaylists: that.updatePlaylists,
        get: that.get,
        mapInputs: that.mapInputs,
        shutdown: that.shutdown
    }
};
