/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    act = require('./Action'),
    geo = require('geometry'),
    ccp = geo.ccp;


var ActionInterval = act.FiniteTimeAction.extend(/** @lends cocos.actions.ActionInterval# */{
    /**
     * Number of seconds that have elapsed
     * @type Float
     */
    elapsed: 0.0,

    _firstTick: true,

    /**
     * Base class actions that do have a finite time duration.
     *
     * Possible actions:
     *
     * - An action with a duration of 0 seconds
     * - An action with a duration of 35.5 seconds Infinite time actions are valid
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.FiniteTimeAction
     *
     * @opt {Float} duration Number of seconds to run action for
     */
    init: function (opts) {
        ActionInterval.superclass.init.call(this, opts);

        var dur = opts.duration || 0;
        if (dur === 0) {
            dur = 0.0000001;
        }

        this.set('duration', dur);
        this.set('elapsed', 0);
        this._firstTick = true;
    },

    get_isDone: function () {
        return (this.elapsed >= this.duration);
    },

    step: function (dt) {
        if (this._firstTick) {
            this._firstTick = false;
            this.elapsed = 0;
        } else {
            this.elapsed += dt;
        }

        this.update(Math.min(1, this.elapsed / this.duration));
    },

    startWithTarget: function (target) {
        ActionInterval.superclass.startWithTarget.call(this, target);

        this.elapsed = 0.0;
        this._firstTick = true;
    },

    copy: function() {
        throw "copy() not implemented";
    },
    
    reverse: function () {
        throw "Reverse Action not implemented";
    }
});

var DelayTime = ActionInterval.extend(/** @lends cocos.actions.DelayTime# */{
    /**
     * @class DelayTime Delays the action a certain amount of seconds
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     */
    update: function (t) {
        if (t === 1.0) {
            this.stop();
        }
    },

    copy: function () {
        return DelayTime.create({duration: this.get('duration')});
    },

    reverse: function () {
        return DelayTime.create({duration: this.get('duration')});
    }
});


var ScaleTo = ActionInterval.extend(/** @lends cocos.actions.ScaleTo# */{
    /**
     * Current X Scale
     * @type Float
     */
    scaleX: 1,

    /**
     * Current Y Scale
     * @type Float
     */
    scaleY: 1,

    /**
     * Initial X Scale
     * @type Float
     */
    startScaleX: 1,

    /**
     * Initial Y Scale
     * @type Float
     */
    startScaleY: 1,

    /**
     * Final X Scale
     * @type Float
     */
    endScaleX: 1,

    /**
     * Final Y Scale
     * @type Float
     */
    endScaleY: 1,

    /**
     * Delta X Scale
     * @type Float
     * @private
     */
    deltaX: 0.0,

    /**
     * Delta Y Scale
     * @type Float
     * @private
     */
    deltaY: 0.0,

    /**
     * @class ScaleTo Scales a cocos.Node object to a zoom factor by modifying it's scale attribute.
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {Float} [scale] Size to scale Node to
     * @opt {Float} [scaleX] Size to scale width of Node to
     * @opt {Float} [scaleY] Size to scale height of Node to
     */
    init: function (opts) {
        ScaleTo.superclass.init.call(this, opts);

        if (opts.scale !== undefined) {
            this.endScaleX = this.endScaleY = opts.scale;
        } else {
            this.endScaleX = opts.scaleX;
            this.endScaleY = opts.scaleY;
        }


    },

    startWithTarget: function (target) {
        ScaleTo.superclass.startWithTarget.call(this, target);

        this.startScaleX = this.target.get('scaleX');
        this.startScaleY = this.target.get('scaleY');
        this.deltaX = this.endScaleX - this.startScaleX;
        this.deltaY = this.endScaleY - this.startScaleY;
    },

    update: function (t) {
        if (!this.target) {
            return;
        }

        this.target.set('scaleX', this.startScaleX + this.deltaX * t);
        this.target.set('scaleY', this.startScaleY + this.deltaY * t);
    },

    copy: function () {
        return ScaleTo.create({duration: this.get('duration'),
                                 scaleX: this.get('endScaleX'),
                                 scaleY: this.get('endScaleY')});
    }
});

