/* module exports resource require*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util      = require('util'),
    Texture2D = require('cocos2d/Texture2D').Texture2D,
    Scheduler = require('cocos2d/Scheduler').Scheduler,
    cocos     = require('cocos2d'),
    events    = require('events'),
    nodes     = cocos.nodes,
    actions   = cocos.actions,
    geo       = require('geometry'),
    ccp       = geo.ccp;

var sceneIdx = -1;
var transitions = [
    "SpriteEase",
    "SpriteEaseInOut",
    "SpriteEaseExponential",
    "SpriteEaseExponentialInOut",
    "SpriteEaseSine",
    "SpriteEaseSineInOut",
    "SpriteEaseElastic",
    "SpriteEaseElasticInOut",
    "SpriteEaseBounce",
    "SpriteEaseBounceInOut",
    "SpriteEaseBack",
    "SpriteEaseBackInOut"
];

var tests = {};

var kTagSprite1 = 1,
    kTagSprite2 = 2,
    kTagSprite3 = 3;

var kTagAction1 = 1,
    kTagAction2 = 2,
    kTagSlider = 1;
    
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

var SpriteDemo = nodes.Layer.extend({
    title: 'No title',
    subtitle: null,

    init: function () {
        SpriteDemo.superclass.init.call(this);
        
        this.set('isMouseEnabled', true);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');

        var grossini = nodes.Sprite.create({file: module.dirname + "/resources/grossini.png", 
            rect: new geo.Rect(0, 0, 85, 121)});
        var tamara = nodes.Sprite.create({file: module.dirname + "/resources/grossinis_sister1.png", 
            rect: new geo.Rect(0, 0, 52, 139)});
        var kathia = nodes.Sprite.create({file: module.dirname + "/resources/grossinis_sister2.png", 
            rect: new geo.Rect(0, 0, 56, 138)});
        this.set('grossini', grossini);
        this.set('tamara', tamara);
        this.set('kathia', kathia);
         
        this.addChild({child: grossini, z: 3, tag: kTagSprite1});
        this.addChild({child: kathia, z: 2, tag: kTagSprite3});
        this.addChild({child: tamara, z: 1, tag: kTagSprite2});
        
        grossini.set('position', ccp(60, 50));
        kathia.set('position', ccp(60, 150));
        tamara.set('position', ccp(60, 250));
        
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
        this.addChild({child: menu});
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
    },
    
    positionForTwo: function() {
        this.get('grossini').set('position', ccp(60, 120));
        this.get('tamara').set('position', ccp(60, 220));
        this.get('kathia').set('visible', false);
    }
});

tests.SpriteEase = SpriteDemo.extend(/** @lends SpriteEase.prototype# */{
    title: 'EaseIn - EaseOut - Stop',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEase.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease_in = actions.EaseIn.create({action: move.copy(), rate: 3});
        var move_ease_in_back = move_ease_in.reverse();
        
        var move_ease_out = actions.EaseOut.create({action: move.copy(), rate: 3});
        var move_ease_out_back = move_ease_out.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_in, delay.copy(), move_ease_in_back, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_out, delay.copy(), move_ease_out_back, delay.copy()]});
        
        var a2 = this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        var a1 = this.get('tamara').runAction(actions.RepeatForever.create(seq2));
        var a = this.get('kathia').runAction(actions.RepeatForever.create(seq3));
        
        Scheduler.get('sharedScheduler').schedule({target: this, method: 'testStopAction', interval: 6.25, paused: !this.get('isRunning')});
    },
    
    testStopAction: function(dt) {
        Scheduler.get('sharedScheduler').unschedule({target: this, method: 'testStopAction'});
        this.get('tamara').stopAllActions();
        this.get('kathia').stopAllActions();
        this.get('grossini').stopAllActions();
    }
});

