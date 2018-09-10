const Event = require('events');
const slugify = require('slugify');
const merge = require('deepmerge');
const crypto = require('crypto');
const fs = require('fs-extra');

const MPD = require('./mpd');
const MPC = require('./mpc');

module.exports = function (args) {
    let that = this;
    const defaults = {};

    this.label = 'CHANNEL';
    this.options = defaults;
    this.event = new Event();

    this.id;
    this.mpd;
    this.mpc;
    this.ready = false;
    this.input;
    this.show;

    this.init = function () {
        that.mergeOptions();
        LOG(that.label, that.name, 'INIT', that.id);

        that.checkFolder();

        that.on('ready', function () {
            that.ready = true;
            if (that.options.autostart === true) {
                //that.updateDatabase();
                //that.updatePlaylist();
            }
            that.saveJsonConfig();
            //that.savePlaylist();
            //that.updatePlaylist();
            LOG(that.label, that.name, '>>> READY', that.id);
        });

        that.on('saved-json', function () {
            LOG(that.label, that.name, 'SAVED JSON', that.id);
        });
        that.on('saved-playlist', function () {
            LOG(that.label, that.name, 'PLAYLIST SAVED', that.id);
            //that.updatePlaylist();
        });
        that.on('update-db', function () {
            // that.updatePlaylist();
        });

        that.initMPD();
        that.input = that.mapInput(that.options.input_index);
    };

    this.initMPD = function () {
        that.mpd = new MPD({
            options: that.options.mpd,
            channel: that
        });
        that.mpd.on('ready', function (mpd) {
            if (that.options.show) {
                const key = Object.keys(that.options.show)[0];
                that.setShow(key, that.options.show[key]); // blocking
            }
            that.initMPC();
        });
        that.mpd.on('update', function () {
            that.emit('update-db');
        });
        that.mpd.on('respawn', function (mpd) {
            LOG(that.label, 'RESPAWN', mpd.options.name, 'WITH CONFIG', mpd.options.conf_file);
            that.saveJsonConfig();
        });
    };

    this.initMPC = function () {
        that.mpc = new MPC({
            options: that.options.mpc,
            channel: that
        });
        that.mpc.on('ready', function () {
            that.emit('ready');
        });
    };


    this.mergeOptions = function () {
        if (!args.options)
            return;

        if (typeof args.options !== 'object')
            return;

        that.options = merge(defaults, args.options);

        if (!that.options.slug)
            that.options.slug = slugify(that.options.name, {replacement: '_', lower: true});

        if (!that.options.id)
            that.options.id = crypto.createHash('md5').update(Date.now() + '').digest("hex");

        that.id = that.options.id;
        that.name = that.options.name;
        that.slug = that.options.slug;
        that.options.playlist = that.options.slug;
        that.options.json_file = P(`channels/${that.id}.json`);

        if (!that.options.mpd)
            that.options.mpd = {};

        that.options.mpd.id = that.options.id;
        that.options.mpd.name = that.options.name;
        that.options.mpd.slug = that.options.slug;
        that.options.mpd.autostart = that.options.autostart;

        if (!that.options.mpc)
            that.options.mpc = {};

        that.options.mpc.id = that.options.id;
        that.options.mpc.name = that.options.name;
        that.options.mpc.slug = that.options.slug;
        that.options.mpc.port = that.options.mpd.config.port;
        that.options.mpc.host = that.options.mpd.config.bind_to_address;
    };

    this.checkReady = function () {
        LOG(that.label, 'CHECK READY', that.mpd.ready, that.mpc.ready);
        setTimeout(function () {
            if (that.mpd.ready === true && that.mpc.ready === true) {
                that.emit('ready', that);
            }
        }, 100);
    };

    this.saveJsonConfig = function () {
        let save = that.options;
        save.mpd = merge(save.mpd, that.mpd.getOptions());
        save.mpc = merge(save.mpc, that.mpc.getOptions());
        fs.writeJsonSync(that.options.json_file, that.options);
        that.emit('saved-json', that);
    };

    this.checkFolder = function () {
        const mkd = P(`channels/${that.id}`);
        LOG(that.label, that.name, 'CHECK FOLDER', mkd);

        if (fs.existsSync(mkd)) {
            LOG(that.label, that.name, 'SKIPPING CREATE DIRECTORY', mkd);
        } else {
            LOG(that.label, that.name, 'CREATING DIRECTORY', mkd);
            fs.mkdirsSync(mkd);
        }
    };

    this.setShow = function (key, match) {
        that.show = STATION.shows.get(key, match);
        LOG(that.label, that.name, 'SELECTING SHOW', that.show.name);
        that.show.setChannel(that);
    };

    this.updateDatabase = function () {
        that.mpc.updateDatabase();
    };
    this.loadPlaylist = function (playlist) {
        that.mpc.loadPlaylist(playlist);
    };
    this.updatePlaylist = function (playlist) {
        LOG(that.label, 'CHANNEL UPDATE PLAYLISTS', that.name);
        that.mpc.updatePlaylist(playlist);
    };
    this.initPlaylist = function () {
        that.mpc.initPlaylist();
    };
    this.setCrossfade = function (seconds) {
        that.mpc.setCrossfade(seconds);
    };
    this.play = function () {
        that.mpc.play();
    };
    this.pause = function () {
        that.mpc.pause();
    };
    this.stop = function () {
        that.mpc.stop();
    };
    this.repeat = function () {
        that.mpc.repeat();
    };
    this.status = function () {
        that.mpc.status();
    };
    this.crop = function () {
        that.mpc.crop();
    };
    this.changePlaylist = function (playlist) {
        that.mpc.changePlaylist(playlist);
    };
    this.skip = function () {
        that.mpc.skip();
    };
    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    this.isReady = function () {
        return that.ready;
    };

    this.spawn = function () {
        that.mpd.spawn('respawn');
    };

    this.shutdown = function () {
        that.mpd.shutdown();
    };

    this.respawn = function () {
        that.mpd.respawn();
    };

    this.mapInput = function (input_index) {
        if (!input_index)
            input_index = that.options.input_index;

        if (global.inputs)
            that.input = global.station.inputs.get(input_index);
    };

    that.init();

    return {
        ready: that.isReady,
        name: that.name,
        slug: that.slug,
        on: that.on,
        emit: that.emit,
        updateDatabase: that.updateDatabase,
        loadPlaylist: that.loadPlaylist,
        updatePlaylist: that.updatePlaylist,
        initPlaylist: that.initPlaylist,
        setCrossfade: that.setCrossfade,
        play: that.play,
        pause: that.pause,
        stop: that.stop,
        skip: that.skip,
        repeat: that.repeat,
        options: that.options,
        shutdown: that.shutdown,
        respawn: that.respawn,
        spawn: that.spawn,
        id: that.id,
        mpd: that.mpd,
        mpc: that.mpc
    }
};