var ScaleBy = ScaleTo.extend(/** @lends cocos.actions.ScaleBy# */{
    /**
     * @class ScaleBy Scales a cocos.Node object to a zoom factor by modifying it's scale attribute.
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ScaleTo
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {Float} [scale] Size to scale Node by
     * @opt {Float} [scaleX] Size to scale width of Node by
     * @opt {Float} [scaleY] Size to scale height of Node by
     */
    init: function (opts) {
        ScaleBy.superclass.init.call(this, opts);
    },

    startWithTarget: function (target) {
        ScaleBy.superclass.startWithTarget.call(this, target);

        this.deltaX = this.startScaleX * this.endScaleX - this.startScaleX;
        this.deltaY = this.startScaleY * this.endScaleY - this.startScaleY;
    },

    reverse: function () {
        return ScaleBy.create({duration: this.get('duration'), scaleX: 1 / this.endScaleX, scaleY: 1 / this.endScaleY});
    }
});


var RotateTo = ActionInterval.extend(/** @lends cocos.actions.RotateTo# */{
    /**
     * Final angle
     * @type Float
     */
    dstAngle: 0,

    /**
     * Initial angle
     * @type Float
     */
    startAngle: 0,

    /**
     * Angle delta
     * @type Float
     */
    diffAngle: 0,

    /**
     * @class RotateTo Rotates a cocos.Node object to a certain angle by modifying its rotation
     * attribute. The direction will be decided by the shortest angle.
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {Float} angle Angle in degrees to rotate to
     */
    init: function (opts) {
        RotateTo.superclass.init.call(this, opts);

        this.dstAngle = opts.angle;
    },

    startWithTarget: function (target) {
        RotateTo.superclass.startWithTarget.call(this, target);

        this.startAngle = target.get('rotation');

        if (this.startAngle > 0) {
            this.startAngle = (this.startAngle % 360);
        } else {
            this.startAngle = (this.startAngle % -360);
        }

        this.diffAngle = this.dstAngle - this.startAngle;
        if (this.diffAngle > 180) {
            this.diffAngle -= 360;
        } else if (this.diffAngle < -180) {
            this.diffAngle += 360;
        }
    },

    update: function (t) {
        this.target.set('rotation', this.startAngle + this.diffAngle * t);
    },

    copy: function () {
        return RotateTo.create({duration: this.get('duration'), angle: this.get('dstAngle')});
    }
});

var RotateBy = RotateTo.extend(/** @lends cocos.actions.RotateBy# */{
    /**
     * Number of degrees to rotate by
     * @type Float
     */
    angle: 0,

    /**
     * @class RotateBy Rotates a cocos.Node object to a certain angle by modifying its rotation
     * attribute. The direction will be decided by the shortest angle.
     *
     * @memberOf cocos.action
     * @constructs
     * @extends cocos.actions.RotateTo
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {Float} angle Angle in degrees to rotate by
     */
    init: function (opts) {
        RotateBy.superclass.init.call(this, opts);

        this.angle = opts.angle;
    },

    startWithTarget: function (target) {
        RotateBy.superclass.startWithTarget.call(this, target);

        this.startAngle = this.target.get('rotation');
    },

    update: function (t) {
        this.target.set('rotation', this.startAngle + this.angle * t);
    },

    copy: function () {
        return RotateBy.create({duration: this.get('duration'), angle: this.angle});
    },
    
    reverse: function () {
        return RotateBy.create({duration: this.get('duration'), angle: -this.angle});
    }
});

