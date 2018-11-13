module.exports = {
    bin: "/usr/bin/mpd",
    ready_delay: 200,
    skip_timeout: 10000,
    debug : {
        stderr : true
    },
    path : {
        music: "",

        config : "mpd",
        log: "mpd/log",

        db: "mpd/db",
        pid: "mpd/pid",

    },
    db_filename: 'shared',
    config: {
        user: "seek",
        playlist_directory: "",
        music_directory: "",
        db_file: "mpd.cache",
        pid_file: "playlist.pid",
        log_file: "mpd_playlist.log",
        buffer_before_play: "80%",
        audio_buffer_size: 16384,
        port: 6600,
        log_level: "verbose", // secure
        bind_to_address: "0.0.0.0",
        zeroconf_enabled: "yes",
        zeroconf_name: "piradio",
        audio_output: {
            type: "shout",
            encoding: "mp3",
            name: "piradio",
            host: "localhost",
            port: 8100,
            mount: "/playlist",
            password: "changeme",
            bitrate: 128,
            format: "44100:16:2"
        }
    },
    bluetooth: {
	    audio_output: {
            type: "alsa",
            name: "audio out",
            device: "bluetooth",
	        format: "44100:16:2",
	        driver: "software"
        }
    }
};

