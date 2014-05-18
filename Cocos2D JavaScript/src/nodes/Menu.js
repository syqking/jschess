/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    Layer = require('./Layer').Layer,
    Director = require('../Director').Director,
    MenuItem = require('./MenuItem').MenuItem,
    geom = require('geometry'), ccp = geom.ccp;

/**
 * @private
 * @constant
 */
var kMenuStateWaiting = 0;

/**
 * @private
 * @constant
 */
var kMenuStateTrackingTouch = 1;
    

var Menu = Layer.extend(/** @lends cocos.nodes.Menu# */{
    mouseDelegatePriority: (-Number.MAX_VALUE + 1),
    state: kMenuStateWaiting,
    selectedItem: null,
    color: null,

    /**
     * A fullscreen node used to render a selection of menu options
     *
     * @memberOf cocos.nodes
     * @constructs
     * @extends cocos.nodes.Layer
     *
     * @opt {cocos.nodes.MenuItem[]} items An array of MenuItems to draw on the menu
     */
    init: function (opts) {
        Menu.superclass.init.call(this, opts);

        var items = opts.items;

        this.set('isMouseEnabled', true);
        
        var s = Director.get('sharedDirector').get('winSize');

        this.set('isRelativeAnchorPoint', false);
        this.anchorPoint = ccp(0.5, 0.5);
        this.set('contentSize', s);

        this.set('position', ccp(s.width / 2, s.height / 2));


        if (items) {
            var z = 0;
            util.each(items, util.callback(this, function (item) {
                this.addChild({child: item, z: z++});
            }));
        }

        
    },

    addChild: function (opts) {
        if (!opts.child instanceof MenuItem) {
            throw "Menu only supports MenuItem objects as children";
        }

        Menu.superclass.addChild.call(this, opts);
    },

    itemForMouseEvent: function (event) {
        var location = event.locationInCanvas;

        var children = this.get('children');
        for (var i = 0, len = children.length; i < len; i++) {
            var item = children[i];

            if (item.get('visible') && item.get('isEnabled')) {
                var local = item.convertToNodeSpace(location);
                
                var r = item.get('rect');
                r.origin = ccp(0, 0);

                if (geom.rectContainsPoint(r, local)) {
                    return item;
                }

            }
        }

        return null;
    },

    mouseUp: function (event) {
        var selItem = this.get('selectedItem');

        if (selItem) {
            selItem.unselected();
            selItem.activate();
        }

        if (this.state != kMenuStateWaiting) {
            this.set('state', kMenuStateWaiting);
        }
        if (selItem) {
            return true;
        }
        return false;

    },
    mouseDown: function (event) {
        if (this.state != kMenuStateWaiting || !this.visible) {
            return false;
        }

        var selectedItem = this.itemForMouseEvent(event);
        this.set('selectedItem', selectedItem);
        if (selectedItem) {
            selectedItem.selected()
            this.set('state', kMenuStateTrackingTouch);

            return true;
        }

        return false;
    },

    mouseDragged: function (event) {
        var currentItem = this.itemForMouseEvent(event);

        if (currentItem != this.selectedItem) {
            if (this.selectedItem) {
                this.selectedItem.unselected();
            }
            this.set('selectedItem', currentItem);
            if (this.selectedItem) {
                this.selectedItem.selected();
            }
        }

        if (currentItem && this.state == kMenuStateTrackingTouch) {
            return true;
        }

        return false;
        
    }

});

exports.Menu = Menu;