var MoveTo = ActionInterval.extend(/** @lends cocos.actions.MoveTo# */{
    delta: null,
    startPosition: null,
    endPosition: null,

    /**
     * @class MoveTo Animates moving a cocos.nodes.Node object to a another point.
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {geometry.Point} position Destination position
     */
    init: function (opts) {
        MoveTo.superclass.init.call(this, opts);

        this.set('endPosition', util.copy(opts.position));
    },

    startWithTarget: function (target) {
        MoveTo.superclass.startWithTarget.call(this, target);

        this.set('startPosition', util.copy(target.get('position')));
        this.set('delta', geo.ccpSub(this.get('endPosition'), this.get('startPosition')));
    },

    update: function (t) {
        var startPosition = this.get('startPosition'),
            delta = this.get('delta');
        this.target.set('position', ccp(startPosition.x + delta.x * t, startPosition.y + delta.y * t));
    },
    
    copy: function() {
        return MoveTo.create({duration: this.get('duration'), position: this.get('endPosition')});
    }
});

var MoveBy = MoveTo.extend(/** @lends cocos.actions.MoveBy# */{
    /**
     * @class MoveBy Animates moving a cocos.node.Node object by a given number of pixels
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.MoveTo
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {geometry.Point} position Number of pixels to move by
     */
    init: function (opts) {
        MoveBy.superclass.init.call(this, opts);

        this.set('delta', util.copy(opts.position));
    },

    startWithTarget: function (target) {
        var dTmp = this.get('delta');
        MoveBy.superclass.startWithTarget.call(this, target);
        this.set('delta', dTmp);
    },
    
    copy: function() {
         return MoveBy.create({duration: this.get('duration'), position: this.get('delta')});
    },
    
    reverse: function() {
        var delta = this.get('delta');
        return MoveBy.create({duration: this.get('duration'), position: geo.ccp(-delta.x, -delta.y)});
    }
});

var JumpBy = ActionInterval.extend(/** @lends cocos.actions.JumpBy# */{
    /**
     * Number of pixels to jump by
     * @type geometry.Point
     */
    delta: null,
    
    /**
     * Height of jump
     * @type Float
     */
    height: 0,
    
    /**
     * Number of times to jump
     * @type Integer
     */
    jumps: 0,
    
    /**
     * Starting point
     * @type geometry.Point
     */
    startPosition: null,
    
    /**
     * @class JumpBy Moves a CCNode object simulating a parabolic jump movement by modifying it's position attribute.
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {geometry.Point} startPosition Point at which jump starts
     * @opt {geometry.Point} delta Number of pixels to jump by
     * @opt {Float} height Height of jump
     * @opt {Int} jumps Number of times to repeat
     */
    init: function(opts) {
        JumpBy.superclass.init.call(this, opts);
        
        this.delta  = util.copy(opts.delta);
        this.height = opts.height;
        this.jumps  = opts.jumps;
    },
    
    copy: function() {
        return JumpBy.create({duration: this.duration, 
                                 delta: this.delta,
                                height: this.height,
                                 jumps: this.jumps});
    },
    
    startWithTarget: function(target) {
        JumpBy.superclass.startWithTarget.call(this, target);
        this.set('startPosition', target.get('position'));
    },
    
    update: function(t) {
        // parabolic jump
        var frac = (t * this.jumps) % 1.0;
        var y = this.height * 4 * frac * (1 - frac);
        y += this.delta.y * t;
        var x = this.delta.x * t;
        this.target.set('position', geo.ccp(this.startPosition.x + x, this.startPosition.y + y));
    },
    
    reverse: function() {
        return JumpBy.create({duration: this.duration,
                                 delta: geo.ccp(-this.delta.x, -this.delta.y),
                                height: this.height,
                                 jumps: this.jumps});
    }
});

/**
 * @class Moves a Node to a parabolic position simulating a jump movement by modifying its position attribute.
 *
 * @memberOf cocos.actions
 * @extends cocos.actions.JumpBy
 */
var JumpTo = JumpBy.extend(/** @lends cocos.actions.JumpTo# */{
    startWithTarget: function(target) {
        JumpTo.superclass.startWithTarget.call(this, target);
        this.delta = geo.ccp(this.delta.x - this.startPosition.x, this.delta.y - this.startPosition.y);
    }
});

