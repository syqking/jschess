module.exports = exports = {
    'help':   require('./help'),
    'new':    require('./new'),
    'server': require('./server'),
    'make':   require('./make'),
    //'ide':    require('./ide')
}

exports.main = function (opts) {
    var cmd = process.argv[2];

    if (!cmd) {
        cmd = 'help';
    }

    if (!exports[cmd]) {
        sys.puts('Unknown command: ' + cmd);
        sys.puts('Run "jah help" for a list of available commands');
        process.exit(1);
    }

    exports[cmd].run(process.argv.slice(3));
};
