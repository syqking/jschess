(function(){
if (!window.__jah__) window.__jah__ = {resources:{}, assetURL: "assets"};
__jah__.resources["/__builtin__/events.js"] = {data: function (exports, require, module, __filename, __dirname) {
/**
 * @namespace
 * Support for listening for and triggering events
 */
var events = {};

/**
 * @private
 * @ignore
 * Returns the event listener property of an object, creating it if it doesn't
 * already exist.
 *
 * @returns {Object}
 */
function getListeners(obj, eventName) {
    if (!obj.js_listeners_) {
        obj.js_listeners_ = {};
    }
    if (!eventName) {
        return obj.js_listeners_;
    }
    if (!obj.js_listeners_[eventName]) {
        obj.js_listeners_[eventName] = {};
    }
    return obj.js_listeners_[eventName];
}

/**
 * @private
 * @ignore
 * Keep track of the next ID for each new EventListener
 */
var eventID = 0;

/**
 * @class
 * Represents an event being listened to. You should not create instances of
 * this directly, it is instead returned by events.addListener
 *
 * @extends Object
 * 
 * @param {Object} source Object to listen to for an event
 * @param {String} eventName Name of the event to listen for
 * @param {Function} handler Callback to fire when the event triggers
 */
events.EventListener = function (source, eventName, handler) {
    /**
     * Object to listen to for an event
     * @type Object 
     */
    this.source = source;
    
    /**
     * Name of the event to listen for
     * @type String
     */
    this.eventName = eventName;

    /**
     * Callback to fire when the event triggers
     * @type Function
     */
    this.handler = handler;

    /**
     * Unique ID number for this instance
     * @type Integer 
     */
    this.id = ++eventID;

    getListeners(source, eventName)[this.id] = this;
};

/**
 * Register an event listener
 *
 * @param {Object} source Object to listen to for an event
 * @param {String|Stringp[} eventName Name or Array of names of the event(s) to listen for
 * @param {Function} handler Callback to fire when the event triggers
 *
 * @returns {events.EventListener|events.EventListener[]} The event listener(s). Pass to removeListener to destroy it.
 */
events.addListener = function (source, eventName, handler) {
    if (eventName instanceof Array) {
        var listeners = [];
        for (var i = 0, len = eventName.length; i < len; i++) {
            listeners.push(new events.EventListener(source, eventName[i], handler));
        }
        return listeners;
    } else {
        return new events.EventListener(source, eventName, handler);
    }
};

/**
 * Trigger an event. All listeners will be notified.
 *
 * @param {Object} source Object to trigger the event on
 * @param {String} eventName Name of the event to trigger
 */
events.trigger = function (source, eventName) {
    var listeners = getListeners(source, eventName),
        args = Array.prototype.slice.call(arguments, 2),
        eventID,
        l;

    for (eventID in listeners) {
        if (listeners.hasOwnProperty(eventID)) {
            l = listeners[eventID];
            if (l) {
                l.handler.apply(undefined, args);
            }
        }
    }
};

/**
 * Remove a previously registered event listener
 *
 * @param {events.EventListener} listener EventListener to remove, as returned by events.addListener
 */
events.removeListener = function (listener) {
    delete getListeners(listener.source, listener.eventName)[listener.eventID];
};

/**
 * Remove a all event listeners for a given event
 *
 * @param {Object} source Object to remove listeners from
 * @param {String} eventName Name of event to remove listeners from
 */
events.clearListeners = function (source, eventName) {
    var listeners = getListeners(source, eventName),
        eventID;


    for (eventID in listeners) {
        if (listeners.hasOwnProperty(eventID)) {
            var l = listeners[eventID];
            if (l) {
                events.removeListener(l);
            }
        }
    }
};

/**
 * Remove all event listeners on an object
 *
 * @param {Object} source Object to remove listeners from
 */
events.clearInstanceListeners = function (source) {
    var listeners = getListeners(source),
        eventID;

    for (var eventName in listeners) {
        if (listeners.hasOwnProperty(eventName)) {
            var el = listeners[eventName];
            for (eventID in el) {
                if (el.hasOwnProperty(eventID)) {
                    var l = el[eventID];
                    if (l) {
                        events.removeListener(l);
                    }
                }
            }
        }
    }
};

module.exports = events;

}, mimetype: "application/javascript", remote: false}; // END: /__builtin__/events.js


__jah__.resources["/__builtin__/index.js"] = {data: function (exports, require, module, __filename, __dirname) {
"use strict";

/**
 * @namespace
 * Useful utility functions
 */
var jah = {
    /**
     * Creates a deep copy of an object
     *
     * @param {Object} obj The Object to copy
     * @returns {Object} A copy of the original Object
     */
    copy: function(obj) {
        if (obj === null) {
            return null;
        }

        var copy;

        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = jah.copy(obj[i]);
            }
        } else if (typeof(obj) == 'object') {
            if (typeof(obj.copy) == 'function') {
                copy = obj.copy();
            } else {
                copy = {};

                var o, x;
                for (x in obj) {
                    copy[x] = jah.copy(obj[x]);
                }
            }
        } else {
            // Primative type. Doesn't need copying
            copy = obj;
        }

        return copy;
    },

    /**
     * Iterates over an array and calls a function for each item.
     *
     * @param {Array} arr An Array to iterate over
     * @param {Function} func A function to call for each item in the array
     * @returns {Array} The original array
     */
    each: function(arr, func) {
        var i = 0,
            len = arr.length;
        for (i = 0; i < len; i++) {
            func(arr[i], i);
        }

        return arr;
    },

    /**
     * Iterates over an array, calls a function for each item and returns the results.
     *
     * @param {Array} arr An Array to iterate over
     * @param {Function} func A function to call for each item in the array
     * @returns {Array} The return values from each function call
     */
    map: function(arr, func) {
        var i = 0,
            len = arr.length,
            result = [];

        for (i = 0; i < len; i++) {
            result.push(func(arr[i], i));
        }

        return result;
    },

    domReady: function() {
        if (this._isReady) {
            return;
        }

        if (!document.body) {
            setTimeout(function() { jah.domReady(); }, 13);
        }

        window.__isReady = true;

        if (window.__readyList) {
            var fn, i = 0;
            while ( (fn = window.__readyList[ i++ ]) ) {
                fn.call(document);
            }

            window.__readyList = null;
            delete window.__readyList;
        }
    },


    /**
     * Adapted from jQuery
     * @ignore
     */
    bindReady: function() {

        if (window.__readyBound) {
            return;
        }

        window.__readyBound = true;

        // Catch cases where $(document).ready() is called after the
        // browser event has already occurred.
        if ( document.readyState === "complete" ) {
            return jah.domReady();
        }

        // Mozilla, Opera and webkit nightlies currently support this event
        if ( document.addEventListener ) {
            // Use the handy event callback
            //document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
            
            // A fallback to window.onload, that will always work
            window.addEventListener( "load", jah.domReady, false );

        // If IE event model is used
        } else if ( document.attachEvent ) {
            // ensure firing before onload,
            // maybe late but safe also for iframes
            //document.attachEvent("onreadystatechange", DOMContentLoaded);
            
            // A fallback to window.onload, that will always work
            window.attachEvent( "onload", jah.domReady );

            // If IE and not a frame
            /*
            // continually check to see if the document is ready
            var toplevel = false;

            try {
                toplevel = window.frameElement == null;
            } catch(e) {}

            if ( document.documentElement.doScroll && toplevel ) {
                doScrollCheck();
            }
            */
        }
    },



    ready: function(func) {
        if (window.__isReady) {
            func()
        } else {
            if (!window.__readyList) {
                window.__readyList = [];
            }
            window.__readyList.push(func);
        }

        jah.bindReady();
    },
}

module.exports = jah;

}, mimetype: "application/javascript", remote: false}; // END: /__builtin__/index.js


