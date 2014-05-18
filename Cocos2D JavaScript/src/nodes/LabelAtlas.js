/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var AtlasNode = require('./AtlasNode').AtlasNode,
    Sprite = require('./Sprite').Sprite,
    geo   = require('geometry');

var LabelAtlas = AtlasNode.extend(/** @lends cocos.nodes.LabelAtlas# */{
    string: '',

    mapStartChar: '',

    /**
     * @memberOf cocos.nodes
     * @extends cocos.nodes.BatchNode
     * @constructs
     *
     * @opt {String} [string=] Initial text to draw
     * @opt {String} charMapFile
     * @opt {Integer} itemWidth
     * @opt {Integer} itemHeight
     * @opt {String} startCharMap Single character
     */
    init: function (opts) {
        LabelAtlas.superclass.init.call(this, {
            file: opts.charMapFile,
            itemWidth: opts.itemWidth,
            itemHeight: opts.itemHeight,
            itemsToRender: opts.string.length,
            size: new geo.Size(opts.itemWidth * opts.string.length, opts.itemHeight)
        });


        this.mapStartChar = opts.startCharMap.charCodeAt(0);
        this.set('string', opts.string);
    },

    updateAtlasValue: function () {
        var n = this.string.length,
            s = this.get('string');
    
        // FIXME this should reuse children to improve performance
        while (this.children.length > 0) {
            this.removeChild(this.children[0]);
        }
        for (var i = 0; i < n; i++) {
            var a = s.charCodeAt(i) - this.mapStartChar,
                row = (a % this.itemsPerRow),
                col = Math.floor(a / this.itemsPerRow);
    
            var left = row * this.itemWidth,
                top  = col * this.itemHeight;

            var tile = Sprite.create({rect: new geo.Rect(left, top, this.itemWidth, this.itemHeight),
                              textureAtlas: this.textureAtlas});

            tile.set('position', new geo.Point(i * this.itemWidth, 0));
            tile.set('anchorPoint', new geo.Point(0, 0));
            tile.set('opacity', this.get('opacity'));
            
            this.addChild({child: tile});
        }
    },

    set_string: function (newString) {
        this.string = newString;

        this.updateAtlasValue();
    }
});


exports.LabelAtlas = LabelAtlas;
