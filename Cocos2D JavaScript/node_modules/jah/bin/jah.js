#!/usr/bin/env node

var sys = require('util'),
    fs  = require('fs'),
    path = require('path');


var localPath = path.normalize(path.join(process.cwd(), 'node_modules', '.bin', 'jah')),
    isLocal = path.existsSync(localPath) && require.resolve(localPath) != __filename;

// If the local project has its own Jah install, use that executable instead
if (isLocal) {
    require(localPath);
} else {
    if (parseInt(process.version.split('.')[1], 10) < 2) {
        sys.puts('ERROR: Jah requires node version 0.2.x or higher, but you are using ' + process.version);
        process.exit(1);
    }

    require('../lib/jah/commands').main();
}
