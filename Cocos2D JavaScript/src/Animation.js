/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util');

var Animation = BObject.extend(/** @lends cocos.Animation# */{
    name: null,
    delay: 0.0,
    frames: null,

    /** 
     * A cocos.Animation object is used to perform animations on the Sprite objects.
     * 
     * The Animation object contains cocos.SpriteFrame objects, and a possible delay between the frames.
     * You can animate a cocos.Animation object by using the cocos.actions.Animate action.
     * 
     * @memberOf cocos
     * @constructs
     * @extends BObject
     *
     * @opt {cocos.SpriteFrame[]} frames Frames to animate
     * @opt {Float} [delay=0.0] Delay between each frame
     * 
     * @example
     * var animation = cocos.Animation.create({frames: [f1, f2, f3], delay: 0.1});
     * sprite.runAction(cocos.actions.Animate.create({animation: animation}));
     */
    init: function (opts) {
        Animation.superclass.init.call(this, opts);

        this.frames = opts.frames || [];
        this.delay  = opts.delay  || 0.0;
    }
});

exports.Animation = Animation;
