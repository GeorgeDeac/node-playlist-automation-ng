const Event = require('events');
const Icecast = require('../icecast');
const Storage = require('../storage');
const Shows = require('../shows');
const Channels = require('../channels');
const Server = require('../../server');

/**
 *
 * The Station
 *
 */
global.STATION = function () {
    let that = this;

    this.label = 'STATION';
    this.event = new Event();

    this.storage = null;
    this.icecast = null;
    this.shows = null;
    this.channels = null;
    this.server = null;

    LOG(this.label, 'INIT');

    this.init = function(){

        that.on('ready', function(){
            LOG(that.label, '>>> READY');
        });

        that.initStorage();
    };

    /**
     *
     */
    this.initStorage = function(){
        that.storage = new Storage();
        that.storage.on('ready', that.initIcecast);
    };

    /**
     *
     */
    this.initIcecast = function(){
        that.icecast = new Icecast();
        that.icecast.on('ready', that.initShows);
    };

    /**
     *
     */
    this.initShows = function () {
        that.shows = new Shows();
        that.shows.on('ready', that.initChannels);
    };

    /**
     *
     */
    this.initChannels = function(){
        that.channels = new Channels();
        that.channels.on('ready', that.initServer);
    };

    this.initServer = function(){
        global.STATION = that;
        that.server = new Server();
        that.server.on('ready', function(){
            that.emit('ready');
        });
    };



    this.shutdown = function () {
        that.server.shutdown();
        that.channels.shutdown();
    };



    this.on = function () {
        that.event.on.apply(that.event, Array.from(arguments));
    };
    this.emit = function () {
        that.event.emit.apply(that.event, Array.from(arguments));
    };

    that.init();

    return that;
}();