var BezierBy = ActionInterval.extend(/** @lends cocos.actions.BezierBy# */{
    /**
     * @type {geometry.BezierConfig}
     */
    config: null,
    
    startPosition: null,
    
    /**
     * @class An action that moves the target with a cubic Bezier curve by a certain distance.
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {geometry.BezierConfig} bezier Bezier control points object
     * @opt {Float} duration
     */
    init: function(opts) {
        BezierBy.superclass.init.call(this, opts);
        
        this.config = util.copy(opts.bezier);
    },
    
    startWithTarget: function(target) {
        BezierBy.superclass.startWithTarget.call(this, target);
        this.set('startPosition', this.target.get('position'));
    },
    
    update: function(t) {
        var c = this.get('config');
        var xa = 0,
            xb = c.controlPoint1.x,
            xc = c.controlPoint2.x,
            xd = c.endPosition.x,
            ya = 0,
            yb = c.controlPoint1.y,
            yc = c.controlPoint2.y,
            yd = c.endPosition.y;
        
        var x = BezierBy.bezierat(xa, xb, xc, xd, t);
        var y = BezierBy.bezierat(ya, yb, yc, yd, t);
        
        this.target.set('position', geo.ccpAdd(this.get('startPosition'), geo.ccp(x, y)));
    },
    
    copy: function() {
        return BezierBy.create({bezier: this.get('config'), duration: this.get('duration')});
    },
    
    reverse: function() {
        var c = this.get('config'),
            bc = new geo.BezierConfig();
            
        bc.endPosition = geo.ccpNeg(c.endPosition);
        bc.controlPoint1 = geo.ccpAdd(c.controlPoint2, geo.ccpNeg(c.endPosition));
        bc.controlPoint2 = geo.ccpAdd(c.controlPoint1, geo.ccpNeg(c.endPosition));
        
        return BezierBy.create({bezier: bc, duration: this.get('duration')});
    }
});

util.extend(BezierBy, /** @lends cocos.actions.BezierBy */{
    /**
     * Bezier cubic formula
     * ((1 - t) + t)3 = 1 
     */
    bezierat: function(a, b, c, d, t) {
       return Math.pow(1-t, 3) * a + 
            3 * t * Math.pow(1-t, 2) * b +
            3 * Math.pow(t, 2) * (1 - t) * c +
            Math.pow(t, 3) * d;
    }
});

/**
 * @class An action that moves the target with a cubic Bezier curve to a destination point.
 *
 * @memberOf cocos.actions
 * @extends cocos.actions.BezierBy
 */
var BezierTo = BezierBy.extend(/** @lends cocos.actions.BezierTo# */{
    startWithTarget: function(target) {
        BezierTo.superclass.startWithTarget.call(this, target);
        
        var c = this.get('config');
        c.controlPoint1 = geo.ccpSub(c.controlPoint1, this.get('startPosition'));
        c.controlPoint2 = geo.ccpSub(c.controlPoint2, this.get('startPosition'));
        c.endPosition = geo.ccpSub(c.endPosition, this.get('startPosition'));
    }
});

var Blink = ActionInterval.extend(/** @lends cocos.actions.Blink# */{
    /**
     * @type {Integer}
     */
    times: 1,
    
    /**
     * @class Blinks a Node object by modifying it's visible attribute
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opts {Integer} blinks Number of times to blink
     * @opts {Float} duration
     */
    init: function(opts) {
        Blink.superclass.init.call(this, opts);
        this.times = opts.blinks;
    },
    
    update: function(t) {
        if (! this.get_isDone()) {
            var slice = 1 / this.times;
            var m = t % slice;
            this.target.set('visible', (m > slice/2));
        }
    },
    
    copy: function() {
        return Blink.create({duration: this.get('duration'), blinks: this.get('times')});
    },
    
    reverse: function() {
        return this.copy();
    }
});

