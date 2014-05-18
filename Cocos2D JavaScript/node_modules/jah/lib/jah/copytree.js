var fs     = require('fs'),
    sys    = require('util'),
    logger = require('./logger'),
    path   = require('path');

function mkdir(dir, mode) {
    mode = mode || 511; // Octal = 0777;
    
    if (dir[0] != '/') {
        dir = path.join(process.cwd(), dir);
    }

    var paths = [dir];
    var d = dir;
    while ((d = path.dirname(d)) && d != '/') {
        paths.unshift(d);
    }

    for (var i = 0, len = paths.length; i < len; i++) {
        var p = paths[i];
        if (!path.existsSync(p)) {
            fs.mkdirSync(p, mode);
        }
    }
}


function copyfolder(src, dst) {
    if (fs.statSync(src).isDirectory()) {
        mkdir(dst);
        logger.log("Created directory: " + dst);

        var files = fs.readdirSync(src);
        for (var i = 0, len = files.length; i < len; i++) {
            var file = files[i];
            if (file[0] == '.') {
                // Skip hidden files
                continue;
            }

            var dstFile = path.join(dst, path.basename(file));
            copyfolder(path.join(src, file), dstFile);
        }
    } else {
        sys.pump(fs.createReadStream(src), fs.createWriteStream(dst));
        logger.log("Copied file: " + dst);
    }
}

function copyfile(src, dst, callback) {
    mkdir(path.dirname(dst))

    var reader = fs.createReadStream(src);
    var writer = fs.createWriteStream(dst);

    writer.addListener('close', callback);
    writer.addListener('error', function (error) {
        sys.puts("ERROR copying file: " + src + " => " + dst)
        sys.puts(error.message)
    });
    sys.pump(reader, writer);
}

/**
 * @see https://gist.github.com/563078/afa6c25facaf857712c6847c0bdc748cb6476f93
 */
function copytree(src, dst, skipHidden) {
    if(!path.existsSync(src)) {
        throw new Error(src + ' does not exists. Nothing to be copied');
    }

    if(!fs.statSync(src).isDirectory()) {
        throw new Error(src + ' must be a directory');
    }

    var filenames = fs.readdirSync(src);
    var basedir = src;

    if(!path.existsSync(dst)) {
        mkdir(dst, parseInt('0755', 8));
    }
    var readNext = function(){
        if (!filenames.length) return;
            var filename = filenames.shift();

        if (skipHidden && filename[0] == '.') {
            return;
        }
        var file = path.join(basedir, filename);
        var newdst = path.join(dst, filename);
        logger.info('Copying file', file + ' => '.yellow + newdst);

        if(fs.lstatSync(file).isDirectory()) {
            copytree(file, newdst);
            readNext();
        } else {
            copytree.count++;
            copyfile(file, newdst, function(){
                copytree.count--;
                readNext();
            })
        }
    }
    readNext();
}
copytree.limit = 2;
copytree.count = 0;

exports.copyfile = copyfile;
exports.copytree = copytree;
exports.copyfolder = copyfolder;
exports.mkdir = mkdir;
