const Event = require('events');
const merge = require('deepmerge');
const spawn = require('child_process').spawn;

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.mpc;

    this.label = 'MPC';
    this.event = new Event();
    this.options = defaults;
    this.host = null;
    this.port = null;
    this.channel = null;
    this.process = null;
    this.playlist = null;
    this.ready = false;
    this.next_delay = 0;

    this.init = function () {
        that.mergeOptions();
        LOG(that.label, that.name, 'INIT ON', that.host + ':' + that.port);

        that.on('ready', function () {
            LOG(that.label, that.name, '>>> READY');
            that.ready = true;
        });

        that.on('exit', function () {

        });
        that.on('data', function (chunk, mpc) {
            //LOG(that.label, that.name,'MPC GET MESSAGE', mpc.name, chunk);
        });

        setTimeout(function () {
            that.emit('ready', that);
        }, 200);

    };

    this.mergeOptions = function () {
        if (args) {
            if (args.options) {
                if (typeof args.options === 'object')
                    that.options = merge(defaults, args.options);

                ['id', 'name', 'host', 'port'].forEach(function (k) {
                    if (that.options[k])
                        that[k] = that.options[k];
                });
            }
            if(args.channel){
                that.channel = args.channel;
                that.playlist = that.channel.show.id;
            }
        }
        that.next_delay = that.options.delay;
    };

    this.updateDatabase = function () {
        that.query(['update', '--wait']);
    };

    this.setCrossfade = function (seconds) {
        that.query(['crossfade', seconds]);
    };

    this.play = function (number) {
        let options = ['play'];
        if (number) {
            options = ['play', number]
        }
        that.query(options);
    };

    this.repeat = function () {
        that.query(['repeat']);
    };

    this.pause = function () {
        that.query(['pause']);
    };
    this.stop = function () {
        that.query(['stop']);
    };

    this.loadPlaylist = function (playlist) {
        that.query(['load', playlist]);
    };

    this.status = function () {
        that.query(['-f', '"%title% - %artist% - %time% - %file%"']);
    };

    this.crop = function () {
        that.query(['crop']);
    };
    this.shuffle = function () {
        that.query(['shuffle']);
    };
    this.skip = function () {
        that.query(['next']);
    };

    this.updatePlaylist = function (playlist) {
        LOG(that.label, that.name, 'UPDATE PLAYLIST');
        if (!playlist)
            playlist = that.playlist;

        that.crop();
        that.loadPlaylist(playlist);
        that.setCrossfade(8);
        //that.shuffle();
        that.play(2);
        that.repeat();
        that.status();
    };

    this.initPlaylist = function () {
        that.loadPlaylist(that.playlist);
        that.setCrossfade(8);
        that.repeat();
        that.play(1);
    };

    this.query = function (query) {
        setTimeout(function () {
            const options = ['-p', that.port, '-h', that.host].concat(query);
            LOG(that.label, that.name, 'QUERYING', options.join(' '));

            that.process = spawn(that.options.bin, options);
            that.process.stdout.setEncoding('utf8');
            that.process.stderr.setEncoding('utf8');

            that.process.stderr.on('data', function (chunk) {
                that.emit('data', chunk, that);
            });

            that.process.stdout.on('data', function (chunk) {
                that.emit('data', chunk, that);
            });

            that.process.stderr.on('end', function () {
                that.emit('exit', that);
            });

            that.next_delay = that.next_delay - that.options.delay;

            if (that.next_delay === that.options.delay) {
                LOG(that.label, that.name, 'QUEUE END');
            }

        }, that.next_delay);
        that.next_delay = that.next_delay + that.options.delay;
    };

    this.isReady = function(){
        return that.ready;
    };

    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };

    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    this.getOptions = function () {
        return that.options;
    };

    that.init();

    return {
        ready: that.isReady(),
        on: that.on,
        emit: that.emit,
        getOptions: that.getOptions,
        updateDatabase: that.updateDatabase,
        loadPlaylist: that.loadPlaylist,
        updatePlaylist: that.updatePlaylist,
        initPlaylist: that.initPlaylist,
        setCrossfade: that.setCrossfade,
        play: that.play,
        repeat: that.repeat,
        status: that.status,
        skip: that.skip,
        pause: that.pause,
        stop: that.stop
    }
};