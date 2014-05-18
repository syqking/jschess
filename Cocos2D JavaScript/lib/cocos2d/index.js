/*globals require module exports process console*/
/*jslint undef: true, strict: true, white: true, newcap: true, indent: 4 */
"use strict";

var sys = require('util'),
    commands = require('./commands');

exports.main = function (opts) {
    var cmd = process.argv[2];

    if (!cmd) {
        cmd = 'help';
    }

    if (!commands[cmd]) {
        sys.puts('Unknown command: ' + cmd);
        sys.puts('Run "cocos help" for a list of available commands');
        process.exit(1);
    }

    commands[cmd].run(process.argv.slice(3));
};
