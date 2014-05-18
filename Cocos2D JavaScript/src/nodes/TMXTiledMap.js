/*globals module exports resource require BObject BArray console*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    geo = require('geometry'),
    ccp = geo.ccp,
    Node = require('./Node').Node,
    TMXOrientationOrtho = require('../TMXOrientation').TMXOrientationOrtho,
    TMXOrientationHex   = require('../TMXOrientation').TMXOrientationHex,
    TMXOrientationIso   = require('../TMXOrientation').TMXOrientationIso,
    TMXLayer   = require('./TMXLayer').TMXLayer,
    TMXMapInfo = require('../TMXXMLParser').TMXMapInfo;

var TMXTiledMap = Node.extend(/** @lends cocos.nodes.TMXTiledMap# */{
    mapSize: null,
    tileSize: null,
    mapOrientation: 0,
    objectGroups: null,
    properties: null,
    tileProperties: null,

    /**
     * A TMX Map loaded from a .tmx file
     *
     * @memberOf cocos.nodes
     * @constructs
     * @extends cocos.nodes.Node
     *
     * @opt {String} file The file path of the TMX map to load
     */
    init: function (opts) {
        TMXTiledMap.superclass.init.call(this, opts);

        this.set('anchorPoint', ccp(0, 0));

        var mapInfo = TMXMapInfo.create(opts.file);

        this.mapSize        = mapInfo.get('mapSize');
        this.tileSize       = mapInfo.get('tileSize');
        this.mapOrientation = mapInfo.get('orientation');
        this.objectGroups   = mapInfo.get('objectGroups');
        this.properties     = mapInfo.get('properties');
        this.tileProperties = mapInfo.get('tileProperties');

        // Add layers to map
        var idx = 0;
        util.each(mapInfo.layers, util.callback(this, function (layerInfo) {
            if (layerInfo.get('visible')) {
                var child = this.parseLayer({layerInfo: layerInfo, mapInfo: mapInfo});
                this.addChild({child: child, z: idx, tag: idx});

                var childSize   = child.get('contentSize');
                var currentSize = this.get('contentSize');
                currentSize.width  = Math.max(currentSize.width,  childSize.width);
                currentSize.height = Math.max(currentSize.height, childSize.height);
                this.set('contentSize', currentSize);

                idx++;
            }
        }));
    },
    
    parseLayer: function (opts) {
        var tileset = this.tilesetForLayer(opts);
        var layer = TMXLayer.create({tilesetInfo: tileset, layerInfo: opts.layerInfo, mapInfo: opts.mapInfo});

        layer.setupTiles();

        return layer;
    },

    tilesetForLayer: function (opts) {
        var layerInfo = opts.layerInfo,
            mapInfo = opts.mapInfo,
            size = layerInfo.get('layerSize');

        // Reverse loop
        var tileset;
        for (var i = mapInfo.tilesets.length - 1; i >= 0; i--) {
            tileset = mapInfo.tilesets[i];

            for (var y = 0; y < size.height; y++) {
                for (var x = 0; x < size.width; x++) {
                    var pos = x + size.width * y, 
                        gid = layerInfo.tiles[pos];

                    if (gid !== 0 && gid >= tileset.firstGID) {
                        return tileset;
                    }
                } // for (var x
            } // for (var y
        } // for (var i

        //console.log("cocos2d: Warning: TMX Layer '%s' has no tiles", layerInfo.name);
        return tileset;
    },

    /**
     * Get a layer
     *
     * @opt {String} name The name of the layer to get
     * @returns {cocos.nodes.TMXLayer} The layer requested
     */
    getLayer: function (opts) {
        var layerName = opts.name,
            layer = null;

        this.get('children').forEach(function (item) {
            if (item instanceof TMXLayer && item.layerName == layerName) {
                layer = item;
            }
        });
        if (layer !== null) {
            return layer;
        }
    },
    
    /**
     * Return the ObjectGroup for the secific group
     *
     * @opt {String} name The object group name
     * @returns {cocos.TMXObjectGroup} The object group
     */
    getObjectGroup: function (opts) {
        var objectGroupName = opts.name,
            objectGroup = null;

        this.objectGroups.forEach(function (item) {
            if (item.name == objectGroupName) {
                objectGroup = item;
            }
        });
        if (objectGroup !== null) {
            return objectGroup;
        }
    },

    /**
     * @deprected Since v0.2. You should now use cocos.TMXTiledMap#getObjectGroup.
     */
    objectGroupNamed: function (opts) {
        console.warn('TMXTiledMap#objectGroupNamed is deprected. Use TMXTiledMap#getObjectGroup instread');
        return this.getObjectGroup(opts);
    }
});

exports.TMXTiledMap = TMXTiledMap;

