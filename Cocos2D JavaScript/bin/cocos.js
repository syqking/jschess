#!/usr/bin/env node

var sys = require('util'),
    fs  = require('fs'),
    path = require('path');

if (parseInt(process.version.split('.')[1], 10) < 2) {
    sys.puts('ERROR: cocos2d requires node version 0.2.x or higher, but you are using ' + process.version);
    process.exit(1);
}

var version = JSON.parse(fs.readFileSync(__dirname + '/../package.json')).version;

sys.puts('cocos2d-javascript version ' + version);

require('../lib/cocos2d').main();
