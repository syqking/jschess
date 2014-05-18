// main.js
// Created by MonkeyShen 2012
// 程序入口

"use strict"  // Use strict JavaScript mode

require.paths.push('/')

var cocos  = require('cocos2d')   // Import the cocos2d module
  , events = require('events')    // Import the events module
  , geo    = require('geometry')  // Import the geometry module
  , ccp    = geo.ccp              // Short hand to create points

require('jquery/jquery-1.7.1.min')
require('jquery/jquery-impromptu')
require('Game')
require('GameController')

var Jschess = cocos.nodes.Layer.extend(/** @lends Jschess# */{

    bat: null,

    /**
     * @class Initial application layer
     * @extends cocos.nodes.Layer
     * @constructs
     */
    init: function () {
        // You must always call the super class version of init
        Jschess.superclass.init.call(this)

        // Set mouse enable
        this.set('isMouseEnabled', true);

        // Init game
        Game.init(this);
    },

    mouseMoved: function(evt) {
    },

    mouseDown: function(evt) {
    },

    mouseUp: function(evt) {
    },
})

/**
 * Entry point for the application
 */
exports.main = function () {
    // Initialise application

    // Get director
    var director = cocos.Director.get('sharedDirector')

    // Attach director to our <div> element
    director.attachInView(document.getElementById('jschess_app'))

    // Wait for the director to finish preloading our assets
    events.addListener(director, 'ready', function (director) {
        // Create a scene
        var scene = cocos.nodes.Scene.create()

        // Add our layer to the scene
        scene.addChild({ child: Jschess.create() })

        // Run the scene
        director.replaceScene(scene)
    })

    // Preload our assets
    director.runPreloadScene()
}
