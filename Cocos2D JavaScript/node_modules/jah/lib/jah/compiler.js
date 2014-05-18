"use strict";

var sys       = require('util')
  , logger    = require('./logger')
  , fs        = require('fs')
  , path      = require('path')
  , copyfile  = require('./copytree').copyfile
  , mkdir     = require('./copytree').mkdir
  , T         = require('./template').Template
  , mimetypes = require('./mimetypes')

var DEFAULT_JAH_JSON = { mainModule:  'main'
                       , resourceURL: 'resources'
                       , sourcePath:  'src'
                       , output:      'main.js'
                       , assetPath:   'assets'
                       }

var JAH_ROOT = path.normalize(path.dirname(path.join(__dirname, '../')))

var TEMPLATES = { code:      new T('function (exports, require, module, __filename, __dirname) {${data}}')
                , jahFooter: new T(fs.readFileSync(path.join(__dirname, 'module_js'), 'utf8'))
                , resource:  new T('__jah__.resources["${filename}"] = {data: ${data}, mimetype: "${mimetype}", remote: ${remote}};')
                }

function readJSONFile (filename) {
    var j = fs.readFileSync(filename, 'utf8');

    // Strip comments
    j = j.replace(/\/\/.*/g, '');
    j = j.replace(/\/\*(.|[\n\r])*?\*\//mg, '');

    // Fix unquoted keys
    j = j.replace(/\{\s*(\w)/g, '{"$1');
    j = j.replace(/,(\s*)(\w)/g, ',$1"$2');
    j = j.replace(/(\w):/g, '$1":');

    // Fix trailing comma
    j = j.replace(/,\s+\}/mg, '}');

    return JSON.parse(j);
}

function mergeObjects () {
    var o = {};
    for (var i = 0, len = arguments.length; i < len; i++) {
        var obj = arguments[i];
        for (var x in obj) {
            if (obj.hasOwnProperty(x)) {
                o[x] = obj[x];
            }
        }
    }

    return o;
}

function Compiler (configFile) {
    if (configFile) {
        this.loadConfig(configFile)
    }
}

Compiler.prototype.loadConfig = function (configFile) {
    this.config = this.readConfig(configFile)
    this.buildQueue = {}

    this.isJah = (path.normalize(JAH_ROOT) == path.normalize(path.dirname(configFile)))

    // Add Jah built-ins to build queue (unless this is Jah)
    if (!this.isJah) {
        this.addToBuildQueue(JAH_ROOT, null, 'jah.js')
    }

    // Add each lib to build queue
    if (this.config.libs instanceof Array) {
        var libname, libpath, i
        for (i=0; i<this.config.libs.length; i++) {
            libname = this.config.libs[i]
            libpath = this.findLibPath(libname)
            if (!libpath) {
                throw "Unable to find location of library: " + libname
            }
            this.addToBuildQueue(libpath, null, libname + '.js')
        }
    }

    // TODO handle libs as a dictionary: {libname: mount}
}

Compiler.prototype.findLibPath = function (libname) {
    var installPrefix = process.installPrefix || path.join(path.dirname(process.execPath), '..')

    // Paths to search for the lib, in priority order
    var possiblePaths = [ path.join('node_modules', libname)
                        , path.join('~/.node_modules', libname)
                        , path.join(installPrefix, 'lib', 'node_modules', libname)
                        ]

    // If we're inside a node_modules folder loop up the parent packages to see if any match the lib
    var parentNodeModules = path.join(JAH_ROOT, '..')
      , parentPackage = path.join(parentNodeModules, '..')
    while (path.basename(parentNodeModules) == 'node_modules' && path.existsSync(path.join(parentPackage, 'package.json'))) {
        // Add path to start of array so it gets highest priority
        possiblePaths.unshift(parentPackage)

        parentNodeModules = path.join(parentPackage, '..')
        parentPackage = path.join(parentNodeModules, '..')
    }

    var p, i, pkgJSON
    for (i=0; i<possiblePaths.length; i++) {
        p = possiblePaths[i]
        // Test if jah.json file exists and that package.json has the correct name
        if (path.existsSync(path.join(p, 'jah.json')) && path.existsSync(path.join(p, 'package.json'))) {

            pkgJSON = JSON.parse(fs.readFileSync(path.join(p, 'package.json'), 'utf8'))
            if (pkgJSON.name == libname) {
                return p
            }
        }
    }

    return false
}

Compiler.prototype.readConfig = function (configFile) {
    logger.info('Using config', configFile)

    var config = readJSONFile(configFile)

    // Force .js files to be packed
    if (config.pack_resources instanceof Array) {
        config.pack_resources.push('js')
    } else if (config.pack_resources === false) {
        config.pack_resources = ['js']
    }

    config = mergeObjects(DEFAULT_JAH_JSON, config)

    // Fix relative paths to source code
    if (config.sourcePath[0] != "/") {
        config.sourcePath = path.join(path.dirname(configFile), config.sourcePath)
    }

    return config
}

Compiler.prototype.addToBuildQueue = function (src, dst, filename) {
    this.buildQueue[src] = { filename: filename
                           , mount: dst
                           }
}

Compiler.prototype.build = function () {
    var packages = this.buildPackages()

    // FIXME This is a crude way to give package names to scriptHTML()
    this.lastPackages = Object.keys(packages)

    // Write out the javascript files
    logger.group('Writing scripts')
    var pkgName, pkg, filename
    for (pkgName in packages) {
        if (packages.hasOwnProperty(pkgName)) {
            pkg = packages[pkgName]
            filename = path.join('build', pkgName)

            logger.info('Writing file', filename)

            // Write out the package to disk
            mkdir(path.join('build'));
            fs.writeFileSync(filename, pkg, 'utf8')
        }
    }
    logger.ungroup()

    this.copyPublicAssets('public', 'build', function () {
        this.copyAssets(path.join('build', this.config.assetPath))
    }.bind(this))
}

Compiler.prototype.copyPublicAssets = function (src, dst, callback) {
    var filenames = fs.readdirSync(src)
      , current = 0

    logger.group('Copying public files')

    var copyNextAsset = function () {
        if (current >= filenames.length) {
            logger.ungroup()
            if (callback) {
                callback()
            }
            return
        }

        var input = path.join(src, filenames[current])
          , output = path.join(dst, filenames[current])

        current++

        if (fs.lstatSync(input).isDirectory()) {
            this.copyPublicAssets(input, output, copyNextAsset)
        } else {

            if (/\.template$/.test(input)) {
                output = output.replace(/\.template$/, '')
                logger.info('Writing template', input + ' => '.yellow + output)
                
                var template = new T(fs.readFileSync(input).toString())
                fs.writeFile(output, template.substitute({ scripts: this.scriptHTML() }), 'utf8', copyNextAsset)
            } else {
                logger.info('Copying file', input + ' => '.yellow + output)
                copyfile(input, output, copyNextAsset)
            }

        }


    }.bind(this)

    copyNextAsset()
}

Compiler.prototype.copyAssets = function (dst, callback) {
    var assets = this.collectAssets()
      , current = 0
      , filenames = Object.keys(assets)

    logger.group('Writing assets')
    var copyNextAsset = function () {
        if (current >= filenames.length) {
            logger.ungroup()
            if (callback) {
                callback()
            }
            return
        }

        var input = filenames[current]
          , output = path.join(dst, assets[input])

        logger.info('Copying asset', input + ' => '.yellow + output)
        copyfile(input, output, copyNextAsset)

        current++
    }.bind(this)

    copyNextAsset()
}

Compiler.prototype.buildPackages = function (mount) {
    mount = mount || '/'

    var packages = {}

    var codePath, pkg
      , pkgCompiler = new Compiler()

    for (codePath in this.buildQueue) {
        if (this.buildQueue.hasOwnProperty(codePath)) {
            pkg = this.buildQueue[codePath]

            // Create blank package file contents
            if (!packages[pkg.filename]) {
                packages[pkg.filename] = ''
            }

            // Load the config for the package
            pkgCompiler.loadConfig(path.join(codePath, 'jah.json'))

            // Append code to package file contents
            packages[pkg.filename] += pkgCompiler.buildProject(pkg.mount)
        }
    }


    // Create blank package for the project
    if (!packages[this.config.output]) {
        packages[this.config.output] = ''
    }

    // Append code to package file contents
    packages[this.config.output] += this.buildProject(mount)

    return packages
}

// FIXME DRY this method with buildPackages
Compiler.prototype.collectFilenames = function (mount) {
    mount = mount || this.config.mount || '/'

    var filenames = []

    var codePath, pkg
      , pkgCompiler = new Compiler()

    for (codePath in this.buildQueue) {
        if (this.buildQueue.hasOwnProperty(codePath)) {
            pkg = this.buildQueue[codePath]

            // Load the config for the package
            pkgCompiler.loadConfig(path.join(codePath, 'jah.json'))

            pkg.mount = pkg.mount || pkgCompiler.config.mount

            // Append code to package file contents
            filenames = filenames.concat(pkgCompiler.collectPathFilenames(pkgCompiler.config.sourcePath, pkg.mount))
        }
    }


    filenames = filenames.concat(this.collectPathFilenames(this.config.sourcePath, mount))

    return filenames
}

// FIXME DRY this method with buildPackages & collectFilenames
Compiler.prototype.collectAssets = function (mount) {
    mount = mount || this.config.mount || '/'

    var filenames = []

    var codePath, pkg
      , pkgCompiler = new Compiler()

    for (codePath in this.buildQueue) {
        if (this.buildQueue.hasOwnProperty(codePath)) {
            pkg = this.buildQueue[codePath]

            // Load the config for the package
            pkgCompiler.loadConfig(path.join(codePath, 'jah.json'))

            pkg.mount = pkg.mount || pkgCompiler.config.mount

            // Append code to package file contents
            filenames = mergeObjects(filenames, pkgCompiler.collectAssetFilenames(pkgCompiler.config.sourcePath, pkg.mount))
        }
    }


    filenames = mergeObjects(filenames, this.collectAssetFilenames(this.config.sourcePath, mount))

    return filenames
}

// FIXME DRY this with collectPathFilenames
Compiler.prototype.collectAssetFilenames = function (filename, mountRoot) {
    var files = fs.readdirSync(filename)
      , file, fullPath, i, len, mount, mimetype
      , foundFiles = {}

    for (i = 0, len = files.length; i < len; i++) {
        file = files[i]
        if (file[0] == '.') continue // Skip hidden files
        fullPath = path.join(filename, file)
        mount = path.join(mountRoot, file)

        mimetype = mimetypes.guessType(fullPath)

        if (fs.statSync(fullPath).isFile()) {
            // If not a javascript file, then it's an asset
            if (mimetype != 'application/javascript') {
                foundFiles[fullPath] = mount
            }
        } else {
            foundFiles = mergeObjects(foundFiles, this.collectAssetFilenames(fullPath, mount))
        }
    }

    return foundFiles
}

Compiler.prototype.jahHeader = function () {
    return 'if (!window.__jah__) window.__jah__ = {resources:{}, assetURL: ' + JSON.stringify(this.config.assetPath) + '};\n'
}

Compiler.prototype.jahFooter = function () {
    return TEMPLATES.jahFooter.toString()
}

Compiler.prototype.buildProject = function (mount) {
    mount = mount || this.config.mount || '/'

    var code = this.buildPath(this.config.sourcePath, mount).join("\n")

    // Add Jah header to the main Jah file
    if (this.isJah) {
        code = this.jahHeader() + code + this.jahFooter()
    }

    return '(function(){\n' + code + '\n})();'
}

Compiler.prototype.collectPathFilenames = function (filename, mountRoot) {
    var files = fs.readdirSync(filename)
      , file, fullPath, i, len, mount
      , foundFiles = []

    for (i = 0, len = files.length; i < len; i++) {
        file = files[i]
        if (file[0] == '.') continue // Skip hidden files
        fullPath = path.join(filename, file)
        mount = path.join(mountRoot, file)

        if (fs.statSync(fullPath).isFile()) {
            foundFiles.push(mount)
        } else {
            foundFiles = foundFiles.concat(this.collectPathFilenames(fullPath, mount))
        }
    }

    return foundFiles
}


Compiler.prototype.buildPath = function (filename, mountRoot) {
    logger.group('Build ' + 'Path'.underline, filename + ' => '.yellow + mountRoot)

    // If it's a file rather than a directory
    if (fs.statSync(filename).isFile()) {
        logger.ungroup()
        return [this.buildFile(filename, mountRoot)]
    }

    var builtFiles = []

    var files = fs.readdirSync(filename)
      , file, fullPath, i, len, mount

    for (i = 0, len = files.length; i < len; i++) {
        file = files[i]
        if (file[0] == '.') continue // Skip hidden files
        fullPath = path.join(filename, file)
        mount = path.join(mountRoot, file)

        if (fs.statSync(fullPath).isFile()) {
            builtFiles.push(this.buildFile(fullPath, mount))
        } else {
            builtFiles = builtFiles.concat(this.buildPath(fullPath, mount))
        }
    }

    logger.ungroup()

    return builtFiles
}

Compiler.prototype.buildFile = function (filename, mount, tight) {
    logger.info('Build ' + 'File'.underline, filename + ' => '.yellow + mount)

    var mimetype = mimetypes.guessType(filename)
      , data = ''

    switch (mimetype) {
    case 'application/javascript':
        data = this.wrapModule(fs.readFileSync(filename, 'utf8'), mount, tight)
        break;
    default:
        data = this.wrapAsset(filename, mount, mimetype)
        break;
    }

    return data
}

Compiler.prototype.wrapResource = function (data, mount, mimetype, remote) {
    return TEMPLATES.resource.substitute({ filename: mount
                                         , data: data
                                         , mimetype: mimetype || 'text/plain'
                                         , remote: (!!remote).toString()
                                         })
}

Compiler.prototype.wrapAsset = function (filename, mount, mimetype) {
    return this.wrapResource("__jah__.assetURL + " + JSON.stringify(mount), mount, mimetype, true)
}

Compiler.prototype.wrapModule = function (data, mount, tight) {
    if (!tight) {
        data = "\n" + data + "\n"
    }

    var code = this.wrapResource(TEMPLATES.code.substitute({ data: data }), mount, 'application/javascript')

    if (!tight) { 
        code += " // END: " + mount + "\n\n";
    }

    return code
}

Compiler.prototype.filePathForScript = function (scriptname) {
    if (scriptname[0] != '/') {
        scriptname = '/' + scriptname
    }

    var bestMatch = null
      , codePath
      , pkg
      , config
      , srcname
      , jahJson

    for (codePath in this.buildQueue) {
        if (this.buildQueue.hasOwnProperty(codePath)) {
            pkg = this.buildQueue[codePath]
            jahJson = path.join(codePath, 'jah.json')
            if (!path.existsSync(jahJson)) {
                continue;
            }
            config = this.readConfig(jahJson)
            pkg.mount = pkg.mount || config.mount

            // If script begins with the mount point
            // TODO handle multiple matches -- use the longest match??
            if (scriptname.indexOf(pkg.mount) === 0) {
                // Find location of source code and replace mount point with it
                srcname = scriptname.substring(pkg.mount.length)
                bestMatch = { filename: path.join(config.sourcePath, srcname)
                            , mount: path.join(pkg.mount, srcname)
                            }
                break;
            }
        }
    }

    if (!bestMatch) {
        bestMatch = { filename: path.join(this.config.sourcePath, scriptname)
                    , mount: path.join('/', scriptname)
                    }
    }

    if (!path.existsSync(bestMatch.filename)) {
        bestMatch = null
    }

    return bestMatch
}

Compiler.prototype.getAllMountFilenames = function () {
    return this.collectFilenames()
}

Compiler.prototype.scriptHTML = function () {
    var tag = new T('\n        <script src="${filename}" type="text/javascript"></script>')
      , html = ''

    // Make sure jah is first
    html += tag.substitute({ filename: 'jah.js' })
    for (var i=0; i<this.lastPackages.length; i++) {
        if (this.lastPackages[i] == 'jah.js') {
            continue
        }
        html += tag.substitute({ filename: this.lastPackages[i] })
    }

    return html
}

exports.Compiler = Compiler