__jah__.resources["/__builtin__/init.js"] = {data: function (exports, require, module, __filename, __dirname) {
if (!Object.keys) {
    /**
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
     */
    Object.keys = function(o) {
        if (o !== Object(o)) {
            throw new TypeError('Object.keys called on non-object');
        }
        var ret = []
          , p;
        for (p in o) {
            if (Object.prototype.hasOwnProperty.call(o,p)) {
                ret.push(p);
            }
        }
        return ret;
    };
}

if (!Object.create) {
    /**
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/create
     */
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}

if (!Function.prototype.bind) {
    /**
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
     */
    Function.prototype.bind = function (oThis) {

        if (typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");

        var aArgs = Array.prototype.slice.call(arguments, 1), 
            fToBind = this, 
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));    
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;

    };
}

if (!window.requestAnimationFrame) {
    /**
     * Provides requestAnimationFrame in a cross browser way.
     * @see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
     */
    window.requestAnimationFrame = ( function() {
        return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
            window.setTimeout( callback, 1000 / 60 );
        };
    } )();
}

}, mimetype: "application/javascript", remote: false}; // END: /__builtin__/init.js


__jah__.resources["/__builtin__/path.js"] = {data: function (exports, require, module, __filename, __dirname) {
/** @namespace */
var path = {
    /**
     * Returns full directory path for the filename given. The path must be formed using forward slashes '/'.
     *
     * @param {String} path Path to return the directory name of
     * @returns {String} Directory name
     */
    dirname: function(path) {
        var tokens = path.split('/');
        tokens.pop();
        return tokens.join('/');
    },

    /**
     * Returns just the filename portion of a path.
     *
     * @param {String} path Path to return the filename portion of
     * @returns {String} Filename
     */
    basename: function(path) {
        var tokens = path.split('/');
        return tokens[tokens.length-1];
    },

    /**
     * Joins multiple paths together to form a single path
     * @param {String} ... Any number of string arguments to join together
     * @returns {String} The joined path
     */
    join: function () {
        return module.exports.normalize(Array.prototype.join.call(arguments, "/"));
    },

    /**
     * Tests if a path exists
     *
     * @param {String} path Path to test
     * @returns {Boolean} True if the path exists, false if not
     */
    exists: function(path) {
        return (__jah__.resources[path] !== undefined);
    },

    /**
     * @private
     */
    normalizeArray: function (parts, keepBlanks) {
      var directories = [], prev;
      for (var i = 0, l = parts.length - 1; i <= l; i++) {
        var directory = parts[i];

        // if it's blank, but it's not the first thing, and not the last thing, skip it.
        if (directory === "" && i !== 0 && i !== l && !keepBlanks) continue;

        // if it's a dot, and there was some previous dir already, then skip it.
        if (directory === "." && prev !== undefined) continue;

        // if it starts with "", and is a . or .., then skip it.
        if (directories.length === 1 && directories[0] === "" && (
            directory === "." || directory === "..")) continue;

        if (
          directory === ".."
          && directories.length
          && prev !== ".."
          && prev !== "."
          && prev !== undefined
          && (prev !== "" || keepBlanks)
        ) {
          directories.pop();
          prev = directories.slice(-1)[0]
        } else {
          if (prev === ".") directories.pop();
          directories.push(directory);
          prev = directory;
        }
      }
      return directories;
    },

    /**
     * Returns the real path by expanding any '.' and '..' portions
     *
     * @param {String} path Path to normalize
     * @param {Boolean} [keepBlanks=false] Whether to keep blanks. i.e. double slashes in a path
     * @returns {String} Normalized path
     */
    normalize: function (path, keepBlanks) {
      return module.exports.normalizeArray(path.split("/"), keepBlanks).join("/");
    }
};

module.exports = path;

}, mimetype: "application/javascript", remote: false}; // END: /__builtin__/path.js


