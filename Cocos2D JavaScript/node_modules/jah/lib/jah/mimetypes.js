var fs = require('fs'),
    path = require('path');

var typesMap = {},
    typesMapInv = {};

exports.knowntypes = ['/etc/mime.types',
                      '/etc/httpd/mime.types',
                      '/etc/httpd/conf/mime.types',
                      '/etc/apache/mime.types',
                      '/etc/apache2/mime.types',
                      '/usr/local/etc/httpd/conf/mime.types',
                      '/usr/local/lib/netscape/mime.types',
                      '/usr/local/etc/httpd/conf/mime.types',
                      '/usr/local/etc/mime.types',
                      path.join(__dirname, 'mime.types')];

exports.guessType = function(url) {
    return typesMap[path.extname(url)];
};


function addType(type, ext) {
    typesMap[ext] = type.trim();
    if (!typesMapInv[type]) {
        typesMapInv[type] = [];
    }
    if (!~typesMapInv[type].indexOf(ext)) {
        typesMapInv[type].push(ext);
    }
}

exports.addType = addType;

/**
 * Read a single mime.types-format file
 */
function read(file) {
    var data = fs.readFileSync(file, 'ascii');
    // Strip comments
    data = data.replace(/#.*/g, '');
    var lines = data.split('\n');
    for (var i = 0, len = lines.length; i < len; i++) {
        var line = lines[i].trim();
        if (!line) {
            continue;
        }

        var words = line.split(/\s/),
            type = words.shift(),
            suffixes = words;

        for (var j = 0, jen = suffixes.length; j < jen; j++) {
            var suff = suffixes[j].trim();
            if (!suff) {
                continue;
            }

            addType(type, '.' + suff);
        }
    }
}

for (var i = 0, len = exports.knowntypes.length; i < len; i++) {
    var typeFile = exports.knowntypes[i];
    if (path.existsSync(typeFile)) {
        read(typeFile);
    }
}
