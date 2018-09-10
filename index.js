/**
 * Playlist Automation NG
 * @author Matthias Kallenbach
 * @since 2018
 *
 */
require('./lib/globals');      // set global things and loads the configuration
require('./lib/station');      // the station

process.on('SIGINT', function () {
    STATION.shutdown();
    setTimeout(function () {
        process.exit(0);
    }, 4000);
});
process.stdin.resume();