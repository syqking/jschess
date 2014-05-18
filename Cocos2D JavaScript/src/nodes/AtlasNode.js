/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var SpriteBatchNode = require('./BatchNode').SpriteBatchNode,
    TextureAtlas = require('../TextureAtlas').TextureAtlas,
    geo   = require('geometry');

var AtlasNode = SpriteBatchNode.extend(/** @lends cocos.AtlasNode# */{
    /**
     * Characters per row
     * @type Integer
     */
    itemsPerRow: 0,

    /**
     * Characters per column
     * @type Integer
     */
    itemsPerColumn: 0,

    /**
     * Width of a character
     * @type Integer
     */
    itemWidth: 0,

    /**
     * Height of a character
     * @type Integer
     */
    itemHeight: 0,


    /**
     * @type cocos.TextureAtlas
     */
     textureAtlas: null,

    /**
     * @class
     * It knows how to render a TextureAtlas object. If you are going to
     * render a TextureAtlas consider subclassing cocos.nodes.AtlasNode (or a
     * subclass of cocos.nodes.AtlasNode)
     * @memberOf cocos
     * @extends cocos.nodes.SpriteBatchNode
     * @constructs
     *
     * @opt {String} file Path to Atals image
     * @opt {Integer} itemWidth Character width
     * @opt {Integer} itemHeight Character height
     * @opt {Integer} itemsToRender Quantity of items to render
     */
    init: function (opts) {
        AtlasNode.superclass.init.call(this, opts);

        this.itemWidth = opts.itemWidth;
        this.itemHeight = opts.itemHeight;
        
        this.textureAtlas = TextureAtlas.create({file: opts.file, capacity: opts.itemsToRender});


        this._calculateMaxItems();
    },

    updateAtlasValues: function () {
        throw "cocos.nodes.AtlasNode:Abstract - updateAtlasValue not overriden";
    },

    _calculateMaxItems: function () {
        var s = this.textureAtlas.get('texture.contentSize');
        this.itemsPerColumn = s.height / this.itemHeight;
        this.itemsPerRow = s.width / this.itemWidth;
    }
});

exports.AtlasNode = AtlasNode;
