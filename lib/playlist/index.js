const Event = require('events');
const merge = require('deepmerge');
const fs = require('fs-extra');
const _ = require('lodash');
const Storage = require('./storage');

module.exports = function (args) {
    let that = this;
    const defaults = {};

    this.label = 'PLAYLIST';
    this.options = defaults;
    this.event = new Event();
    this.storage = new Storage();
    this.channel = false;
    this.show = false;
    this.music = false;
    this.intro = false;
    this.spot = false;
    this.playlist = false;
    this.data = false;

    this.init = function () {
        that.mergeOptions();
        LOG(that.label, 'INIT FOR SHOW:', that.show.id, that.show.name);

        that.storage = new Storage();

        that.on('saved-playlist', function () {
            LOG(that.label, 'SAVED', that.data.length, 'ENTRIES FOR SHOW:', that.show.name, 'ON CHANNEL:', that.show.channel.name);
        });
        that.generate();
        that.emit('ready', that);
    };

    this.mergeOptions = function () {
        if (args) {
            if (args.options)
                if (typeof args.options === 'object')
                    that.options = merge(defaults, args.options);

            if (args.show)
                that.show = args.show;
        }

        that.options.playlist_path = P(`${that.show.channel.mpd.getOptions().config.playlist_directory}/${that.show.id}.m3u`);
    };

    this.getFiles = function () {
        var sopt = that.show.options;
        that.music = that.storage.fetch(sopt.music.path, sopt.music.recursive);
        that.podcast = that.storage.fetch(sopt.podcast.path, sopt.podcast.recursive);
        that.intro = that.storage.fetch(sopt.intro.path, sopt.intro.recursive);
        that.spot = that.storage.fetch(sopt.spot.path, sopt.spot.recursive);
    };

    this.build = function () {
        LOG(that.label, 'BUILDING', that.show.id);
        that.getFiles();
        that.addMusic();
        that.addHotRotation();
        that.addPodcast();
        that.addSpot();
        that.addIntro();
        that.buildM3U();
        LOG(that.label, 'BUILD:', '\n\n\r', that.playlist, '\n');
        LOG(that.label, 'COMPLETE');
    };

    this.buildM3U = function () {
        that.playlist = '';
        if(that.data.length === 0){
            LOG(that.label, 'NO AUDIO FILES GIVEN');
            return;
        }
        that.playlist = '';
        that.data.forEach(function (i) {
            if(i)
                if (i.file_path)
                    that.playlist += i.file_path + '\n';
        });
    };

    this.generate = function () {
        LOG(that.label, 'GENERATING', that.show.id);
        that.build();
        that.save();
    };

    this.save = function () {
        LOG(that.label, 'SAVING', that.options.playlist_path);
        fs.writeFileSync(that.options.playlist_path, that.playlist);
        that.emit('saved-playlist', that.playlist);
    };

    this.insertNth = function (add, nth, offset) {
        var build = [];
        if (!offset)
            offset = 0;

        var i = 0, c = 0;
        that.data.forEach(function (d) {
            if ((c === nth - 1 || i === offset - 1) && i >= offset - 1) {
                var insert = add[_.random(add.length - 1)];
                build.push(insert);
                c = 0;
            }
            c++;
            build.push(d);
            i++;
        });
        that.data = build;
    };

    this.addMusic = function () {
        var opts = that.show.options.music;
        if (opts.enable !== true)
            return;

        that.music = that.order(that.music, opts.order_by, opts.order_direction);
        that.data = that.music;
    };

    this.addHotRotation = function () {
        var opts = that.show.options.hot_rotation;
        if (opts.enable !== true)
            return;

        var data = [];
        var source = that.order(that.music, opts.order_by, opts.order_direction);

        if (opts.latest_tracks > 0) {
            source = source.slice(0, opts.latest_tracks);
        }

        if (opts.age_days > 0) {
            var edge = parseInt((Date.now() / 1000) - parseInt(opts.age_days * 24 * 60 * 60));
            var days = source.filter(function (i) {
                var timestamp = parseInt(i.mtime.replace('mt', '') / 1000);
                if (timestamp < edge) {
                    return i;
                }
            });
            source = days;
        }

        for (var i = 0; i < opts.multiplier; i++) {
            data = data.concat(source);
        }
        that.data = that.data.concat(data);
        that.data = _.shuffle(that.data);
    };

    this.addPodcast = function () {
        var opts = that.show.options.podcast;
        if (opts.enable !== true)
            return;
    };

    this.addSpot = function () {
        var opts = that.show.options.spot;
        if (opts.enable !== true)
            return;

        that.insertNth(that.spot, opts.nth, opts.offset);
    };

    this.addIntro = function () {
        var opts = that.show.options.spot;
        if (opts.enable !== true)
            return;

        var rand = _.random(that.intro.length - 1);
        var insert = that.intro[rand];
        var build = [insert].concat(that.data);
        that.data = build;
    };

    this.order = function (arr, order_by, order_direction) {
        var data;
        if (order_by === 'shuffle') {
            data = _.shuffle(arr);
        }
        if (order_by === 'time') {
            data = _.sortBy(arr, 'mtime');
        }
        if (order_by === 'name') {
            data = _.sortBy(arr, 'filename');
        }
        if (order_direction === 'asc') {
            data.reverse();
        }
        return data;
    };


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
        order: that.order,
        build: that.build,
        generate: that.generate
    };
};
