/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    act = require('./Action'),
    ccp = require('geometry').ccp;

var ActionInstant = act.FiniteTimeAction.extend(/** @lends cocos.actions.ActionInstant */{
    /**
     * @class Base class for actions that triggers instantly. They have no duration.
     *
     * @memberOf cocos.actions
     * @extends cocos.actions.FiniteTimeAction
     * @constructs
     */
    init: function (opts) {
        ActionInstant.superclass.init.call(this, opts);

        this.duration = 0;
    },
    
    get_isDone: function () {
        return true;
    },
    
    step: function (dt) {
        this.update(1);
    },
    
    update: function (t) {
        // ignore
    },
    
    copy: function() {
        return this;
    },
    
    reverse: function () {
        return this.copy();
    }
});

/** 
 * @class Show a node
 *
 * @memberOf cocos.actions
 * @extends cocos.actions.ActionInstant
 */
var Show = ActionInstant.extend(/** @lends cocos.actions.Show# */{
    startWithTarget: function(target) {
        Show.superclass.startWithTarget.call(this, target);
        this.target.set('visible', true);
    },

    copy: function() {
        return Show.create();
    },
    
    reverse: function() {
        return exports.Hide.create();
    }
});

/** 
 * @class Hide a node
 *
 * @memberOf cocos.actions
 * @extends cocos.actions.ActionInstant
 */
var Hide = ActionInstant.extend(/** @lends cocos.actions.Hide# */{
    startWithTarget: function(target) {
        Hide.superclass.startWithTarget.call(this, target);
        this.target.set('visible', false);
    },

    copy: function() {
        return Hide.create();
    },
    
    reverse: function() {
        return exports.Show.create();
    }
});

/** 
 * @class Toggles the visibility of a node
 *
 * @memberOf cocos.actions
 * @extends cocos.actions.ActionInstant
 */
var ToggleVisibility = ActionInstant.extend(/** @lends cocos.actions.ToggleVisibility# */{
    startWithTarget: function(target) {
        ToggleVisibility.superclass.startWithTarget.call(this, target);
        var vis = this.target.get('visible');
        this.target.set('visible', !vis);
    },
    
    copy: function() {
        return ToggleVisibility.create();
    }
});

var FlipX = ActionInstant.extend(/** @lends cocos.actions.FlipX# */{
    flipX: false,

    /**
     * @class Flips a sprite horizontally
     *
     * @memberOf cocos.actions
     * @extends cocos.actions.ActionInstant
     * @constructs
     *
     * @opt {Boolean} flipX Should the sprite be flipped
     */
    init: function (opts) {
        FlipX.superclass.init.call(this, opts);

        this.flipX = opts.flipX;
    },
    
    startWithTarget: function (target) {
        FlipX.superclass.startWithTarget.call(this, target);

        target.set('flipX', this.flipX);
    },
    
    reverse: function () {
        return FlipX.create({flipX: !this.flipX});
    },
    
    copy: function () {
        return FlipX.create({flipX: this.flipX});
    }
});

var FlipY = ActionInstant.extend(/** @lends cocos.actions.FlipY# */{
    flipY: false,

    /**
     * @class Flips a sprite vertically
     *
     * @memberOf cocos.actions
     * @extends cocos.actions.ActionInstant
     * @constructs
     *
     * @opt {Boolean} flipY Should the sprite be flipped
     */
    init: function (opts) {
        FlipY.superclass.init.call(this, opts);

        this.flipY = opts.flipY;
    },
    
    startWithTarget: function (target) {
        FlipY.superclass.startWithTarget.call(this, target);

        target.set('flipY', this.flipY);
    },
    
    reverse: function () {
        return FlipY.create({flipY: !this.flipY});
    },
    
    copy: function () {
        return FlipY.create({flipY: this.flipY});
    }
});

var Place = ActionInstant.extend(/** @lends cocos.actions.Place# */{
    position: null,
    
    /**
     * @class Places the node in a certain position
     *
     * @memberOf cocos.actions
     * @extends cocos.actions.ActionInstant
     * @constructs
     *
     * @opt {geometry.Point} position
     */
    init: function(opts) {
        Place.superclass.init.call(this, opts);
        this.set('position', util.copy(opts.position));
    },
    
    startWithTarget: function(target) {
        Place.superclass.startWithTarget.call(this, target);
        this.target.set('position', this.position);
    },
    
    copy: function() {
        return Place.create({position: this.position});
    }
});

var CallFunc = ActionInstant.extend(/** @lends cocos.actions.CallFunc# */{
    callback: null,
    target: null,
    method: null,
    
    /**
     * @class Calls a 'callback'
     *
     * @memberOf cocos.actions
     * @extends cocos.actions.ActionInstant
     * @constructs
     *
     * @opt {BObject} target
     * @opt {String|Function} method
     */
    init: function(opts) {
        CallFunc.superclass.init.call(this, opts);
        
        // Save target & method so that copy() can recreate callback
        this.target = opts.target;
        this.method = opts.method;
        this.callback = util.callback(this.target, this.method);
    },
    
    startWithTarget: function(target) {
        CallFunc.superclass.startWithTarget.call(this, target);
        this.execute(target);
    },
    
    execute: function(target) {
        // Pass target to callback
        this.callback.call(this, target);
    },
    
    copy: function() {
        return CallFunc.create({target: this.target, method: this.method});
    }
});

exports.ActionInstant = ActionInstant;
exports.Show = Show;
exports.Hide = Hide;
exports.ToggleVisibility = ToggleVisibility;
exports.FlipX = FlipX;
exports.FlipY = FlipY;
exports.Place = Place;
exports.CallFunc = CallFunc;

