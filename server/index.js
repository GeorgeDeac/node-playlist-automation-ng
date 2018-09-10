const Event = require('events');
const express = require('express');
const http = require('http');
const station = require('./endpoints/station.js');
const channel = require('./endpoints/channel.js');
const channels = require('./endpoints/channels.js');
const internal = require('./endpoints/internal.js');

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.server;
    const event = new Event();

    this.label = 'WEB SERVER';
    this.app = null;
    this.http = null;

    this.init = function () {
        that.mergeOptions();
        LOG(that.label, 'INIT');

        that.on('ready', function () {
            LOG(that.label, '>>> READY ON PORT', that.options.port);
        });

        that.app = express();


        that.app.use('/internal', internal);
        that.app.use('/station', station);
        that.app.use('/channel', channel);
        that.app.use('/channels', channels);
        that.app.use('/', express.static('server/static'));

        that.app.use(function (req, res, next) {
            const err = new Error('Not Found');
            err.status = 404;
            res.json(err);
        });

        that.http = http.createServer(that.app);
        that.http.listen(that.options.port, function () {
            that.emit('ready');
        });

    };

    this.mergeOptions = function () {
        if (typeof args === 'object') {
            this.options = Object.assign({}, defaults, args);
        } else {
            this.options = defaults;
        }
    };

    this.shutdown = function(){
        that.http.close(function(){
            LOG(that.label, 'CLOSED');
        });
    };


    this.on = function () {
        event.on.apply(event, Array.from(arguments));
    };
    this.emit = function () {
        event.emit.apply(event, Array.from(arguments));
    };

    that.init();

    return {
        shutdown : that.shutdown,
        app: that.app,
        on: that.on,
        emit: that.emit
    };
};