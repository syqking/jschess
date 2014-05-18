/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    Plist = require('Plist').Plist;

var AnimationCache = BObject.extend(/** @lends cocos.AnimationCache# */{
    /**
     * Cached animations
     * @type Object
     */
    animations: null,

    /**
     * @memberOf cocos
     * @constructs
     * @extends BObject
     * @singleton
     */
    init: function () {
        AnimationCache.superclass.init.call(this);

        this.set('animations', {});
    },

    /**
     * Add an animation to the cache
     *
     * @opt {String} name Unique name of the animation
     * @opt {cocos.Animcation} animation Animation to cache
     */
    addAnimation: function (opts) {
        var name = opts.name,
            animation = opts.animation;

        this.get('animations')[name] = animation;
    },

    /**
     * Remove an animation from the cache
     *
     * @opt {String} name Unique name of the animation
     */
    removeAnimation: function (opts) {
        var name = opts.name;

        delete this.get('animations')[name];
    },

    /**
     * Get an animation from the cache
     *
     * @opt {String} name Unique name of the animation
     * @returns {cocos.Animation} Cached animation
     */
    getAnimation: function (opts) {
        var name = opts.name;

        return this.get('animations')[name];
    }
});

/**
 * Class methods
 */
util.extend(AnimationCache, /** @lends cocos.AnimationCache */{
    /**
     * @getter sharedAnimationCache
     * @type cocos.AnimationCache
     */
    get_sharedAnimationCache: function (key) {
        if (!this._instance) {
            this._instance = this.create();
        }

        return this._instance;
    }
});

exports.AnimationCache = AnimationCache;