tests.SpriteEaseInOut = SpriteDemo.extend(/** @lends SpriteEaseInOut.prototype# */{
    title: 'EaseInOut and rates',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseInOut.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        
        var move_ease_inout1 = actions.EaseInOut.create({action: move.copy(), rate: 2});
        var move_ease_inout_back1 = move_ease_inout1.reverse();
        
        var move_ease_inout2 = actions.EaseInOut.create({action: move.copy(), rate: 3});
        var move_ease_inout_back2 = move_ease_inout2.reverse();
        
        var move_ease_inout3 = actions.EaseInOut.create({action: move.copy(), rate: 4});
        var move_ease_inout_back3 = move_ease_inout3.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move_ease_inout1, delay, move_ease_inout_back1, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_inout2, delay.copy(), move_ease_inout_back2, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_inout3, delay.copy(), move_ease_inout_back3, delay.copy()]});
        
        this.get('tamara').runAction(actions.RepeatForever.create(seq1));        
        this.get('kathia').runAction(actions.RepeatForever.create(seq2));
        this.get('grossini').runAction(actions.RepeatForever.create(seq3));
    }
});

tests.SpriteEaseExponential = SpriteDemo.extend(/** @lends SpriteEaseExponential.prototype# */{
    title: 'ExpIn - ExpOut actions',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseExponential.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease_in = actions.EaseExponentialIn.create({action: move.copy()});
        var move_ease_in_back = move_ease_in.reverse();
        
        var move_ease_out = actions.EaseExponentialOut.create({action: move.copy()});
        var move_ease_out_back = move_ease_out.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_in, delay.copy(), move_ease_in_back, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_out, delay.copy(), move_ease_out_back, delay.copy()]});
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
        this.get('kathia').runAction(actions.RepeatForever.create(seq3));
    }
});

tests.SpriteEaseExponentialInOut = SpriteDemo.extend(/** @lends SpriteEaseExponentialInOut.prototype# */{
    title: 'EaseExponentialInOut action',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseExponentialInOut.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease = actions.EaseExponentialInOut.create({action: move.copy()});
        var move_ease_back = move_ease.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease, delay.copy(), move_ease_back, delay.copy()]});
        
        this.positionForTwo();
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
    }
});

tests.SpriteEaseSine = SpriteDemo.extend(/** @lends SpriteEaseSine.prototype# */{
    title: 'EaseSineIn - EaseSineOut',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseSine.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease_in = actions.EaseSineIn.create({action: move.copy()});
        var move_ease_in_back = move_ease_in.reverse();
        
        var move_ease_out = actions.EaseSineOut.create({action: move.copy()});
        var move_ease_out_back = move_ease_out.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_in, delay.copy(), move_ease_in_back, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_out, delay.copy(), move_ease_out_back, delay.copy()]});
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
        this.get('kathia').runAction(actions.RepeatForever.create(seq3));
    }
});

tests.SpriteEaseSineInOut = SpriteDemo.extend(/** @lends SpriteEaseSineInOut.prototype# */{
    title: 'EaseSineInOut action',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseSineInOut.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease = actions.EaseSineInOut.create({action: move.copy()});
        var move_ease_back = move_ease.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease, delay.copy(), move_ease_back, delay.copy()]});
        
        this.positionForTwo();
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
    }
});

tests.SpriteEaseElastic = SpriteDemo.extend(/** @lends SpriteEaseElastic.prototype# */{
    title: 'Elastic In - Out actions',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseElastic.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease_in = actions.EaseElasticIn.create({action: move.copy()});
        var move_ease_in_back = move_ease_in.reverse();
        
        var move_ease_out = actions.EaseElasticOut.create({action: move.copy()});
        var move_ease_out_back = move_ease_out.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_in, delay.copy(), move_ease_in_back, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_out, delay.copy(), move_ease_out_back, delay.copy()]});
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
        this.get('kathia').runAction(actions.RepeatForever.create(seq3));
    }
});

