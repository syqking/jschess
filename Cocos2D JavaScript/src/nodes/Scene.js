/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var Node = require('./Node').Node,
    geo = require('geometry');

var Scene = Node.extend(/** @lends cocos.nodes.Scene */{
    /**
     * Everything in your view will be a child of this object. You need at least 1 scene per app.
     *
     * @memberOf cocos.nodes
     * @constructs
     * @extends cocos.nodes.Node
     */
    init: function () {
        Scene.superclass.init.call(this);


        var Director = require('../Director').Director;
        var s = Director.get('sharedDirector').get('winSize');
        this.set('isRelativeAnchorPoint', false);
        this.anchorPoint = new geo.Point(0.5, 0.5);
        this.set('contentSize', s);
    }

});

module.exports.Scene = Scene;