__jah__.resources["/__builtin__/preloader.js"] = {data: function (exports, require, module, __filename, __dirname) {
"use strict";

var events = require('events')
  , remotes = require('remote_resources')

function Preloader (items) {
    this.count = 0
    this.loaded = 0
    this.queue = []

    var listeners = {}

    if (items) {
        this.addToQueue(items)
    }

    var didLoadResource = function (ref) {
        this.loaded++

        // Must remove listener or we'll leak memory
        if (listeners[ref]) {
            events.removeListener(listeners[ref]);
        }
        events.trigger(this, 'load', this, ref);


        if (this.loaded >= this.count) {
            events.trigger(this, 'complete', this);
        }
    }.bind(this)

    this.load = function () {
        // Store number of callbacks we're expecting
        this.count += this.queue.length 

        var ref, i
        for (i=0; i<this.count; i++) {
            ref = this.queue[i]

            if (!__jah__.resources[ref]) {
                console.warn("Unable to preload non-existant file: ", ref)
                didLoadResource(ref)
                continue
            }
            if (!__jah__.resources[ref].remote || __jah__.resources[ref].loaded) {
                // Already loaded
                didLoadResource(ref)
                continue
            }
            var file = resource(ref)
              , callback = (function(ref) { return function () { didLoadResource(ref) } })(ref)

            if (file instanceof remotes.RemoteResource) {
                // Notify when a resource has loaded
                listeners[ref] = events.addListener(file, 'load', callback);

                file.load()
            } else {
                setTimeout(callback, 1)
            }
        }

        this.clearQueue()
    }
}

Preloader.prototype.addToQueue = function (items) {
    if (items instanceof Array) {
        // Update array in place incase something else has a reference to it
        for (var i=0; i<items.length; i++) {
            this.queue.push(items[i])
        }
    } else {
        this.queue.push(items)
    }
}

Preloader.prototype.addEverythingToQueue = function () {
    var items = []
    var key, res
    for (key in __jah__.resources) {
        if (__jah__.resources.hasOwnProperty(key)) {
            res = __jah__.resources[key]
            if (res.remote) {
                items.push(key)
            }
        }
    }

    if (items.length > 0) {
        this.addToQueue(items)
    }
}

Preloader.prototype.clearQueue = function () {
    this.queue.splice(0, this.queue.length)
}


exports.Preloader = Preloader;

}, mimetype: "application/javascript", remote: false}; // END: /__builtin__/preloader.js


