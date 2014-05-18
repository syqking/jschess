/*globals module exports resource require*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util      = require('util'),
    Texture2D = require('cocos2d/Texture2D').Texture2D,
    cocos     = require('cocos2d'),
    events    = require('events'),
    nodes     = cocos.nodes,
    actions   = cocos.actions,
    geo       = require('geometry'),
    ccp       = geo.ccp;

var sceneIdx = -1;
var transitions = [
    "LabelAtlasTest"
];

var tests = {};

var kTagSprite1 = 1,
    kTagSprite2 = 2,
    kTagSprite3 = 3,
    kTagSprite4 = 4,
    kTagSprite5 = 5,
    kTagSprite6 = 6,
    kTagSprite7 = 7,
    kTagSprite8 = 8;

function nextAction() {
    sceneIdx++;
    sceneIdx = sceneIdx % transitions.length;

    var r = transitions[sceneIdx];
    return tests[r];
}
function backAction() {
    sceneIdx--;
    if (sceneIdx < 0) {
        sceneIdx += transitions.length;
    }

    var r = transitions[sceneIdx];
    return tests[r];
}
function restartAction() {
    var r = transitions[sceneIdx];
    return tests[r];
}

var AtlasDemo = nodes.Layer.extend({
    title: 'No title',
    subtitle: null,

    init: function () {
        AtlasDemo.superclass.init.call(this);

        var s = cocos.Director.get('sharedDirector').get('winSize');

        var label = nodes.Label.create({string: this.get('title'), fontName: 'Arial', fontSize: 26});
        this.addChild({child: label, z: 1});
        label.set('position', ccp(s.width / 2, s.height - 50));


        var subtitle = this.get('subtitle');
        if (subtitle) {
            var l = nodes.Label.create({string: subtitle, fontName: "Thonburi", fontSize: 16});
            this.addChild({child: l, z: 1});
            l.set('position', ccp(s.width / 2, s.height - 80));
        }


        var item1 = nodes.MenuItemImage.create({normalImage: module.dirname + "/resources/b1.png", selectedImage: module.dirname + "/resources/b2.png", callback: util.callback(this, 'backCallback')});
        var item2 = nodes.MenuItemImage.create({normalImage: module.dirname + "/resources/r1.png", selectedImage: module.dirname + "/resources/r2.png", callback: util.callback(this, 'restartCallback')});
        var item3 = nodes.MenuItemImage.create({normalImage: module.dirname + "/resources/f1.png", selectedImage: module.dirname + "/resources/f2.png", callback: util.callback(this, 'nextCallback')});

        var menu = nodes.Menu.create({items: [item1, item2, item3]});

        menu.set('position', ccp(0, 0));
        item1.set('position', ccp(s.width / 2 - 100, 30));
        item2.set('position', ccp(s.width / 2, 30));
        item3.set('position', ccp(s.width / 2 + 100, 30));
        this.addChild({child: menu, z: 1});
    },

    restartCallback: function () {
        var director = cocos.Director.get('sharedDirector');

        var scene = nodes.Scene.create();
        scene.addChild({child: restartAction().create()});

        director.replaceScene(scene);
    },

    backCallback: function () {
        var director = cocos.Director.get('sharedDirector');

        var scene = nodes.Scene.create();
        scene.addChild({child: backAction().create()});

        director.replaceScene(scene);
    },

    nextCallback: function () {
        var director = cocos.Director.get('sharedDirector');

        var scene = nodes.Scene.create();
        scene.addChild({child: nextAction().create()});

        director.replaceScene(scene);
    }
});


tests.LabelAtlasTest = AtlasDemo.extend(/** @lends LabelAtlasTest# */{
    title: "LabelAtlas",
    subtitle: "Updating label should be fast",

    time: 0,

    init: function () {
        tests.LabelAtlasTest.superclass.init.call(this);

		var label1 = nodes.LabelAtlas.create({string: "123 Test", charMapFile: __dirname + "/resources/fonts/tuffy_bold_italic-charmap.png", itemWidth: 48, itemHeight: 64, startCharMap: ' '});
        this.addChild({child: label1, z:0, tag: kTagSprite1});
        label1.set('position', ccp(10, 100));
        label1.set('opacity', 200);

		var label2 = nodes.LabelAtlas.create({string: "0123456789", charMapFile: __dirname + "/resources/fonts/tuffy_bold_italic-charmap.png", itemWidth: 48, itemHeight: 64, startCharMap: ' '});
        this.addChild({child: label2, z:0, tag: kTagSprite2});
        label2.set('position', ccp(10, 200));
        label2.set('opacity', 32);

        this.schedule('step');
    },

    step: function (dt) {
        this.time += dt;
        var string = this.time.toString() + ' Test';
        var label1 = this.getChild({tag: kTagSprite1});
        label1.set('string', string);

        var label2 = this.getChild({tag: kTagSprite2});
        label2.set('string', parseInt(this.time).toString());
    }
});

exports.main = function () {
    // Initialise test
    var director = cocos.Director.get('sharedDirector');

    director.attachInView(document.getElementById('cocos2d-tests'));
    director.set('displayFPS', true);

    events.addListener(director, 'ready', function (director) {
        var scene = nodes.Scene.create();
        scene.addChild({child: nextAction().create()});
        director.replaceScene(scene);
    });

    director.runPreloadScene();
};
