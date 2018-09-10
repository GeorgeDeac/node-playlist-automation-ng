module.exports = {
    apps: [{
        name: 'station',
        script: 'index.js',
        env: {
            NODE_ENV: 'production',
            NODE_DEBUG: true,
            restart: true
        },
        env_production: {
            NODE_ENV: 'production',
            NODE_DEBUG: true,
            restart: true
        },
        env_vagrant: {
            NODE_ENV: 'vagrant',
            NODE_DEBUG: true,
            restart: false
        },
        env_raspberrypi: {
            NODE_ENV: 'raspberrypi',
            NODE_DEBUG: true,
            restart: false
        },
    }]
};