__jah__.resources["/__builtin__/remote_resources.js"] = {data: function (exports, require, module, __filename, __dirname) {
"use strict"

var util = require('./index'),
    events = require('events')

function RemoteResource(url, path) {
    this.url = url
    this.path = path
}

/**
 * Load the remote resource via ajax
 */
RemoteResource.prototype.load = function () {
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            __jah__.resources[this.path].data = xhr.responseText
            __jah__.resources[this.path].loaded = true

            events.trigger(this, 'load', this)
        }
    }.bind(this)

    xhr.open('GET', this.url, true)  
    xhr.send(null)
}

function RemoteImage(url, path) {
    RemoteResource.apply(this, arguments)
}

RemoteImage.prototype = Object.create(RemoteResource.prototype)

RemoteImage.prototype.load = function () {
    var img = new Image()
    __jah__.resources[this.path].data = img

    img.onload = function () {
        __jah__.resources[this.path].loaded = true
        events.trigger(this, 'load', this)
    }.bind(this)

    img.onerror = function () {
        console.warn("Failed to load resource: [%s] from [%s]", this.path, img.src)
        __jah__.resources[this.path].loaded = true
        events.trigger(this, 'load', this)
    }.bind(this)
    
    img.src = this.url

    return img
}

function RemoteScript(url, path) {
    RemoteResource.apply(this, arguments)
}

RemoteScript.prototype = Object.create(RemoteResource.prototype)

RemoteScript.prototype.load = function () {
    var script = document.createElement('script')
    __jah__.resources[this.path].data = script

    script.onload = function () {
        __jah__.resources[this.path].loaded = true
        events.trigger(this, 'load', this)
    }.bind(this)

    script.src = this.url
    document.getElementsByTagName('head')[0].appendChild(script)

    return script
}

exports.getRemoteResource = function getRemoteResource(resourcePath) {
    var resource = __jah__.resources[resourcePath]

    if (!resource) {
        return null
    }

    if (resource.remoteResource) {
        return resource.remoteResource
    }

    var RemoteObj
      , mime = resource.mimetype.split('/')

    if (mime[0] == 'image') {
        RemoteObj = RemoteImage
    } else if(mime[1] == 'javascript') {
        RemoteObj = RemoteScript
    } else {
        RemoteObj = RemoteResource
    }

    resource.remoteResource = new RemoteObj(resource.data, resourcePath)

    return resource.remoteResource
}

exports.RemoteImage = RemoteImage
exports.RemoteResource = RemoteResource
exports.RemoteScript = RemoteScript


}, mimetype: "application/javascript", remote: false}; // END: /__builtin__/remote_resources.js


__jah__.resources["/__builtin__/system.js"] = {data: function (exports, require, module, __filename, __dirname) {
/** @namespace */
var system = {
    /** @namespace */
    stdio: {
        /**
         * Print text and objects to the debug console if the browser has one
         * 
         * @param {*} Any value to output
         */
        print: function() {
            if (console) {
                console.log.apply(console, arguments);
            } else {
                // TODO
            }
        }
    }
};

if (window.console) {
    system.console = window.console
} else {
    system.console = {
        log: function(){}
    }
}

}, mimetype: "application/javascript", remote: false}; // END: /__builtin__/system.js