/**
 * @class Fades out a cocos.nodes.Node to zero opacity
 *
 * @memberOf cocos.actions
 * @extends cocos.actions.ActionInterval
 */     
var FadeOut = ActionInterval.extend(/** @lends cocos.actions.FadeOut# */{
    update: function (t) {
        var target = this.get('target');
        if (!target) return;
        target.set('opacity', 255 - (255 * t));
    },

    copy: function () {
        return FadeOut.create({duration: this.get('duration')});
    },
    
    reverse: function () {
        return exports.FadeIn.create({duration: this.get('duration')});
    }
});


/**
 * @class Fades in a cocos.nodes.Node to 100% opacity
 *
 * @memberOf cocos.actions
 * @extends cocos.actions.ActionInterval
 */
var FadeIn = ActionInterval.extend(/** @lends cocos.actions.FadeIn# */{
    update: function (t) {
        var target = this.get('target');
        if (!target) return;
        target.set('opacity', t * 255);
    },

    copy: function () {
        return FadeIn.create({duration: this.get('duration')});
    },
    
    reverse: function () {
        return exports.FadeOut.create({duration: this.get('duration')});
    }
});

var FadeTo = ActionInterval.extend(/** @lends cocos.actions.FadeTo# */{
    /**
     * The final opacity
     * @type Float
     */
    toOpacity: null,

    /**
     * The initial opacity
     * @type Float
     */
    fromOpacity: null,

    /**
     * @class Fades a cocos.nodes.Node to a given opacity
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     */
    init: function (opts) {
        FadeTo.superclass.init.call(this, opts);
        this.set('toOpacity', opts.toOpacity);
    },

    startWithTarget: function (target) {
        FadeTo.superclass.startWithTarget.call(this, target);
        this.set('fromOpacity', this.target.get('opacity'));
    },

    update: function (t) {
        var target = this.get('target');
        if (!target) return;

        target.set('opacity', this.fromOpacity + ( this.toOpacity - this.fromOpacity ) * t);
    },
    
    copy: function() {
        return FadeTo.create({duration: this.get('duration'), toOpacity: this.get('toOpacity')});
    }
});

var Sequence = ActionInterval.extend(/** @lends cocos.actions.Sequence# */{
    /**
     * Array of actions to run
     * @type cocos.nodes.Node[]
     */
    actions: null,

    split: 0,
    last: 0,
    
    /**
     * @class Runs a pair of actions sequentially, one after another
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {cocos.actions.FiniteTimeAction} one 1st action to run
     * @opt {cocos.actions.FiniteTimeAction} two 2nd action to run
     */
    init: function (opts) {
        if (!opts.one) {
            throw "Sequence argument one must be non-nil";
        }
        if (!opts.two) {
            throw "Sequence argument two must be non-nil";
        }
        this.actions = [];
        
        var d = opts.one.get('duration') + opts.two.get('duration');
        
        Sequence.superclass.init.call(this, {duration: d});
        
        this.actions[0] = opts.one;
        this.actions[1] = opts.two;
    },
    
    startWithTarget: function (target) {
        Sequence.superclass.startWithTarget.call(this, target);
        this.split = this.actions[0].get('duration') / this.get('duration');
        this.last = -1;
    },

    stop: function () {
        this.actions[0].stop();
        this.actions[1].stop();
        Sequence.superclass.stop.call(this);
    },

    update: function (t) {
        // This is confusing but will hopefully work better in conjunction
        // with modifer actions like Repeat & Spawn...
        var found = 0;
        var new_t = 0;
        
        if (t >= this.split) {
            found = 1;
            if (this.split == 1) {
                new_t = 1;
            } else {
                new_t = (t - this.split) / (1 - this.split);
            }
        } else {
            found = 0;
            if (this.split != 0) {
                new_t = t / this.split;
            } else {
                new_t = 1;
            }
        }
        if (this.last == -1 && found == 1) {
            this.actions[0].startWithTarget(this.target);
            this.actions[0].update(1);
            this.actions[0].stop();
        }
        if (this.last != found) {
            if (this.last != -1) {
                this.actions[this.last].update(1);
                this.actions[this.last].stop();
            }
            this.actions[found].startWithTarget(this.target);
        }
        this.actions[found].update(new_t);
        this.last = found;
    },

    copy: function () {
        // Constructor will copy actions 
        return Sequence.create({actions: this.get('actions')});
    },

    reverse: function() {
        return Sequence.create({actions: [this.actions[1].reverse(), this.actions[0].reverse()]});
    }
});

