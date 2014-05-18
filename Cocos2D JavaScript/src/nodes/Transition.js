/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var geo             = require('geometry'),
    util            = require('util'),
    actions         = require('../actions'),
    Scene           = require('./Scene').Scene,
    Director        = require('../Director').Director,
    EventDispatcher = require('../EventDispatcher').EventDispatcher,
    Scheduler       = require('../Scheduler').Scheduler;

/** @ignore
 * Orientation Type used by some transitions
 */
var tOrientation = {
    kOrientationLeftOver: 0,
    kOrientationRightOver: 1,
    kOrientationUpOver: 0,
    kOrientationDownOver: 1
};

var TransitionScene = Scene.extend(/** @lends cocos.nodes.TransitionScene# */{
    /**
     * Incoming scene
     * @type {cocos.nodes.Scene}
     */
    inScene: null,

    /**
     * Outgoing (current) scene
     * @type {cocos.nodes.Scene}
     */
    outScene: null,

    /**
     * transition duration
     * @type Float
     */
    duration: null,

    inSceneOnTop: null,
    sendCleanupToScene: null,

    /**
     * @class Base class for Transition scenes
     *
     * @memberOf cocos.nodes
     * @extends cocos.nodes.Scene
     * @constructs
     *
     * @opt {Float} duration How long the transition should last
     * @opt {cocos.nodes.Scene} scene Income scene
     */
    init: function (opts) {
        TransitionScene.superclass.init.call(this, opts);

        this.set('duration', opts.duration);
        if (!opts.scene) {
            throw "TransitionScene requires scene property";
        }
        this.set('inScene', opts.scene);
        this.set('outScene', Director.get('sharedDirector')._runningScene);

        if (this.inScene == this.outScene) {
            throw "Incoming scene must be different from the outgoing scene";
        }
        EventDispatcher.get('sharedDispatcher').set('dispatchEvents', false);
        this.sceneOrder();
    },

    /**
     * Called after the transition finishes
     */
    finish: function () {
        var is = this.get('inScene'),
            os = this.get('outScene');

        /* clean up */
        is.set('visible', true);
        is.set('position', geo.PointZero());
        is.set('scale', 1.0);
        is.set('rotation', 0);

        os.set('visible', false);
        os.set('position', geo.PointZero());
        os.set('scale', 1.0);
        os.set('rotation', 0);

        Scheduler.get('sharedScheduler').schedule({
            target: this,
            method: this.setNewScene,
            interval: 0
        });
    },

    /**
     * Used by some transitions to hide the outer scene
     */
    hideOutShowIn: function () {
        this.get('inScene').set('visible', true);
        this.get('outScene').set('visible', false);
    },
    
    setNewScene: function (dt) {
        var dir = Director.get('sharedDirector');
        
        this.unscheduleSelector(this.setNewScene);
        // Save 'send cleanup to scene'
        // Not sure if it's cool to be accessing all these Director privates like this...
        this.set('sendCleanupToScene', dir._sendCleanupToScene);
        
        dir.replaceScene(this.get('inScene'));
        
        // enable events while transitions
        EventDispatcher.get('sharedDispatcher').set('dispatchEvents', true);

        // issue #267 
        this.get('outScene').set('visible', true);
    },

    sceneOrder: function () {
        this.set('inSceneOnTop', true);
    },

    draw: function (context, rect) {
        if (this.get('inSceneOnTop')) {
            this.get('outScene').visit(context, rect);
            this.get('inScene').visit(context, rect);
        } else {
            this.get('inScene').visit(context, rect);
            this.get('outScene').visit(context, rect);
        }
    },
    
    onEnter: function () {
        TransitionScene.superclass.onEnter.call(this);
        this.get('inScene').onEnter();
        // outScene_ should not receive the onEnter callback
    },

    onExit: function () {
        TransitionScene.superclass.onExit.call(this);
        this.get('outScene').onExit();
        // inScene_ should not receive the onExit callback
        // only the onEnterTransitionDidFinish
        if (this.get('inScene').hasOwnProperty('onEnterTransitionDidFinish')) {
            this.get('inScene').onEnterTransitionDidFinish();
        }
    },

    cleanup: function () {
        TransitionScene.superclass.cleanup.call(this);

        if (this.get('sendCleanupToScene')) {
            this.get('outScene').cleanup();
        }
    }
});

/**
 * @class Rotate and zoom out the outgoing scene, and then rotate and zoom in the incoming 
 *
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionScene
 */
var TransitionRotoZoom = TransitionScene.extend(/** @lends cocos.nodes.TransitionRotoZoom# */{
    onEnter: function() {
        TransitionRotoZoom.superclass.onEnter.call(this);
        
        var dur = this.get('duration');
        this.get('inScene').set('scale', 0.001);
        this.get('outScene').set('scale', 1.0);
        
        this.get('inScene').set('anchorPoint', geo.ccp(0.5, 0.5));
        this.get('outScene').set('anchorPoint', geo.ccp(0.5, 0.5));
        
        var outzoom = [
            actions.Spawn.initWithActions({actions: [
                actions.ScaleBy.create({scale: 0.001, duration: dur/2}),
                actions.RotateBy.create({angle: 360*2, duration: dur/2})
                ]}),
            actions.DelayTime.create({duration: dur/2})];
        
        // Can't nest sequences or reverse them very easily, so incoming scene actions must be put 
        // together manually for now...
        var inzoom = [
            actions.DelayTime.create({duration: dur/2}),
            
            actions.Spawn.initWithActions({actions: [
                actions.ScaleTo.create({scale: 1.0, duration: dur/2}),
                actions.RotateBy.create({angle: -360*2, duration: dur/2})
                ]}),
            actions.CallFunc.create({
                target: this,
                method: this.finish
            })
        ];
        
        // Sequence init() copies actions
        this.get('outScene').runAction(actions.Sequence.create({actions: outzoom}));
        this.get('inScene').runAction(actions.Sequence.create({actions: inzoom}));
    }
});

