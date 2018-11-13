const Event = require('events');
const merge = require('deepmerge');
const fs = require('fs-extra');
const spawn = require('child_process').spawn;

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.mpd;

    this.label = 'MPD';
    this.event = new Event();
    this.options = {};
    this.id = null;
    this.name = null;
    this.ready = false;
    this._respawn = false;
    this.db_exists = false;

    this.readyStates = {
        connecting: false,
        established: false,
        updated: false
    };

    /**
     *
     */
    this.init = function () {
        that.mergeOptions();
        LOG(that.label, that.name, 'DAEMON INIT', that.name, 'ON', that.options.config.bind_to_address + ':' + that.options.config.port);

        that.checkFolder();
        that.checkDB();

        that.on('ready', function (mpd, chunk) {
            that.ready = true;
            LOG(that.label, mpd.name, '>>> READY WITH CONFIG', that.options.conf_file);
        });

        that.on('failed', function (mpd, chunk) {
            if (that.ready !== true) {
                LOG(that.label, that.name, 'CONNECTION TIMEOUT');
                that.emit('ready', that);
            }
        });

        that.on('address', function (mpd, chunk) {
            if (that.ready !== true) {
                LOG(that.label, that.name, 'ADDRESS IN USE');
                that.emit('ready', that);
            }
        });

        that.on('no-soundcard', function (mpd) {
            LOG(that.label, that.name, 'NO SOUNDCARD FOUND');
        });

        that.on('updated', function (mpd, chunk) {
            LOG(that.label, that.name, 'DB UPDATED');
            that.readyStates.updated = true;
            that.checkReady();
        });

        that.on('updating', function (mpd, chunk) {
            LOG(that.label, that.name, 'STARTING DB UPDATE');
            //that.readyStates.updated = true;
            //that.checkReady();
        });

        that.on('established', function (mpd) {
            LOG(that.label, that.name, 'ESTABLISHED');
            that.readyStates.established = true;
            that.checkReady();
        });

        that.on('connecting', function () {
            LOG(that.label, that.name, 'CONNECTING');
            that.readyStates.connecting = true;
            that.checkReady();
        });

        that.on('added', function (mpd, chunk) {
            //LOG(that.label, that.name, 'ADDED', chunk.replace(/\n/gi, '').replace(/update: added /,''));
            process.stdout.write(`\r${that.label} ${that.name} ADDED ${chunk.replace(/\n/gi, '').replace(/update: added /, '')}`);
        });

        that.on('shutdown', function (mpd) {
            LOG(that.label, that.name, 'SHUTTING DOWN');
            if (that._respawn === true) {
                that.run('respawn');
            }
        });

        that.on('respawn', function (mpd) {
            // LOG(that.label, that.name,'MPD RESPAWN', mpd.name);
            that._respawn = false;
        });

        that.on('data', function (chunk) {
            if (that.options.debug.stderr === true) {
                LOG(that.label, that.name, 'OUT', chunk.replace(/\n/gi, ''));
            }
        });

        if (that.options.autostart === true) {
            that.on('saved-config', function () {
                LOG(that.label, that.name, 'SAVED CONFIG', 'AUTOSTART', that.options.conf_file);
                that.run();
            });
        }

        if (that.options.autostart === false) {
            that.on('saved-config', function () {
                LOG(that.label, that.name, 'SAVED CONFIG', that.options.conf_file);
                setTimeout(function () {
                    that.emit('ready', that);
                }, that.options.ready_delay);
            });
        }
        that.saveConfig();
    };

    /**
     *
     */
    this.mergeOptions = function () {
        that.options = merge(defaults, args.options);
        that.id = that.options.id;
        that.name = args.options.name;
        that.slug = args.options.slug;

        that.options.config.playlist_directory = P(`channels/${that.id}`);
        that.options.config.music_directory = P(`${CONFIG.station.path.audio}/${that.options.path.music}`);

        let files = {
            db: 'cache',
            pid: 'pid',
            log: 'log'
        };
        Object.keys(files).forEach(function (i) {
            that.options.config[i + '_file'] = P(`${that.options.path[i]}/${that.id}.${files[i]}`);
        });
        if(that.options.db_filename){
            that.options.config.db_file = P(`${that.options.path.db}/${that.options.db_filename}.cache`);
        }


        that.options.config.audio_output.name = that.name;
        that.options.config.zeroconf_name = that.id;
        that.options.conf_file = P(`${that.options.path.config}/${that.id}.conf`);
        that.options.json_file = P(`channels/${that.id}.json`);
    };

    /**
     *
     */
    this.saveConfig = function () {
        let conf = '';
        Object.keys(that.options.config).forEach(function (i) {
            if (typeof that.options.config[i] === 'string' || typeof that.options.config[i] === 'number') {
                conf += i + ' "' + that.options.config[i] + '"\n';
            }
            if (typeof that.options.config[i] === 'object') {
                conf += i + ' {\n';
                Object.keys(that.options.config[i]).forEach(function (ii) {
                    conf += '   ' + ii + ' "' + that.options.config[i][ii] + '"\n';
                });
                conf += '}\n';
            }
        });

        if (CONFIG.station.bluetooth == true) {
            that.options.bluetooth.audio_output.name = 'audio_' + that.id;
            Object.keys(that.options.bluetooth).forEach(function (i) {
                if (typeof that.options.bluetooth[i] === 'object') {
                    conf += i + ' {\n';
                    Object.keys(that.options.bluetooth[i]).forEach(function (ii) {
                        conf += '   ' + ii + ' "' + that.options.bluetooth[i][ii] + '"\n';
                    });
                    conf += '}\n';
                }
            });
        }

        fs.writeFileSync(that.options.conf_file, conf);
        that.emit('saved-config', that);
    };

    /**
     *
     */
    this.checkFolder = function () {
        LOG(that.label, 'CHECK FOLDERS');
        Object.keys(that.options.path).forEach(function (p) {
            let f = P(that.options.path[p]);
            LOG(that.label, 'CREATING FOLDER', f);
            fs.mkdirsSync(f);
        });
        fs.mkdirsSync(P('channels'));
    };

    this.checkDB = function () {
        const db_path = P(`${that.options.config.db_file}`);
        that.db_exists = fs.existsSync(db_path);
        LOG(that.label, 'CHECKING IF DB EXISTS', db_path, that.db_exists);
    };

    /**
     *
     * @param complete_event
     */
    this.run = function (complete_event) {
        const options = [that.options.conf_file, '--no-daemon', '--verbose', /*'--stdout',*/ '--stderr'];
        LOG(that.label, that.name, 'STARTING WITH OPTIONS', JSON.stringify(options));

        const match = {
            updating: new RegExp(/update: starting/),
            updated: new RegExp(/update: finished/),

            collision: new RegExp(/Local name collision/),
            address: new RegExp(/Address already in use/),
            "no-soundcard": new RegExp(/cannot find card/),

            added: new RegExp(/update: added /),
            established: new RegExp(/successfully established/),
            connecting: new RegExp(/Client is CONNECTING/),
        };

        that.process = spawn(that.options.bin, options);
        that.process.stdout.setEncoding('utf8');
        that.process.stderr.setEncoding('utf8');
        that.process.stderr.on('data', function (chunk) {
            that.emit('data', chunk);
            Object.keys(match).forEach(function (key) {
                if (match[key].length === undefined) {
                    if (chunk.match(match[key])) {
                        that.emit(key, that, chunk);
                    }
                } else {
                    match[key].forEach(function (event) {
                        if (chunk.match(event)) {
                            that.emit(key, that, chunk);
                        }
                    });
                }
            });
        });
        that.process.stdout.on('data', function (chunk) {
            LOG(that.label, that.name, '>>>>>>', data);
        });
        that.process.stderr.on('end', function () {
            that.emit('shutdown', that);
        });
    };

    /**
     *
     * @returns {boolean}
     */
    this.checkReady = function () {
        LOG(that.label, 'CHECK READY', that.ready, that.readyStates, 'DB EXISTS:', that.db_exists);
        if (that.ready === true) {
            return false;
        }

        if (that.readyStates.connecting === true && that.db_exists === true) {
            that.emit('ready', that);
            return true;
        }

        if (that.readyStates.updated === true && that.db_exists === false) {
            that.emit('ready', that);
            return true;
        }

        if (that.readyStates.established === true) {
            if ((CONFIG.storage.flush_on_app_start === true && that.readyStates.updated === true) || CONFIG.storage.flush_on_app_start === false) {
                that.emit('ready', that);
            }
            if(that.db_exists){
                that.emit('ready', that);
            }
        }
    };

    this.isReady = function () {
        return that.ready;
    };

    /**
     *
     *
     */
    this.getOptions = function () {
        return that.options;
    };

    /**
     *
     *
     */
    this.shutdown = function () {
        const options = [that.options.conf_file, '--kill'];
        spawn(that.options.bin, options);
    };

    /**
     *
     *
     */
    this.respawn = function () {
        that._respawn = true;
        that.shutdown();
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
        ready: that.isReady(),
        on: that.on,
        emit: that.emit,
        saveConfig: that.saveConfig,
        getOptions: that.getOptions,
        options: that.getOptions(),
        shutdown: that.shutdown,
        respawn: that.respawn,
        spawn: that.run
    }
};