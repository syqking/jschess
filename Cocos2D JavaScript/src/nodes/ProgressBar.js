/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var Node   = require('./Node').Node,
    util   = require('util'),
    geo    = require('geometry'),
    events = require('events'),
    Sprite = require('./Sprite').Sprite;

var ProgressBar = Node.extend(/** @lends cocos.nodes.ProgressBar# */{
    emptySprite: null,
    fullSprite: null,
    maxValue: 100,
    value: 0,

    /**
     * @memberOf cocos.nodes
     * @extends cocos.nodes.Node
     * @constructs
     */
    init: function (opts) {
        ProgressBar.superclass.init.call(this, opts);
        var size = new geo.Size(272, 32);
        this.set('contentSize', size);

        var s;
        if (opts.emptyImage) {
            s = Sprite.create({file: opts.emptyImage, rect: new geo.Rect(0, 0, size.width, size.height)});
            s.set('anchorPoint', new geo.Point(0, 0));
            this.set('emptySprite', s);
            this.addChild({child: s});
        }
        if (opts.fullImage) {
            s = Sprite.create({file: opts.fullImage, rect: new geo.Rect(0, 0, 0, size.height)});
            s.set('anchorPoint', new geo.Point(0, 0));
            this.set('fullSprite', s);
            this.addChild({child: s});
        }

        events.addListener(this, 'maxvalue_changed', util.callback(this, 'updateImages'));
        events.addListener(this, 'value_changed', util.callback(this, 'updateImages'));

        this.updateImages();
    },

    updateImages: function () {
        var empty = this.get('emptySprite'),
            full  = this.get('fullSprite'),
            value = this.get('value'),
            size  = this.get('contentSize'),
            maxValue = this.get('maxValue'),
            ratio = (value / maxValue);

        var diff = Math.round(size.width * ratio);
        if (diff === 0) {
            full.set('visible', false);
        } else {
            full.set('visible', true);
            full.set('rect', new geo.Rect(0, 0, diff, size.height));
            full.set('contentSize', new geo.Size(diff, size.height));
        }

        if ((size.width - diff) === 0) {
            empty.set('visible', false);
        } else {
            empty.set('visible', true);
            empty.set('rect', new geo.Rect(diff, 0, size.width - diff, size.height));
            empty.set('position', new geo.Point(diff, 0));
            empty.set('contentSize', new geo.Size(size.width - diff, size.height));
        }
    }
});

exports.ProgressBar = ProgressBar;
