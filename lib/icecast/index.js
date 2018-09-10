const spawn = require('child_process').spawn;
const merge = require('deepmerge');
const fs = require('fs-extra');
const http = require('http');
const Event = require('events');

module.exports = function (args) {
    let that = this;
    const defaults = CONFIG.icecast;

    this.name = 'ICECAST';
    this.event = new Event();
    this.options = defaults;
    this.conf_file = null;
    this.process = null;
    this.status = null;

    if (args) {
        if (args.options)
            if (typeof args.options === 'object') {
                that.options = merge(defaults, args.options);
            }
    }

    this.init = function () {
        LOG(that.name, 'INIT');
        that.conf_file = P(`${that.options.paths.config}/${that.options.name}.xml`);

        that.on('ready', function () {
            LOG(that.name, '>>> READY');
            that.getStatus()
        });
        that.on('saved', function () {
            LOG(that.name, 'SAVED CONFIG FILE', that.conf_file);
        });
        that.on('status', function (status) {
            that.status = status.icestats;
            setTimeout(function () {
                that.setStatus();
            }, that.options.status_delay);
        });
        that.checkFolder();
        that.save();

        if (that.options.autostart === true) {
            that.run();
        } else {
            setTimeout(function () {
                that.emit('ready');
            }, 100);
        }
    };

    this.checkFolder = function () {
        Object.keys(that.options.paths).forEach(function (p) {
            const mkd = P(that.options.paths[p]);
            if (fs.existsSync(mkd)) {
                LOG(that.name, 'SKIPPING CREATE DIRECTORY', mkd);
            } else {
                LOG(that.name, 'CREATING DIRECTORY', mkd);
                fs.mkdirsSync(mkd);
            }
        });
    };

    this.save = function () {
        let conf = '<icecast>\n';
        Object.keys(that.options.paths).forEach(function (i) {
            that.options.config.paths[i] = P(that.options.paths[i]);
        });
        Object.keys(that.options.config).forEach(function (i) {
            if (typeof that.options.config[i] === 'string' || typeof that.options.config[i] === 'number') {
                conf += '    <' + i + '>' + that.options.config[i] + '</' + i + '>\n';
            }
            if (typeof that.options.config[i] === 'object') {
                conf += '    <' + i + '>\n';
                Object.keys(that.options.config[i]).forEach(function (ii) {
                    if (typeof that.options.config[i][ii] === 'string' || typeof that.options.config[i][ii] === 'number') {
                        conf += '        <' + ii + '>' + that.options.config[i][ii] + '</' + ii + '>\n';
                    }
                    if (typeof that.options.config[i][ii] === 'object') {
                        const attr = [];
                        that.options.config[i][ii].forEach(function (iii) {
                            Object.keys(iii).forEach(function (k) {
                                attr.push(k + '="' + iii[k] + '"');
                            });
                        });
                        const s = attr.join(' ');
                        conf += '        <' + ii + ' ' + s + '/>\n';
                    }
                });
                conf += '    </' + i + '>\n';
            }
        });
        conf += '</icecast>\n';
        fs.writeFileSync(that.conf_file, conf);
        that.emit('saved', that);
    };

    this.run = function () {
        const options = ['-c', that.conf_file];
        LOG(that.name, 'STARTING', that.options.bin, 'WITH CONFIG', options.join(' '));

        that.process = spawn(that.options.bin, options);
        that.process.stdout.setEncoding('utf8');
        that.process.stderr.setEncoding('utf8');

        that.process.stderr.on('data', function (chunk) {
            LOG(that.name, 'GOT MESSAGE', chunk);
        });

        that.process.stderr.on('end', function () {
            LOG(that.name, 'EXITED');
        });
        setTimeout(that.checkUp, that.options.checkup_delay);
    };

    this.checkUp = function () {
        LOG(that.name, 'CHECK IF IT IS RUNNING ...');
        http.get({
            hostname: that.options.config.hostname,
            port: that.options.config["listen-socket"].port,
            path: '/' + that.options.status_endpoint
        }, function (res) {
            let json = '';
            res.on('data', function (data) {
                json += data;
            });
            res.on('end', function () {
                that.emit('ready', json);
            });
        }).on('error', function (err) {
            LOG(that.name, 'IS NOT RUNNING', JSON.stringify(err));
            setTimeout(that.checkUp, that.options.checkup_delay);
        });
    };

    this.setStatus = function () {
        http.get({
            hostname: that.options.config.hostname,
            port: that.options.config["listen-socket"].port,
            path: '/' + that.options.status_endpoint
        }, function (res) {
            let json = '';
            res.on('data', function (data) {
                json += data;
            });
            res.on('end', function () {
                that.emit('status', JSON.parse(json));
            });
        }).on('error', function (err) {
            console.LOG(that.name, 'IS NOT RUNNING', JSON.stringify(err));
            setTimeout(that.setStatus, that.options.status_delay);
        });
    };

    this.getOptions = function () {
        return that.options;
    };

    this.getStatus = function () {
        return that.status;
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
        options: that.getOptions(),
        status: that.getStatus()
    }

};