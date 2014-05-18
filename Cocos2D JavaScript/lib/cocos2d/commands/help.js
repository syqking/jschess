"use strict"

var sys = require('util')

exports.description = 'Show list of available commands'
exports.run = function (opts) {
    var commands = require('./')
    sys.puts('Available commands are:')
    for (var key in commands) {
        if (commands.hasOwnProperty(key) && key != 'main') {
            var command = 'cocos ' + key

            var spaces = ''
            for (var i = 0; i < 8 - key.length; i++) {
                spaces += ' '
            }
            sys.puts('  ' + command + spaces + ':  ' + commands[key].description)
        }
    }
}
