/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var Scene       = require('./Scene').Scene,
    Director    = require('../Director').Director,
    Label       = require('./Label').Label,
    ProgressBar = require('./ProgressBar').ProgressBar,
    Preloader   = require('preloader').Preloader,
    RemoteResource = require('remote_resources').RemoteResource,
    geo         = require('geometry'),
    util        = require('util'),
    events      = require('events');

var PreloadScene = Scene.extend(/** @lends cocos.nodes.PreloadScene# */{
    progressBar: null,
    label: null,
    preloader: null,
    isReady: false, // True when both progress bar images have loaded
    emptyImage: "/libs/cocos2d/resources/progress-bar-empty.png",
    fullImage:  "/libs/cocos2d/resources/progress-bar-full.png",

    /**
     * @memberOf cocos.nodes
     * @extends cocos.nodes.Scene
     * @constructs
     */
    init: function (opts) {
        PreloadScene.superclass.init.call(this, opts);
        var size = Director.get('sharedDirector').get('winSize');

        // Setup 'please wait' label
        var label = Label.create({
            fontSize: 14,
            fontName: 'Helvetica',
            fontColor: '#ffffff',
            string: 'Please wait...'
        });
        label.set('position', new geo.Point(size.width / 2, (size.height / 2) + 32));
        this.set('label', label);
        this.addChild({child: label});

        // Setup preloader
        var preloader = new Preloader();    // The main preloader
        preloader.addEverythingToQueue()
        this.set('preloader', preloader);

        // Listen for preload events
        events.addListener(preloader, 'load', function (preloader, uri) {
            var loaded = preloader.loaded,
                count = preloader.count;
            events.trigger(this, 'load', preloader, uri);
        }.bind(this));

        events.addListener(preloader, 'complete', function (preloader) {
            events.trigger(this, 'complete', preloader);
        }.bind(this));




        // Preloader for the loading screen resources
        var loadingPreloader = new Preloader([this.get('emptyImage'), this.get('fullImage')])

        // When loading screen resources have loaded then draw them
        events.addListener(loadingPreloader, 'complete', function (preloader) {
            this.createProgressBar();
            if (this.get('isRunning')) {
                this.get('preloader').load();
            }

            this.isReady = true;
        }.bind(this));

        loadingPreloader.load()
    },

    createProgressBar: function () {
        var preloader = this.get('preloader'),
            size = Director.get('sharedDirector').get('winSize');

        var progressBar = ProgressBar.create({
            emptyImage: "/libs/cocos2d/resources/progress-bar-empty.png",
            fullImage:  "/libs/cocos2d/resources/progress-bar-full.png"
        });

        progressBar.set('position', new geo.Point(size.width / 2, size.height / 2));

        this.set('progressBar', progressBar);
        this.addChild({child: progressBar});

        events.addListener(preloader, 'load', function (preloader, uri) {
            progressBar.set('maxValue', preloader.count);
            progressBar.set('value', preloader.loaded);
        })
    },

    onEnter: function () {
        PreloadScene.superclass.onEnter.call(this);
        var preloader = this.get('preloader');

        // Preload everything
        if (this.isReady) {
            preloader.load();
        }
    }
});

exports.PreloadScene = PreloadScene;
