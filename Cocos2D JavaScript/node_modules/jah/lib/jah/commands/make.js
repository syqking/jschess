"use strict";

var opts = require('../opts')
  , Compiler = require('../compiler').Compiler

var OPTIONS = [ { short:       'c'
                , long:        'config'
                , description: 'Configuration file. Default is jah.json'
                , value:       true
                }
              ]

exports.description = 'Build the current Jah project';
exports.run = function () {
    opts.parse(OPTIONS, true)

    var config = opts.get('config') || 'jah.json'
      , compiler = new Compiler(config)

    compiler.build()
}