/*globals module exports resource require window Module __main_module_name__ */
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
(function(){
"use strict";

var __main_module_name__ = '/main'

var process = {}
  , modulePaths = ['/__builtin__', '/__builtin__/libs', '/libs']
  , path; // path module, we will load this later

window.resource = function(resourcePath) {
    var remotes = require('remote_resources')

    var res = __jah__.resources[resourcePath]
    if (!res) {
        throw new Error("Unable to find resource: " + resourcePath);
    }

    if (res.remote && !res.loaded) {
        return remotes.getRemoteResource(resourcePath)
    }

    return res.data
}

function resolveModulePath(request, parent) {
    // If not a relative path then search the modulePaths for it
    var start = request.substring(0, 2);
    if (start !== "./" && start !== "..") {
        return modulePaths;
    }

    var parentIsIndex = path.basename(parent.filename).match(/^index\.js$/),
        parentPath    = parentIsIndex ? parent.id : path.dirname(parent.id);

    // Relative path so searching inside parent's directory
    return [path.dirname(parent.filename)];
}

function findModulePath(id, dirs) {
    if (id.charAt(0) === '/') {
        dirs = [''];
    }
    for (var i = 0; i < dirs.length; i++) {
        var dir = dirs[i];
        var p = path.join(dir, id);

        // Check for index first
        if (path.exists(path.join(p, 'index.js'))) {
            return path.join(p, 'index.js');
        } else if (path.exists(p + '.js')) {
            return p + '.js';
        }
    }

    return false;
}

function loadModule(request, parent) {
    parent = parent || process.mainModule;

    var paths    = resolveModulePath(request, parent),
        filename = findModulePath(request, paths);

    if (filename === false) {
        throw new Error("Unable to find module: " + request);
    }


    if (parent) {
        var cachedModule = parent.moduleCache[filename];
        if (cachedModule) {
            return cachedModule;
        }
    }

    //console.log('Loading module: ', filename);

    var module = new Module(filename, parent);

    // Assign main module to process
    if (request == __main_module_name__ && !process.mainModule) {
        process.mainModule = module;
    }

    // Run all the code in the module
    module._initialize(filename);

    return module;
}

function Module(id, parent) {
    this.id = id;
    this.parent = parent;
    this.children = [];
    this.exports = {};

    if (parent) {
        this.moduleCache = parent.moduleCache;
        parent.children.push(this);
    } else {
        this.moduleCache = {};
    }
    this.moduleCache[this.id] = this;

    this.filename = null;
    this.dirname = null;
}

Module.prototype._initialize = function (filename) {
    var module = this;
    function require(request) {
        return loadModule(request, module).exports;
    }

    this.filename = filename;

    // Work around incase this IS the path module
    if (path) {
        this.dirname = path.dirname(filename);
    } else {
        this.dirname = '';
    }

    require.paths = modulePaths;
    require.main = process.mainModule;

    var mod = __jah__.resources[this.filename]
    if (mod) {
      mod.data.apply(this.exports, [this.exports, require, this, this.filename, this.dirname]);
    } else {
      throw new Error("Unable to find module: " + this.filename)
    }

    return this;
};

// Manually load the path module because we need it to load other modules
path = (new Module('path'))._initialize('/__builtin__/path.js').exports;

var util = loadModule('/__builtin__/').exports;

// Browser's DOM is ready for action
util.ready(function () {

    // Add a global require. Useful in the debug console.
    window.require = function require(request, parent) {
        return loadModule(request, parent).exports;
    };
    window.require.paths = modulePaths;

    // Initialise the libs
    var key, lib
    for (key in __jah__.resources) {
        if (__jah__.resources.hasOwnProperty(key)) {
            // If matches /libs/<foo>/init.js then run foo.main()
            if (/^\/libs\/[^\/]+?\/init.js$/.test(key) || key == '/__builtin__/init.js') {
                lib = loadModule(key.replace(/\.js$/, '')).exports
                if (typeof lib.main == 'function') {
                    lib.main()
                }
            }
        }
    }

    // Initialise the main module
    process.mainModule = loadModule(__main_module_name__);
    window.require.main = process.mainModule;

    // Run application's main function
    if (process.mainModule.exports.main) {
        process.mainModule.exports.main();
    }
});

})()
// vim:ft=javascript

})();