util.extend(Sequence, /** @lends cocos.actions.Sequence */{
    /** 
     * Override BObject.create in order to implement recursive construction
     * of actions array
     */
    create: function() {
        // Don't copy actions array, copy the actions
        var actions = arguments[0].actions;
        var prev = actions[0].copy();
        
        // Recursively create Sequence with pair of actions
        for (var i=1; i<actions.length; i++) {
            var now = actions[i].copy();
            if (now) {
                prev = new this({one: prev, two: now});;
            } else {
                break;
            }
        }
        return prev;
    }
});

var Repeat = ActionInterval.extend(/** @lends cocos.actions.Repeat# */{
    times: 1,
    total: 0,
    other: null,
    
    /**
     * @class Repeats an action a number of times.
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {cocos.actions.FiniteTimeAction} action Action to repeat
     * @opt {Number} times Number of times to repeat
     */
     init: function(opts) {
         var d = opts.action.get('duration') * opts.times;

         Repeat.superclass.init.call(this, {duration: d});
         
         this.times = opts.times;
         this.other = opts.action.copy();
         this.total = 0;
     },
     
     startWithTarget: function(target) {
         this.total = 0;
         Repeat.superclass.startWithTarget.call(this, target);
         this.other.startWithTarget(target);
     },
     
     stop: function() {
         this.other.stop();
         Repeat.superclass.stop.call(this);
     },
     
     update: function(dt) {
         var t = dt * this.times;
         
         if (t > (this.total+1)) {
             this.other.update(1);
             this.total += 1;
             this.other.stop();
             this.other.startWithTarget(this.target);
             
             // If repeat is over
             if (this.total == this.times) {
                 // set it in the original position
                 this.other.update(0);
             } else {
                 // otherwise start next repeat
                 this.other.update(t - this.total);
             }
         } else {
             var r = t % 1.0;
             
             // fix last repeat position otherwise it could be 0
             if (dt == 1) {
                 r = 1;
                 this.total += 1;
             }
             this.other.update(Math.min(r, 1));
         }
     },
     
     get_isDone: function() {
         return this.total == this.times;
     },
     
     copy: function() {
         // Constructor copies action
         return Repeat.create({action: this.other, times: this.times});
     },
     
     reverse: function() {
         return Repeat.create({action: this.other.reverse(), times: this.times});
     }
});

var Spawn = ActionInterval.extend(/** @lends cocos.actions.Spawn# */{
    one: null,
    two: null,

    /**
     * @class Executes multiple actions simultaneously
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {cocos.actions.FiniteTimeAction} one: first action to spawn
     * @opt {cocos.actions.FiniteTimeAction} two: second action to spawn
     */
    init: function (opts) {
        var action1 = opts.one, 
            action2 = opts.two;
            
        if (!action1 || !action2) {
            throw "cocos.actions.Spawn: required actions missing";
        }
        var d1 = action1.get('duration'), 
            d2 = action2.get('duration');
        
        Spawn.superclass.init.call(this, {duration: Math.max(d1, d2)});
        
        this.set('one', action1);
        this.set('two', action2);
        
        if (d1 > d2) {
            this.set('two', Sequence.create({actions: [
                action2, 
                DelayTime.create({duration: d1-d2})
            ]}));
        } else if (d1 < d2) {
            this.set('one', Sequence.create({actions: [
                action1,
                DelayTime.create({duration: d2-d1})
            ]}));
        }
    },
    
    startWithTarget: function (target) {
        Spawn.superclass.startWithTarget.call(this, target);
        this.get('one').startWithTarget(this.target);
        this.get('two').startWithTarget(this.target);
    },
    
    stop: function () {
        this.get('one').stop();
        this.get('two').stop();
        Spawn.superclass.stop.call(this);
    },
    
    step: function (dt) {
        if (this._firstTick) {
            this._firstTick = false;
            this.elapsed = 0;
        } else {
            this.elapsed += dt;
        }
        this.get('one').step(dt);
        this.get('two').step(dt);
    },
    
    update: function (t) {
        this.get('one').update(t);
        this.get('two').update(t);
    },
    
    copy: function () {
        return Spawn.create({one: this.get('one').copy(), two: this.get('two').copy()});
    },
    
    reverse: function () {
        return Spawn.create({one: this.get('one').reverse(), two: this.get('two').reverse()});
    }
});

