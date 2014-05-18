/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    events = require('events'),
    RemoteResource = require('remote_resources').RemoteResource;

var Texture2D = BObject.extend(/** @lends cocos.Texture2D# */{
    imgElement: null,
    size: null,
    name: null,
    isLoaded: false,

    /**
     * @memberOf cocos
     * @constructs
     * @extends BObject
     *
     * @opt {String} [file] The file path of the image to use as a texture
     * @opt {Texture2D|HTMLImageElement} [data] Image data to read from
     */
    init: function (opts) {
        var file = opts.file,
            data = opts.data,
            texture = opts.texture;

        if (file) {
            this.name = file;
            data = resource(file);
        } else if (texture) {
            this.name = texture.get('name');
            data = texture.get('imgElement');
        }

        this.size = {width: 0, height: 0};

        if (data instanceof RemoteResource) {
            events.addListener(data, 'load', util.callback(this, this.dataDidLoad));
            this.set('imgElement', data.load());
        } else {
            this.set('imgElement', data);
            this.dataDidLoad(data);
        }
    },

    dataDidLoad: function (data) {
        this.isLoaded = true;
        this.set('size', {width: this.imgElement.width, height: this.imgElement.height});
        events.trigger(self, 'load', self);
    },

    drawAtPoint: function (ctx, point) {
        if (!this.isLoaded) {
            return;
        }
        ctx.drawImage(this.imgElement, point.x, point.y);
    },
    drawInRect: function (ctx, rect) {
        if (!this.isLoaded) {
            return;
        }
        ctx.drawImage(this.imgElement,
            rect.origin.x, rect.origin.y,
            rect.size.width, rect.size.height
        );
    },

    /**
     * @getter data
     * @type {String} Base64 encoded image data
     */
    get_data: function () {
        return this.imgElement ? this.imgElement.src : null;
    },

    /**
     * @getter contentSize
     * @type {geometry.Size} Size of the texture
     */
    get_contentSize: function () {
        return this.size;
    },

    get_pixelsWide: function () {
        return this.size.width;
    },

    get_pixelsHigh: function () {
        return this.size.height;
    }
});

exports.Texture2D = Texture2D;
