#!/usr/bin/env node

/**
 * @fileOverview Generates a Windows installer .exe and a .zip
 */

var path = require('path');

// Include cocos2d because it has some useful modules
require.paths.unshift(path.join(__dirname, '../../lib'));

var sys = require('sys'),
    fs  = require('fs'),
    spawn = require('child_process').spawn,
    opts = require('cocos2d/opts'),
    Template = require('cocos2d/template').Template;


var OPTS = [
    {long: 'package-version', description: 'Override version inside package.json', required: false, value: true},
    {long: 'output', description: 'Directory to write packages to. Default is current directory', required: false, value: true}
];
opts.parse(OPTS, [], true);



var VERSION = opts.get('package-version') || JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'))).version;
var OUTPUT_PATH = opts.get('output') || path.join(__dirname, 'build');

sys.puts('Packaging Cocos2D JavaScript version: ' + VERSION);
sys.puts('Writing packages to: ' + OUTPUT_PATH);

/**
 * Generates an NSIS installer script to install the contents of a given
 * directory and returns it as a string.
 *
 * @param {String} dir The directory that will be installed
 * @returns String The contents of the NSIS script
 */
function generateNSISScript(files, callback) {
    sys.puts('Generating NSIS script');
    var installFileList = '  SetOverwrite try\n',
        removeFileList  = '',
        removeDirList   = '';

    files = files.filter(function(file) {
        // Ignore node-builds for other platforms
        if (~file.indexOf('node-builds') && !~file.indexOf('cyg') && !~file.indexOf('tmp') && !~file.indexOf('etc')) {
            return;
        }

        return file;
    });


    // Generate the install and remove lists
    var prevDirname, i, len;
    for (i = 0, len = files.length; i < len; i++) {
        var file = files[i];
        var dirname = path.dirname(file);

        if (dirname != prevDirname) {
            prevDirname = dirname;
            installFileList += '  SetOutPath "$INSTDIR\\' + dirname.replace(/\//g, '\\') + '"\n';
            removeDirList  += '  RMDir "$INSTDIR\\' + dirname.replace(/\//g, '\\') + '"\n';
        }

        var m;
        if ((m = file.match(/\/?(README|LICENSE)(.md)?$/))) {
            // Rename README and LICENSE so they end in .txt
            installFileList += '  File /oname=' + m[1] + '.txt "${ROOT_PATH}\\' + file.replace(/\//g, '\\') + '"\n';
        } else {
            installFileList += '  File "${ROOT_PATH}\\' + file.replace(/\//g, '\\') + '"\n';
        }
        removeFileList  += '  Delete "$INSTDIR\\' + file.replace(/\//g, '\\') + '"\n';
    }


    var tmp = new Template(fs.readFileSync(path.join(__dirname, 'installer_nsi.template'), 'utf8'));
    var data = tmp.substitute({
        root_path: path.join(__dirname, '../..'),
        output_path: OUTPUT_PATH,
        version: 'v' + VERSION,
        install_file_list: installFileList,
        remove_file_list: removeFileList,
        remove_dir_list: removeDirList
    });

    callback(data);
}

/**
 * Uses git to find the files we want to install. If a file isn't commited,
 * then it won't be installed.
 *
 * @param {String} dir The directory that will be installed
 * @returns String[] Array of file paths
 */
function findFilesToPackage(dir, callback) {
    var cwd = process.cwd();
    process.chdir(dir);

    var gitls = spawn('git', ['ls-files']),
        // This gets the full path to each file in each submodule
        subls = spawn('git', ['submodule', 'foreach', 'for file in `git ls-files`; do echo "$path/$file"; done']);
        // List all node_modules
        modls = spawn('find', ['node_modules']);


    var mainFileList = '';
    gitls.stdout.on('data', function (data) {
        mainFileList += data;
    });
    gitls.on('exit', returnFileList);

    var subFileList = '';
    subls.stdout.on('data', function (data) {
        subFileList += data;
    });
    subls.on('exit', returnFileList);
    
    var modFileList = '';
    modls.stdout.on('data', function (data) {
        modFileList += data;
    });
    modls.on('exit', returnFileList);

    var lsCount = 0;
    function returnFileList(code) {
        lsCount++;
        if (lsCount < 3) {
            return;
        }
        process.chdir(cwd);

        // Convert \n separated list of filenames into a sorted array
        var fileList = (mainFileList.trim() + '\n' + subFileList.trim() + '\n' + modFileList.trim()).split('\n').filter(function(file) {
            // Ignore entering submodule messages
            if (file.indexOf('Entering ') === 0) {
                return;
            }

            // Ignore hidden and backup files
            if (file.split('/').pop()[0] == '.' || file[file.length - 1] == '~') {
                return;
            }

            // Submodules appear in ls-files but aren't files. Skip them
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                return;
            }

            
            return file;
        }).sort();

        callback(fileList);
    }

}

function generateZip(files, zipName) {
    zipName += '.zip';

    sys.puts('Generating .zip archive : ' + zipName);
    if (path.exists(zipName)) {
        fs.unlink(zipName);
    }

    var tar = spawn('zip', ['-9', path.join(OUTPUT_PATH, zipName)].concat(files));

    tar.stderr.on('data', function(data) {
        sys.print(data);
    });
    
    tar.on('exit', function() {
        sys.puts('Generated ' + zipName + ' archive');
    });
}
function generateGZip(files, name) {
    var zipName = name + '.tar.gz';

    sys.puts('Generating .tar.gz archive : ' + zipName);
    if (path.existsSync(zipName)) {
        fs.unlink(zipName);
    }

    var pathPrefix = path.join('.', name);
    if (!path.existsSync(pathPrefix)) {
        fs.symlinkSync('.', pathPrefix);
    }

    files = files.map(function (file) { return path.join(pathPrefix, file) })
    var tar = spawn('tar', ['-czf', path.join(OUTPUT_PATH, zipName)].concat(files));

    tar.stderr.on('data', function(data) {
        sys.print(data);
    });
    
    tar.on('exit', function() {
        sys.puts('Generated ' + zipName + ' archive');
        fs.unlink(pathPrefix);
    });
}

function mkdir(dir, mode) {
    mode = mode || 511; // Octal = 0777;
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

(function main() {
    mkdir(OUTPUT_PATH);

    var dir = path.join(__dirname, '../../');
    findFilesToPackage(dir, function(filesToPackage) {
        generateNSISScript(filesToPackage, function(nsis) {

            // Generate installer
            sys.puts('Generating windows installer .EXE');
            var makensis = spawn('makensis', ['-NOCD', '-'], {cwd: OUTPUT_PATH});
            makensis.stderr.on('data', function (data) { sys.print(data); });
            makensis.on('exit', function (data) {
                sys.puts('Windows installer generated');

                var cwd = process.cwd();
                process.chdir(dir);

                // Generate zip archives for all platforms
                generateGZip(filesToPackage, 'cocos2d-javascript-v' + VERSION + '-all');

                function removeNodeBuilds(files, platform) {
                    return files.filter(function(file) {
                        if (~file.indexOf('node-builds') && !~file.indexOf(platform) && !~file.indexOf('tmp') && !~file.indexOf('etc')) {
                            return;
                        }

                        return file;
                    });
                }

                // Mac OS X
                generateZip(removeNodeBuilds(filesToPackage, 'darwin'), 'Cocos2D JavaScript v' + VERSION + ' for Mac');

                // Linux
                generateGZip(removeNodeBuilds(filesToPackage, 'linux'), 'cocos2d-javascript-v' + VERSION + '-linux');

                // Windows
                generateZip(removeNodeBuilds(filesToPackage, 'cyg'), 'Cocos2D JavaScript v' + VERSION + ' for Windows');

                // Solaris
                //generateGZip(removeNodeBuilds(filesToPackage, 'sunos'), 'cocos2d-javascript-v' + VERSION + '-solaris');
            });

            // Write NSIS script to stdin of makensis
            makensis.stdin.write(nsis);
            makensis.stdin.end();
        });
    });
})();

