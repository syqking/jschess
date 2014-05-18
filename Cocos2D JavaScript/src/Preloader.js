/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    events = require('events');

var Preloader = BObject.extend(/** @lends cocos.Preloader# */{
    /**
     * Total number of resources.
     * @type Integer
     */
    count: -1,

    /**
     * Number of resources that have finished loading
     * @type Integer
     */
    loaded: 0,

    _listeners: null,

    /**
     * @class Preloads all remote resources
     * @memberOf cocos
     * @extends BObject
     * @constructs
     */
    init: function (opts) {
        Preloader.superclass.init.call(this, opts);

        this._listeners = {};
        this.set('count', Object.keys(__remote_resources__).length);
    },

    load: function() {
        this.set('loaded', 0);
        this.set('count', Object.keys(__remote_resources__).length);

        for (var uri in __remote_resources__) {
            if (__remote_resources__.hasOwnProperty(uri)) {
                if (__resources__[uri]) {
                    // Already loaded
                    this.didLoadResource(uri);
                    continue;
                }
                var file = resource(uri);

                // Notify when a resource has loaded
                this._listeners[uri] = events.addListener(file, 'load', util.callback(this, (function(uri) {
                    return function () { this.didLoadResource(uri); };
                })(uri)));

                file.load()
            }
        }
    },
    
    didLoadResource: function(uri) {
        this.set('loaded', this.get('loaded') +1);
        if (this._listeners[uri]) {
            events.removeListener(this._listeners[uri]);
        }
        events.trigger(this, 'load', uri, this);

        if (this.get('loaded') >= this.get('count')) {
            events.trigger(this, 'complete', this);
        }
    }
});

exports.Preloader = Preloader;