tests.SpriteEaseElasticInOut = SpriteDemo.extend(/** @lends SpriteEaseElasticInOut.prototype# */{
    title: 'EaseElasticInOut action',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseElasticInOut.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        
        var move_ease_inout1 = actions.EaseElasticInOut.create({action: move.copy(), period: 0.3});
        var move_ease_inout_back1 = move_ease_inout1.reverse();
        
        var move_ease_inout2 = actions.EaseElasticInOut.create({action: move.copy(), period: 0.45});
        var move_ease_inout_back2 = move_ease_inout2.reverse();
        
        var move_ease_inout3 = actions.EaseElasticInOut.create({action: move.copy(), period: 0.6});
        var move_ease_inout_back3 = move_ease_inout3.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move_ease_inout1, delay, move_ease_inout_back1, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_inout2, delay.copy(), move_ease_inout_back2, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_inout3, delay.copy(), move_ease_inout_back3, delay.copy()]});
        
        this.get('tamara').runAction(actions.RepeatForever.create(seq1));        
        this.get('kathia').runAction(actions.RepeatForever.create(seq2));
        this.get('grossini').runAction(actions.RepeatForever.create(seq3));
    }
});

tests.SpriteEaseBounce = SpriteDemo.extend(/** @lends SpriteEaseBounce.prototype# */{
    title: 'Bounce In - Out actions',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseBounce.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease_in = actions.EaseBounceIn.create({action: move.copy()});
        var move_ease_in_back = move_ease_in.reverse();
        
        var move_ease_out = actions.EaseBounceOut.create({action: move.copy()});
        var move_ease_out_back = move_ease_out.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_in, delay.copy(), move_ease_in_back, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_out, delay.copy(), move_ease_out_back, delay.copy()]});
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
        this.get('kathia').runAction(actions.RepeatForever.create(seq3));
    }
});

tests.SpriteEaseBounceInOut = SpriteDemo.extend(/** @lends SpriteEaseBounceInOut.prototype# */{
    title: 'EaseBounceInOut action',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseBounceInOut.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease = actions.EaseBounceInOut.create({action: move.copy()});
        var move_ease_back = move_ease.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease, delay.copy(), move_ease_back, delay.copy()]});
        
        this.positionForTwo();
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
    }
});

tests.SpriteEaseBack = SpriteDemo.extend(/** @lends SpriteEaseBack.prototype# */{
    title: 'Back In - Out actions',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseBack.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease_in = actions.EaseBackIn.create({action: move.copy()});
        var move_ease_in_back = move_ease_in.reverse();
        
        var move_ease_out = actions.EaseBackOut.create({action: move.copy()});
        var move_ease_out_back = move_ease_out.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease_in, delay.copy(), move_ease_in_back, delay.copy()]});
        var seq3 = actions.Sequence.create({actions: [move_ease_out, delay.copy(), move_ease_out_back, delay.copy()]});
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
        this.get('kathia').runAction(actions.RepeatForever.create(seq3));
    }
});

tests.SpriteEaseBackInOut = SpriteDemo.extend(/** @lends SpriteEaseBackInOut.prototype# */{
    title: 'EaseBackInOut action',
    subtitle: '',
    
    onEnter: function() {
        tests.SpriteEaseBackInOut.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var move = actions.MoveBy.create({duration: 3, position: ccp(s.width-130, 0)});
        var move_back = move.reverse();
        
        var move_ease = actions.EaseBackInOut.create({action: move.copy()});
        var move_ease_back = move_ease.reverse();
        
        var delay = actions.DelayTime.create({duration: 0.25});
        
        var seq1 = actions.Sequence.create({actions: [move, delay, move_back, delay.copy()]});
        var seq2 = actions.Sequence.create({actions: [move_ease, delay.copy(), move_ease_back, delay.copy()]});
        
        this.positionForTwo();
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq1));        
        this.get('tamara').runAction(actions.RepeatForever.create(seq2));
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
