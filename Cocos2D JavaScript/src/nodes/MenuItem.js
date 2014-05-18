/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    Node = require('./Node').Node,
    Sprite = require('./Sprite').Sprite,
    rectMake = require('geometry').rectMake,
    ccp = require('geometry').ccp;

var MenuItem = Node.extend(/** @lends cocos.nodes.MenuItem# */{
    isEnabled: true,
    isSelected: false,
    callback: null,

    /**
     * Base class for any buttons or options in a menu
     *
     * @memberOf cocos.nodes
     * @constructs
     * @extends cocos.nodes.Node
     *
     * @opt {Function} callback Function to call when menu item is activated
     */
    init: function (opts) {
        MenuItem.superclass.init.call(this, opts);

        var callback = opts.callback;

        this.set('anchorPoint', ccp(0.5, 0.5));
        this.set('callback', callback);
    },

    activate: function () {
        if (this.isEnabled && this.callback) {
            this.callback(this);
        }
    },

    /**
     * @getter rect
     * @type geometry.Rect
     */
    get_rect: function () {
        return rectMake(
            this.position.x - this.contentSize.width  * this.anchorPoint.x,
            this.position.y - this.contentSize.height * this.anchorPoint.y,
            this.contentSize.width,
            this.contentSize.height
        );
    },

    selected: function () {
        this.isSelected = true;
    },

    unselected: function () {
        this.isSelected = false;
    }
});

var MenuItemSprite = MenuItem.extend(/** @lends cocos.nodes.MenuItemSprite# */{
    normalImage: null,
    selectedImage: null,
    disabledImage: null,

    /**
     * A menu item that accepts any cocos.nodes.Node
     *
     * @memberOf cocos.nodes
     * @constructs
     * @extends cocos.nodes.MenuItem
     *
     * @opt {cocos.nodes.Node} normalImage Main Node to draw
     * @opt {cocos.nodes.Node} selectedImage Node to draw when menu item is selected
     * @opt {cocos.nodes.Node} disabledImage Node to draw when menu item is disabled
     */
    init: function (opts) {
        MenuItemSprite.superclass.init.call(this, opts);

        var normalImage   = opts.normalImage,
            selectedImage = opts.selectedImage,
            disabledImage = opts.disabledImage;

        this.set('normalImage', normalImage);
        this.set('selectedImage', selectedImage);
        this.set('disabledImage', disabledImage);

        this.set('contentSize', normalImage.get('contentSize'));
    },

    set_normalImage: function (image) {
        if (image != this.normalImage) {
            image.set('anchorPoint', ccp(0, 0));
            image.set('visible', true);
            this.removeChild({child: this.normalImage, cleanup: true});
            this.addChild(image);

            this.normalImage = image;
        }
    },

    set_selectedImage: function (image) {
        if (image != this.selectedImage) {
            image.set('anchorPoint', ccp(0, 0));
            image.set('visible', false);
            this.removeChild({child: this.selectedImage, cleanup: true});
            this.addChild(image);

            this.selectedImage = image;
        }
    },

    set_disabledImage: function (image) {
        if (image != this.disabledImage) {
            image.set('anchorPoint', ccp(0, 0));
            image.set('visible', false);
            this.removeChild({child: this.disabledImage, cleanup: true});
            this.addChild(image);

            this.disabledImage = image;
        }
    },

    selected: function () {
        MenuItemSprite.superclass.selected.call(this);

        if (this.selectedImage) {
            this.normalImage.set('visible',   false);
            this.selectedImage.set('visible', true);
            if (this.disabledImage) this.disabledImage.set('visible', false);
        } else {
            this.normalImage.set('visible',   true);
            if (this.disabledImage) this.disabledImage.set('visible', false);
        }
    },

    unselected: function () {
        MenuItemSprite.superclass.unselected.call(this);

        this.normalImage.set('visible',   true);
        if (this.selectedImage) this.selectedImage.set('visible', false);
        if (this.disabledImage) this.disabledImage.set('visible', false);
    },

    set_isEnabled: function (enabled) {
        this.isEnabled = enabled;

        if (enabled) {
            this.normalImage.set('visible',   true);
            if (this.selectedImage) this.selectedImage.set('visible', false);
            if (this.disabledImage) this.disabledImage.set('visible', false);
        } else {
            if (this.disabledImage) {
                this.normalImage.set('visible',   false);
                if (this.selectedImage) this.selectedImage.set('visible', false);
                this.disabledImage.set('visible', true);
            } else {
                this.normalImage.set('visible',   true);
                if (this.selectedImage) this.selectedImage.set('visible', false);
            }
        }
    }

});

var MenuItemImage = MenuItemSprite.extend(/** @lends cocos.nodes.MenuItemImage# */{

    /**
     * MenuItem that accepts image files
     *
     * @memberOf cocos.nodes
     * @constructs
     * @extends cocos.nodes.MenuItemSprite
     *
     * @opt {String} normalImage Main image file to draw
     * @opt {String} selectedImage Image file to draw when menu item is selected
     * @opt {String} disabledImage Image file to draw when menu item is disabled
     */
    init: function (opts) {
        var normalI   = opts.normalImage,
            selectedI = opts.selectedImage,
            disabledI = opts.disabledImage,
            callback  = opts.callback;

        var normalImage = Sprite.create({file: normalI}),
            selectedImage = Sprite.create({file: selectedI}),
            disabledImage = null;

        if (disabledI) {
            disabledImage = Sprite.create({file: disabledI});
        }

        return MenuItemImage.superclass.init.call(this, {normalImage: normalImage, selectedImage: selectedImage, disabledImage: disabledImage, callback: callback});
    }
});

exports.MenuItem = MenuItem;
exports.MenuItemImage = MenuItemImage;
exports.MenuItemSprite = MenuItemSprite;