util.extend(Spawn, /** @lends cocos.actions.Spawn */{
    /**
     * Helper class function to create Spawn object from array of actions
     *
     * @opt {Array} actions: list of actions to run simultaneously
     */
    initWithActions: function (opts) {
        var now, prev = opts.actions.shift();
        while (opts.actions.length > 0) {
            now = opts.actions.shift();
            if (now) {
                prev = this.create({one: prev, two: now});
            } else {
                break;
            }
        }
        return prev;
    }
});

var Animate = ActionInterval.extend(/** @lends cocos.actions.Animate# */{
    animation: null,
    restoreOriginalFrame: true,
    origFrame: null,


    /**
     * @class Animates a sprite given the name of an Animation
     *
     * @memberOf cocos.actions
     * @constructs
     * @extends cocos.actions.ActionInterval
     *
     * @opt {Float} duration Number of seconds to run action for
     * @opt {cocos.Animation} animation Animation to run
     * @opt {Boolean} [restoreOriginalFrame=true] Return to first frame when finished
     */
    init: function (opts) {
        this.animation = opts.animation;
        this.restoreOriginalFrame = opts.restoreOriginalFrame !== false;
        opts.duration = this.animation.frames.length * this.animation.delay;

        Animate.superclass.init.call(this, opts);
    },

    startWithTarget: function (target) {
        Animate.superclass.startWithTarget.call(this, target);

        if (this.restoreOriginalFrame) {
            this.set('origFrame', this.target.get('displayedFrame'));
        }
    },

    stop: function () {
        if (this.target && this.restoreOriginalFrame) {
            var sprite = this.target;
            sprite.set('displayFrame', this.origFrame);
        }

        Animate.superclass.stop.call(this);
    },

    update: function (t) {
        var frames = this.animation.get('frames'),
            numberOfFrames = frames.length,
            idx = Math.floor(t * numberOfFrames);

        if (idx >= numberOfFrames) {
            idx = numberOfFrames - 1;
        }

        var sprite = this.target;
        if (!sprite.isFrameDisplayed(frames[idx])) {
            sprite.set('displayFrame', frames[idx]);
        }
    },

    copy: function () {
        return Animate.create({animation: this.animation, restoreOriginalFrame: this.restoreOriginalFrame});
    }

});

exports.ActionInterval = ActionInterval;
exports.DelayTime = DelayTime;
exports.ScaleTo = ScaleTo;
exports.ScaleBy = ScaleBy;
exports.RotateTo = RotateTo;
exports.RotateBy = RotateBy;
exports.MoveTo = MoveTo;
exports.MoveBy = MoveBy;
exports.JumpBy = JumpBy;
exports.JumpTo = JumpTo;
exports.BezierBy = BezierBy;
exports.BezierTo = BezierTo;
exports.Blink = Blink;
exports.FadeIn = FadeIn;
exports.FadeOut = FadeOut;
exports.FadeTo = FadeTo;
exports.Spawn = Spawn;
exports.Sequence = Sequence;
exports.Repeat = Repeat;
exports.Animate = Animate;
