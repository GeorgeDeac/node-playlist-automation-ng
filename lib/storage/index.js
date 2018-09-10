const merge = require('deepmerge');
const fs = require('fs-extra');
const path = require('path');
const Event = require('events');

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.storage;

    this.name = 'STORAGE';
    this.event = new Event();
    this.options = defaults;
    this.path = P(`${APP_DIR}/${CONFIG.station.path.storage}`);

    this.init = function () {
        LOG(that.name, 'INIT');

        that.mergeOptions();

        that.on('ready', function () {
            LOG(that.name, '>>> READY');
        });
        that.on('flushed', function () {
            LOG(that.name, 'FLUSHED');
        });

        if (that.options.flush_on_app_start === true) {
            that.flush();
        }

        if (!fs.existsSync(that.path)) {
            fs.mkdirSync(that.path);
        }

        setTimeout(function () {
            that.emit('ready');
        }, that.options.ready_delay);

    };
    this.mergeOptions = function () {
        if (!args)
            return;

        if (!args.options)
            return;

        if (typeof args.options !== 'object')
            return;

        that.options = merge(defaults, args.options);
    };

    this.fetchChannels = function () {
        var folder = P('channels');
        var data = that.readDir(folder, false, ['json']);
        LOG(that.name, 'FETCHED', data.length, 'CHANNELS');
        return data;
    };

    this.flush = function () {
        LOG(that.name, 'FLUSHING', that.path);
        fs.removeSync(that.path);
        that.emit('flushed', that.path);
    };

    this.readDir = function (folder, recursive, includes, excludes) {
        var data = [];
        var walk = function (folder, recursive) {
            if (fs.existsSync(folder)) {
                var dir = fs.readdirSync(folder + '');

                dir.forEach(function (i) {
                    var insert = folder + '/' + i;
                    if (fs.existsSync(insert)) {
                        try {
                            var xstat = fs.statSync(insert);
                            if (!xstat.isDirectory()) {
                                var filename = path.basename(insert).replace(path.extname(insert), '');
                                var extension = path.extname(insert).replace('.', '');
                                if (includes.includes(extension)) {
                                    data.push({
                                        id: filename,
                                        file_path: insert,
                                        filename: filename,
                                        extension: extension,
                                        size: xstat.size,
                                        atime: 'at' + xstat.atime.getTime(),
                                        mtime: 'mt' + xstat.mtime.getTime(),
                                        ctime: 'ct' + xstat.ctime.getTime()
                                    });
                                }
                            } else {
                                if (recursive === true) {
                                    walk(folder + '/' + i, recursive);
                                }
                            }
                        } catch (err) {
                            LOG(that.name, 'NOT READABLE', insert, err);
                            walk(folder + '/' + i, recursive);
                        }
                    } else {
                        LOG(that.name, 'NOT EXISTS', insert);
                        walk(folder + '/' + i, recursive);
                    }
                });
            } else {
                LOG(that.name, 'NOT EXISTS ', folder);
            }
        };
        walk(folder, recursive);
        return data;
    };

    this.fetchAudioFiles = function (folder, recursive) {
        var data = that.readDir(folder, recursive, ['mp3']);
        LOG(that.name, 'FETCHED AUDIO SOURCES', data.length, 'FILES  IN', folder, 'RECURSIVE', recursive);
        return data;
    };

    this.fetchShows = function (folder) {
        var data = that.readDir(folder, false, ['json']);
        LOG(that.name, 'FETCHED', data.length, 'SHOWS');
        return data;
    };
    this.fetchInputs = function (folder) {
        var data = that.readDir(folder, false, ['json']);
        LOG(that.name, 'FETCHED', data.length, 'INPUTS');
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
        readDir: that.readDir,

        fetchChannels: that.fetchChannels,
        fetchAudioFiles: that.fetchAudioFiles,
        fetchShows: that.fetchShows,
        fetchInputs: that.fetchInputs,
        flush: that.flush
    }
};
