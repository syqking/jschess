/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    evt = require('events'),
    Scheduler = require('../Scheduler').Scheduler,
    ActionManager = require('../ActionManager').ActionManager,
    geo = require('geometry'), ccp = geo.ccp;

var Node = BObject.extend(/** @lends cocos.nodes.Node# */{
    isCocosNode: true,

    /**
     * Is the node visible
     * @type boolean
     */
    visible: true,

    /**
     * Position relative to parent node
     * @type geometry.Point
     */
    position: null,

    /**
     * Parent node
     * @type cocos.nodes.Node
     */
    parent: null,

    /**
     * Unique tag to identify the node
     * @type *
     */
    tag: null,

    /**
     * Size of the node
     * @type geometry.Size
     */
    contentSize: null,

    /**
     * Nodes Z index. i.e. draw order
     * @type Integer
     */
    zOrder: 0,

    /**
     * Anchor point for scaling and rotation. 0x0 is top left and 1x1 is bottom right
     * @type geometry.Point
     */
    anchorPoint: null,

    /**
     * Anchor point for scaling and rotation in pixels from top left
     * @type geometry.Point
     */
    anchorPointInPixels: null,

    /**
     * Rotation angle in degrees
     * @type Float
     */
    rotation: 0,

    /**
     * X scale factor
     * @type Float
     */
    scaleX: 1,

    /**
     * Y scale factor
     * @type Float
     */
    scaleY: 1,

    /**
     * Opacity of the Node. 0 is totally transparent, 255 is totally opaque
     * @type Float
     */
    opacity: 255,

    isRunning: false,
    isRelativeAnchorPoint: true,

    isTransformDirty: true,
    isInverseDirty: true,
    inverse: null,
    transformMatrix: null,

    /**
     * The child Nodes
     * @type cocos.nodes.Node[]
     */
    children: null,

    /**
     * @memberOf cocos.nodes
     * @class The base class all visual elements extend from
     * @extends BObject
     * @constructs
     */
    init: function () {
        Node.superclass.init.call(this);
        this.set('contentSize', {width: 0, height: 0});
        this.anchorPoint = ccp(0.5, 0.5);
        this.anchorPointInPixels = ccp(0, 0);
        this.position = ccp(0, 0);
        this.children = [];

        util.each(['scaleX', 'scaleY', 'rotation', 'position', 'anchorPoint', 'contentSize', 'isRelativeAnchorPoint'], util.callback(this, function (key) {
            evt.addListener(this, key.toLowerCase() + '_changed', util.callback(this, this._dirtyTransform));
        }));
        evt.addListener(this, 'anchorpoint_changed', util.callback(this, this._updateAnchorPointInPixels));
        evt.addListener(this, 'contentsize_changed', util.callback(this, this._updateAnchorPointInPixels));
    },

    /**
     * Calculates the anchor point in pixels and updates the
     * anchorPointInPixels property
     * @private
     */
    _updateAnchorPointInPixels: function () {
        var ap = this.get('anchorPoint'),
            cs = this.get('contentSize');
        this.set('anchorPointInPixels', ccp(cs.width * ap.x, cs.height * ap.y));
    },

    /**
     * Add a child Node
     *
     * @opt {cocos.nodes.Node} child The child node to add
     * @opt {Integer} [z] Z Index for the child
     * @opt {Integer|String} [tag] A tag to reference the child with
     * @returns {cocos.nodes.Node} The node the child was added to. i.e. 'this'
     */
    addChild: function (opts) {
        if (opts.isCocosNode) {
            return this.addChild({child: opts});
        }

        var child = opts.child,
            z = opts.z,
            tag = opts.tag;

        if (z === undefined || z === null) {
            z = child.get('zOrder');
        }

        //this.insertChild({child: child, z:z});
        var added = false;


        for (var i = 0, childLen = this.children.length; i < childLen; i++) {
            var c = this.children[i];
            if (c.zOrder > z) {
                added = true;
                this.children.splice(i, 0, child);
                break;
            }
        }

        if (!added) {
            this.children.push(child);
        }

        child.set('tag', tag);
        child.set('zOrder', z);
        child.set('parent', this);

        if (this.isRunning) {
            child.onEnter();
        }

        return this;
    },
    getChild: function (opts) {
        var tag = opts.tag;

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].tag == tag) {
                return this.children[i];
            }
        }

        return null;
    },

    removeChild: function (opts) {
        if (opts.isCocosNode) {
            return this.removeChild({child: opts});
        }

        var child = opts.child,
            cleanup = opts.cleanup;

        if (!child) {
            return;
        }

        var children = this.get('children'),
            idx = children.indexOf(child);

        if (idx > -1) {
            this.detatchChild({child: child, cleanup: cleanup});
        }
    },

    removeChildren: function(opts) {
        var children = this.get('children'),
            isRunning = this.get('isRunning');
        
        // Perform cleanup on each child but can't call removeChild() 
        // due to Array.splice's destructive nature during iteration.
        for (var i = 0; i < children.length; i++) {
            if (opts.cleanup) {
                children[i].cleanup();
            }
            if (isRunning) {
                children[i].onExit();
            }
            children[i].set('parent', null);
        }
        // Now safe to empty children list
        this.children = [];
    },
    
    detatchChild: function (opts) {
        var child = opts.child,
            cleanup = opts.cleanup;

        var children = this.get('children'),
            isRunning = this.get('isRunning'),
            idx = children.indexOf(child);

        if (isRunning) {
            child.onExit();
        }

        if (cleanup) {
            child.cleanup();
        }

        child.set('parent', null);
        children.splice(idx, 1);
    },

    reorderChild: function (opts) {
        var child = opts.child,
            z     = opts.z;

        var pos = this.children.indexOf(child);
        if (pos == -1) {
            throw "Node isn't a child of this node";
        }

        child.set('zOrder', z);

        // Remove child
        this.children.splice(pos, 1);

        // Add child back at correct location
        var added = false;
        for (var i = 0, childLen = this.children.length; i < childLen; i++) {
            var c = this.children[i];
            if (c.zOrder > z) {
                added = true;
                this.children.splice(i, 0, child);
                break;
            }
        }

        if (!added) {
            this.children.push(child);
        }
    },

    /**
     * Draws the node. Override to do custom drawing. If it's less efficient to
     * draw only the area inside the rect then don't bother. The result will be
     * clipped to that area anyway.
     *
     * @param {CanvasRenderingContext2D|WebGLRenderingContext} context Canvas rendering context
     * @param {geometry.Rect} rect Rectangular region that needs redrawing. Limit drawing to this area only if it's more efficient to do so.
     */
    draw: function (context, rect) {
        // All draw code goes here
    },

    /**
     * @getter scale
     * @type Float
     */
    get_scale: function () {
        if (this.scaleX != this.scaleY) {
            throw "scaleX and scaleY aren't identical";
        }

        return this.scaleX;
    },

    /**
     * @setter scale
     * @type Float
     */
    set_scale: function (val) {
        this.set('scaleX', val);
        this.set('scaleY', val);
    },
		
    scheduleUpdate: function (opts) {
        opts = opts || {};
        var priority = opts.priority || 0;

        Scheduler.get('sharedScheduler').scheduleUpdate({target: this, priority: priority, paused: !this.get('isRunning')});
    },

    /**
     * Triggered when the node is added to a scene
     *
     * @event
     */
    onEnter: function () {
        util.each(this.children, function (child) {
            child.onEnter();
        });

        this.resumeSchedulerAndActions();
        this.set('isRunning', true);
    },

    /**
     * Triggered when the node is removed from a scene
     *
     * @event
     */
    onExit: function () {
        this.pauseSchedulerAndActions();
        this.set('isRunning', false);

        util.each(this.children, function (child) {
            child.onExit();
        });
    },

    cleanup: function () {
        this.stopAllActions();
        this.unscheduleAllSelectors();
        util.each(this.children, function (child) {
            child.cleanup();
        });
    },

    resumeSchedulerAndActions: function () {
        Scheduler.get('sharedScheduler').resumeTarget(this);
        ActionManager.get('sharedManager').resumeTarget(this);
    },
    pauseSchedulerAndActions: function () {
        Scheduler.get('sharedScheduler').pauseTarget(this);
        ActionManager.get('sharedManager').pauseTarget(this);
    },
    unscheduleSelector: function (selector) {
        Scheduler.get('sharedScheduler').unschedule({target: this, method: selector});
    },
    unscheduleAllSelectors: function () {
        Scheduler.get('sharedScheduler').unscheduleAllSelectorsForTarget(this);
    },
    stopAllActions: function () {
        ActionManager.get('sharedManager').removeAllActionsFromTarget(this);
    },

    visit: function (context, rect) {
        if (!this.visible) {
            return;
        }

        context.save();

        this.transform(context);

        // Set alpha value (global only for now)
        context.globalAlpha = this.get('opacity') / 255.0;
        
        // Adjust redraw region by nodes position
        if (rect) {
            var pos = this.get('position');
            rect = new geo.Rect(rect.origin.x - pos.x, rect.origin.y - pos.y, rect.size.width, rect.size.height);
        }

        // Draw background nodes
        util.each(this.children, function (child, i) {
            if (child.zOrder < 0) {
                child.visit(context, rect);
            }
        });
        
        this.draw(context, rect);

        // Draw foreground nodes
        util.each(this.children, function (child, i) {
            if (child.zOrder >= 0) {
                child.visit(context, rect);
            }
        });

        context.restore();
    },
    transform: function (context) {
        // Translate
        if (this.isRelativeAnchorPoint && (this.anchorPointInPixels.x !== 0 || this.anchorPointInPixels.y !== 0)) {
            context.translate(Math.round(-this.anchorPointInPixels.x), Math.round(-this.anchorPointInPixels.y));
        }

        if (this.anchorPointInPixels.x !== 0 || this.anchorPointInPixels.y !== 0) {
            context.translate(Math.round(this.position.x + this.anchorPointInPixels.x), Math.round(this.position.y + this.anchorPointInPixels.y));
        } else {
            context.translate(Math.round(this.position.x), Math.round(this.position.y));
        }

        // Rotate
        context.rotate(geo.degreesToRadians(this.get('rotation')));

        // Scale
        context.scale(this.scaleX, this.scaleY);

        if (this.anchorPointInPixels.x !== 0 || this.anchorPointInPixels.y !== 0) {
            context.translate(Math.round(-this.anchorPointInPixels.x), Math.round(-this.anchorPointInPixels.y));
        }
    },

    runAction: function (action) {
        ActionManager.get('sharedManager').addAction({action: action, target: this, paused: this.get('isRunning')});
    },
    
    /**
     * @opts {String} tag Tag of the action to return
     */
    getAction: function(opts) {
        return ActionManager.get('sharedManager').getActionFromTarget({target: this, tag: opts.tag});
    },
    
    nodeToParentTransform: function () {
        if (this.isTransformDirty) {
            this.transformMatrix = geo.affineTransformIdentity();

            if (!this.isRelativeAnchorPoint && !geo.pointEqualToPoint(this.anchorPointInPixels, ccp(0, 0))) {
                this.transformMatrix = geo.affineTransformTranslate(this.transformMatrix, this.anchorPointInPixels.x, this.anchorPointInPixels.y);
            }

            if (!geo.pointEqualToPoint(this.position, ccp(0, 0))) {
                this.transformMatrix = geo.affineTransformTranslate(this.transformMatrix, this.position.x, this.position.y);
            }

            if (this.rotation !== 0) {
                this.transformMatrix = geo.affineTransformRotate(this.transformMatrix, -geo.degreesToRadians(this.rotation));
            }
            if (!(this.scaleX == 1 && this.scaleY == 1)) {
                this.transformMatrix = geo.affineTransformScale(this.transformMatrix, this.scaleX, this.scaleY);
            }

            if (!geo.pointEqualToPoint(this.anchorPointInPixels, ccp(0, 0))) {
                this.transformMatrix = geo.affineTransformTranslate(this.transformMatrix, -this.anchorPointInPixels.x, -this.anchorPointInPixels.y);
            }

            this.set('isTransformDirty', false);

        }

        return this.transformMatrix;
    },

    parentToNodeTransform: function () {
        // TODO
    },

    nodeToWorldTransform: function () {
        var t = this.nodeToParentTransform();

        var p;
        for (p = this.get('parent'); p; p = p.get('parent')) {
            t = geo.affineTransformConcat(t, p.nodeToParentTransform());
        }

        return t;
    },

    worldToNodeTransform: function () {
        return geo.affineTransformInvert(this.nodeToWorldTransform());
    },

    convertToNodeSpace: function (worldPoint) {
        return geo.pointApplyAffineTransform(worldPoint, this.worldToNodeTransform());
    },

    /**
     * @getter boundingBox
     * @type geometry.Rect
     */
    get_boundingBox: function () {
        var cs = this.get('contentSize');
        var rect = geo.rectMake(0, 0, cs.width, cs.height);
        rect = geo.rectApplyAffineTransform(rect, this.nodeToParentTransform());
        return rect;
    },

    /**
     * @getter worldBoundingBox
     * @type geometry.Rect
     */
    get_worldBoundingBox: function () {
        var cs = this.get('contentSize');

        var rect = geo.rectMake(0, 0, cs.width, cs.height);
        rect = geo.rectApplyAffineTransform(rect, this.nodeToWorldTransform());
        return rect;
    },

    /**
     * The area of the node currently visible on screen. Returns an rect even
     * if visible is false.
     *
     * @getter visibleRect
     * @type geometry.Rect
     */
    get_visibleRect: function () {
        var s = require('../Director').Director.get('sharedDirector').get('winSize');
        var rect = new geo.Rect(
            0, 0,
            s.width, s.height
        );

        return geo.rectApplyAffineTransform(rect, this.worldToNodeTransform());
    },

    /**
     * @private
     */
    _dirtyTransform: function () {
        this.set('isTransformDirty', true);
    },

    /**
     * Schedules a custom method with an interval time in seconds.
     * If time is 0 it will be ticked every frame.
     * If time is 0, it is recommended to use 'scheduleUpdate' instead.
     * 
     * If the method is already scheduled, then the interval parameter will
     * be updated without scheduling it again.
     *
     * @opt {String|Function} method Function of method name to schedule
     * @opt {Float} [interval=0] Interval in seconds
     */
    schedule: function (opts) {
        if (typeof opts == 'string') {
            return this.schedule({method: opts, interval: 0});
        }

        opts.interval = opts.interval || 0;

        Scheduler.get('sharedScheduler').schedule({target: this, method: opts.method, interval: opts.interval, paused: this.isRunning});
    },

    /**
     * Unschedules a custom method
     *
     * @param {String|Function} method
     */
    unschedule: function (method) {
        if (!method) {
            return;
        }

        if (typeof method == 'string') {
            method = this[method];
        }
        
        Scheduler.get('sharedScheduler').unschedule({target: this, method: method});
    }

});

module.exports.Node = Node;