/**
 * @class Move in from to the left the incoming scene.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionScene
 */
var TransitionMoveInL = TransitionScene.extend(/** @lends cocos.nodes.TransitionMoveInL# */{
    onEnter: function () {
        TransitionMoveInL.superclass.onEnter.call(this);

        this.initScenes();

        this.get('inScene').runAction(actions.Sequence.create({actions: [
            this.action(),
            actions.CallFunc.create({
                target: this,
                method: this.finish
            })]
        }));
    },
    
    action: function () {
        return actions.MoveTo.create({
            position: geo.ccp(0, 0),
            duration: this.get('duration')
        });
    },
    
    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(-s.width, 0));
    }
});
    
/**
 * @class Move in from to the right the incoming scene.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionMoveInL
 */
var TransitionMoveInR = TransitionMoveInL.extend(/** @lends cocos.nodes.TransitionMoveInR# */{
    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(s.width, 0));
    }
});

/**
 * @class Move the incoming scene in from the top.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionMoveInL
 */
var TransitionMoveInT = TransitionMoveInL.extend(/** @lends cocos.nodes.TransitionMoveInT# */{
    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(0, s.height));
    }
});

/**
 * @class Move the incoming scene in from the bottom.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionMoveInL
 */
var TransitionMoveInB = TransitionMoveInL.extend(/** @lends cocos.nodes.TransitionMoveInB# */{
    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(0, -s.height));
    }
});

/**
 * @class Slide in the incoming scene from the left.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionScene
 */
var TransitionSlideInL = TransitionScene.extend(/** @lends cocos.nodes.TransitionSlideInL# */{
    onEnter: function () {
        TransitionSlideInL.superclass.onEnter.call(this);

        this.initScenes();

        var movein = this.action();
        var moveout = this.action();
        var outAction = actions.Sequence.create({
            actions: [
            moveout, 
            actions.CallFunc.create({
                target: this,
                method: this.finish
            })]
        });
        this.get('inScene').runAction(movein);
        this.get('outScene').runAction(outAction);
    },

    sceneOrder: function () {
        this.set('inSceneOnTop', false);
    },

    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(-s.width, 0));
    },
    
    action: function () {
        var s = Director.get('sharedDirector').get('winSize');
        return actions.MoveBy.create({
            position: geo.ccp(s.width, 0),
            duration: this.get('duration')
        });
    }
});

/** 
 * @class Slide in the incoming scene from the right.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionSlideInL
 */
var TransitionSlideInR = TransitionSlideInL.extend(/** @lends cocos.nodes.TransitionSlideInR# */{
    sceneOrder: function () {
        this.set('inSceneOnTop', true);
    },

    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(s.width, 0));
    },
    
    action: function () {
        var s = Director.get('sharedDirector').get('winSize');
        return actions.MoveBy.create({
            position: geo.ccp(-s.width, 0),
            duration: this.get('duration')
        });
    }
});

/**
 * @class Slide in the incoming scene from the top.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionSlideInL
 */
var TransitionSlideInT = TransitionSlideInL.extend(/** @lends cocos.nodes.TransitionSlideInT# */{
    sceneOrder: function () {
        this.set('inSceneOnTop', false);
    },

    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(0, s.height));
    },
    
    action: function () {
        var s = Director.get('sharedDirector').get('winSize');
        return actions.MoveBy.create({
            position: geo.ccp(0, -s.height),
            duration: this.get('duration')
        });
    }
});

/**
 * @class Slide in the incoming scene from the bottom.
 * @memberOf cocos.nodes
 * @extends cocos.nodes.TransitionSlideInL
 */
var TransitionSlideInB = TransitionSlideInL.extend(/** @lends cocos.nodes.TransitionSlideInB# */{
    sceneOrder: function () {
        this.set('inSceneOnTop', true);
    },

    initScenes: function () {
        var s = Director.get('sharedDirector').get('winSize');
        this.get('inScene').set('position', geo.ccp(0, -s.height));
    },
    
    action: function () {
        var s = Director.get('sharedDirector').get('winSize');
        return actions.MoveBy.create({
            position: geo.ccp(0, s.height),
            duration: this.get('duration')
        });
    }
});

exports.TransitionScene = TransitionScene;
exports.TransitionRotoZoom = TransitionRotoZoom;
exports.TransitionMoveInL = TransitionMoveInL;
exports.TransitionMoveInR = TransitionMoveInR;
exports.TransitionMoveInT = TransitionMoveInT;
exports.TransitionMoveInB = TransitionMoveInB;
exports.TransitionSlideInL = TransitionSlideInL;
exports.TransitionSlideInR = TransitionSlideInR;
exports.TransitionSlideInT = TransitionSlideInT;
exports.TransitionSlideInB = TransitionSlideInB;
