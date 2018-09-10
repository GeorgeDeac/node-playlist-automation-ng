const Event = require('events');
const merge = require('deepmerge');
const slugify = require('slugify');
const crypto = require('crypto');
const Storage = require('./storage');
const Playlist = require('../playlist');

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.show;

    this.label = 'SHOW';
    this.options = defaults;
    this.event = new Event();
    this.storage = null;
    this.id = null;
    this.name = null;
    this.ready = false;
    this.playlist = null;
    this.channel_id = null;

    this.init = function () {
        that.mergeOptions();
        LOG(that.label, 'INIT', that.id);

        that.on('ready', function () {
            LOG(that.label, '>>>> READY', that.name);
        });

        that.storage = new Storage(that.options.json_path);
        that.setup();

        setTimeout(function () {
            that.emit('ready', that);
        }, 100);

    };

    /**
     *
     */
    this.mergeOptions = function () {
        if (args) {
            if (args.options)
                if (typeof args.options === 'object')
                    that.options = merge(defaults, args.options);
        }

        if (!that.options.slug)
            that.options.slug = slugify(that.options.name, {replacement: '_', lower: true});

        if (!that.options.id)
            that.options.id = crypto.createHash('md5').update(`${Date.now()}`).digest("hex");


        Object.keys(that.options.path).forEach(function (p) {
            if (!that.options[p].path) {
                that.options[p].path = P(`${CONFIG.station.path.audio}/${that.options.path[p]}/${that.options[p].folder}`);
            }
        });

        that.id = that.options.id;
        that.name = that.options.name;
        that.slug = that.options.slug;
        that.options.json_file = P(`${that.options.json_path}/${that.id}.json`);
    };

    /**
     *
     */
    this.setup = function () {
        that.storage.add(that.options.json_file, that.options);
    };

    this.initPlaylist = function () {
        that.playlist = new Playlist({
            options: {},
            show: that
        });
        that.playlist.on('ready', function () {
            that.emit('ready', that);
        });
    };

    this.setChannel = function (channel) {
        that.channel = channel;
        LOG(that.label, that.name, 'SET TO CHANNEL', that.channel.name);
        that.initPlaylist();
    };


    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return {
        id: that.id,
        name: that.name,
        slug: that.slug,
        playlist: that.playlist,
        setChannel: that.setChannel,
        on: that.on,
        emit: that.emit
    }
};