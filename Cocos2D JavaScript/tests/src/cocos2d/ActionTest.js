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
    "Manual",
    "Move",
    "Jump",
    "Bezier",
    "Blink",
    "Sequence",
    "Sequence2",
    "Spawn", 
    "Reverse",
    "Delay",
    "Repeat",
    "RepeatForever",
    "RotateToRepeat",
    "RotateJerk",
    "ReverseSequence",
    "ReverseSequence2",
    "Speed",
    "Follow"
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

var ActionDemo = nodes.Layer.extend({
    title: 'No title',
    subtitle: null,

    init: function () {
        ActionDemo.superclass.init.call(this);
        
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
         
        this.addChild({child: grossini, z: 1, tag: kTagSprite1});
        this.addChild({child: tamara, z: 2, tag: kTagSprite2});
        this.addChild({child: kathia, z: 3, tag: kTagSprite3});
        
        grossini.set('position', ccp(s.width/2, s.height/3));
        tamara.set('position', ccp(s.width/2, 2*s.height/3));
        kathia.set('position', ccp(s.width/2, s.height/2));
        
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
    
    alignSpritesLeft: function(numSprites) {
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        if (numSprites == 1) {
            this.get('tamara').set('visible', false);
            this.get('kathia').set('visible', false);
            this.get('grossini').set('position', ccp(60, s.height/2));
        } else if (numSprites == 2) {
            this.get('kathia').set('position', ccp(60, s.height/3));
            this.get('tamara').set('position', ccp(60, 2*s.height/3));
            this.get('grossini').set('visible', false);
        } else if (numSprites == 3) {
            this.get('grossini').set('position', ccp(60, s.height/2));
            this.get('tamara').set('position', ccp(60, 2*s.height/3));
            this.get('kathia').set('position', ccp(60, s.height/3));
        }
    },
    
    centerSprites: function(numSprites) {
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        if (numSprites == 1) {
            this.get('tamara').set('visible', false);
            this.get('kathia').set('visible', false);
            this.get('grossini').set('position', ccp(s.width/2, s.height/2));
        } else if (numSprites == 2) {
            this.get('kathia').set('position', ccp(s.width/3, s.height/2));
            this.get('tamara').set('position', ccp(2*s.width/3, s.height/2));
            this.get('grossini').set('visible', false);
        } else if (numSprites == 3) {
            this.get('grossini').set('position', ccp(s.width/2, s.height/2));
            this.get('tamara').set('position', ccp(2*s.width/3, s.height/2));
            this.get('kathia').set('position', ccp(s.width/3, s.height/2));
        }
    },
    
    addNewSprite: function (point, tag) {
        var idx = Math.floor(Math.random() * 1400 / 100),
            x = (idx % 5) * 85,
            y = (idx % 3) * 121;

        var sprite = nodes.Sprite.create({file: module.dirname + "/resources/grossini_dance_atlas.png", rect: new geo.Rect(x, y, 85, 121)});
        this.addChild({child: sprite, z: 0, tag: tag});
        sprite.set('position', ccp(point.x, point.y));

		return sprite;
    }
});

tests.Manual = ActionDemo.extend(/** @lends Manual.prototype# */{
    title: 'Manual Transformation',
    subtitle: '',
    
    onEnter: function() {
        tests.Manual.superclass.onEnter.call(this);
        
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        this.get('tamara').set('scale', ccp(2.5, -1.0));
        this.get('tamara').set('position', ccp(100, 70));
        this.get('tamara').set('opacity', 128);
        
        this.get('grossini').set('rotation', 120);
        this.get('grossini').set('position', ccp(s.width/2, s.height/2));
    }
});

/**
 * @class
 *
 * Example Move Action
 */
tests.Move = ActionDemo.extend(/** @lends Move.prototype# */{
    title: 'MoveTo / MoveBy',
    subtitle: '',

	onEnter: function() {
		tests.Move.superclass.onEnter.call(this);
		
		this.centerSprites(3);
		
		var s = cocos.Director.get('sharedDirector').get('winSize');
		
		var actionTo = actions.MoveTo.create({duration: 2, position: ccp(s.width-40, s.height-40)});
		var actionBy = actions.MoveBy.create({duration: 2, position: ccp(80, 80)});
		var actionByBack = actionBy.reverse();
		
		this.get('tamara').runAction(actionTo);
		this.get('grossini').runAction(actions.Sequence.create({actions: [actionBy, actionByBack]}));
		this.get('kathia').runAction(actions.MoveTo.create({duration: 1, position: ccp(40, 40)}));
	}
});
		
/**
 * @class
 *
 * Example Jump Action
 */
tests.Jump = ActionDemo.extend(/** @lends Jump.prototype# */{
    title: 'JumpTo / JumpBy',
    subtitle: '',

	onEnter: function() {
		tests.Jump.superclass.onEnter.call(this);
		
		var action, actionBack, seq;
        var rand = Math.random();
		
		var s = cocos.Director.get('sharedDirector').get('winSize');
		
       	var action1 = actions.JumpTo.create({duration: 2, delta: ccp(s.width/2, 300), height: 50, jumps: 4});
		var action2 = actions.JumpBy.create({duration: 2, delta: ccp(300, 0), height: 50, jumps: 4});
		var action3 = actions.JumpBy.create({duration: 2, delta: ccp(0, 0), height: 80, jumps: 4});
        actionBack = action2.reverse();
        
		this.getChild({tag: kTagSprite1}).runAction(action1);
		this.getChild({tag: kTagSprite2}).runAction(actions.Sequence.create({actions: [action2, actionBack]}));
		this.getChild({tag: kTagSprite3}).runAction(actions.RepeatForever.create(action3));
	}
});

/**
 * @class
 *
 * Example Bezier Action
 */
tests.Bezier = ActionDemo.extend(/** @lends Bezier.prototype# */{
    title: 'BezierBy / BezierTo',
    subtitle: '',

	onEnter: function() {
		tests.Bezier.superclass.onEnter.call(this);
		
		var s = cocos.Director.get('sharedDirector').get('winSize');
		
	//	this.alignSpritesLeft();
		
		var bezier = new geo.BezierConfig();
		bezier.controlPoint1 = ccp(0, s.height/2);
        bezier.controlPoint2 = ccp(300, -s.height/2);
        bezier.endPosition = ccp(300,100);
        
        var bezierForward = actions.BezierBy.create({duration: 3, bezier: bezier});
        var bezierBack = bezierForward.reverse();
        var seq = actions.Sequence.create({actions: [bezierForward, bezierBack]});
        
        this.get('tamara').set('position', ccp(80, 160));
        var bezier2 = new geo.BezierConfig();
        bezier2.controlPoint1 = ccp(100, s.height/2);
        bezier2.controlPoint2 = ccp(200, -s.height/2);
        bezier2.endPosition = ccp(240,160);
        
        var bezierTo1 = actions.BezierTo.create({duration: 2, bezier: bezier2});
        
        this.get('kathia').set('position', ccp(400, 160));
        var bezierTo2 = actions.BezierTo.create({duration: 2, bezier: bezier2});
        
        this.get('grossini').runAction(actions.RepeatForever.create(seq));
        this.get('tamara').runAction(bezierTo1);
        this.get('kathia').runAction(bezierTo2);
	}
});
		
/**
 * @class
 *
 * Example Blink Action
 */
tests.Blink = ActionDemo.extend(/** @lends Blink.prototype# */{
    title: 'Blink',
    subtitle: '',

	onEnter: function() {
		tests.Blink.superclass.onEnter.call(this);
		
		this.centerSprites(2);
		
		this.get('tamara').runAction(actions.Blink.create({duration: 2, blinks: 10}));
		this.get('kathia').runAction(actions.Blink.create({duration: 2, blinks: 5}));
	}
});


/**
 * @class
 *
 * Example Sequence Action
 */
tests.Sequence = ActionDemo.extend(/** @lends Sequence.prototype# */{
    title: 'Sequence: Move + Rotate',
    subtitle: '',
    
    onEnter: function() {
        tests.Sequence.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(1);
        
        var action = actions.Sequence.create({actions: [
            actions.MoveBy.create({duration: 2, position: ccp(240, 0)}),
            actions.RotateBy.create({duration: 2, angle: 540})
            ]});
        this.get('grossini').runAction(action);
    }
});
        
/**
 * @class
 *
 * Example Sequence2 Action
 */
tests.Sequence2 = ActionDemo.extend(/** @lends Sequence2.prototype# */{
    title: 'Sequence of InstantActions',
    subtitle: '',
    
    onEnter: function() {
        tests.Sequence2.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(1);
        this.get('grossini').set('position', ccp(200, 200));
        
        var action = actions.Sequence.create({actions: [
            actions.MoveBy.create({duration: 1, position: ccp(100, 0)}),
            actions.CallFunc.create({target: this, method: 'callback1'}),
            actions.CallFunc.create({target: this, method: 'callback2'}),
            actions.CallFunc.create({target: this, method: 'callback3'})
            ]});
        this.get('grossini').runAction(action);
    },
    
    callback1: function(target) {
        var s = cocos.Director.get('sharedDirector').get('winSize');
        var label = cocos.nodes.Label.create({string: "callback 1 called", fontName: 'Marker Felt', fontSize: 16});
        label.set('position', ccp(s.width / 4, s.height / 2));
        this.addChild({child: label});
    },
    
    callback2: function(target) {
        var s = cocos.Director.get('sharedDirector').get('winSize');
        var label = cocos.nodes.Label.create({string: "callback 2 called", fontName: 'Marker Felt', fontSize: 16});
        label.set('position', ccp(s.width / 4*2, s.height / 2));
        this.addChild({child: label});
    },
    
    callback3: function(target) {
        var s = cocos.Director.get('sharedDirector').get('winSize');
        var label = cocos.nodes.Label.create({string: "callback 3 called", fontName: 'Marker Felt', fontSize: 16});
        label.set('position', ccp(s.width / 4*3, s.height / 2));
        this.addChild({child: label});
    }
});

/**
 * @class
 *
 * Example Spawn Action
 */
tests.Spawn = ActionDemo.extend(/** @lends Spawn.prototype# */{
    title: 'Spawn: Jump + Rotate',
    subtitle: '',
    
    onEnter: function() {
        tests.Spawn.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(1);
        var action = actions.Spawn.initWithActions({actions: [
            actions.JumpBy.create({duration: 2, delta: ccp(300, 0), height: 50, jumps: 4}),
            actions.RotateBy.create({duration: 2, angle: 720})
            ]});
        this.getChild({tag: kTagSprite1}).runAction(action);
    }
});

/**
 * @class
 *
 * Example Reverse Action
 */
tests.Reverse = ActionDemo.extend(/** @lends Reverse.prototype# */{
    title: 'Reverse an action',
    subtitle: '',
    
    onEnter: function() {
        tests.Reverse.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(1);
        
        var jump = actions.JumpBy.create({duration: 2, delta: ccp(300, 0), height: 50, jumps: 4});
        var action = actions.Sequence.create({actions: [jump, jump.reverse()]});

        this.get('grossini').runAction(action);
    }
});

/**
 * @class
 *
 * Example Delay Action
 */
tests.Delay = ActionDemo.extend(/** @lends Delay.prototype# */{
    title: 'DelayTime: m + delay + m',
    subtitle: '',
    
    onEnter: function() {
        tests.Delay.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(1);
        
        var move = actions.MoveBy.create({duration: 1, position: ccp(150, 0)});
        var action = actions.Sequence.create({actions: [move,
            actions.DelayTime.create({duration: 2}),
            move]});

        this.get('grossini').runAction(action);
    }
});

/**
 * @class
 *
 * Example ReverseSequence Action
 */
tests.ReverseSequence = ActionDemo.extend(/** @lends ReverseSequence.prototype# */{
    title: 'Reverse a sequence',
    subtitle: '',
    
    onEnter: function() {
        tests.ReverseSequence.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(1);
        
        var move1 = actions.MoveBy.create({duration: 1, position: ccp(250, 0)});
        var move2 = actions.MoveBy.create({duration: 1, position: ccp(0, 50)});
        var seq = actions.Sequence.create({actions: [move1, move2, move1.reverse()]});
        var action = actions.Sequence.create({actions: [seq, seq.reverse()]});

        this.get('grossini').runAction(action);
    }
});

/**
 * @class
 *
 * Example Repeat Action
 */
tests.Repeat = ActionDemo.extend(/** @lends Repeat.prototype# */{
    title: 'Repeat / RepeatForever actions',
    subtitle: '',
    
    onEnter: function() {
        tests.Repeat.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(2);
        
        var a1 = actions.MoveBy.create({duration: 1, position: ccp(150, 0)});
        var action1 = actions.Repeat.create({action: actions.Sequence.create({actions: [
            actions.Place.create({position: ccp(60, 60)}),
            a1
            ]}), 
            times: 3});
        
        var action2 = actions.RepeatForever.create(actions.Sequence.create({actions: [
            a1.copy(), a1.reverse()]}));
        
        this.get('kathia').runAction(action1);
        this.get('tamara').runAction(action2);
    }
});

/**
 * @class
 *
 * Example RepeatForever Action
 */
tests.RepeatForever = ActionDemo.extend(/** @lends RepeatForever.prototype# */{
    title: 'CallFunc + RepeatForever',
    subtitle: '',
    
    onEnter: function() {
        tests.RepeatForever.superclass.onEnter.call(this);
        
        this.centerSprites(1);
        
        this.get('grossini').runAction(actions.Sequence.create({actions: [
            actions.DelayTime.create({duration: 1}),
            actions.CallFunc.create({target: this, method: 'repeatForever'})
            ]}));
    },
    
    repeatForever: function(target) {
        target.runAction(actions.RepeatForever.create(actions.RotateBy.create({duration: 1, angle: 360})));
    }
});

/**
 * @class
 *
 * Example RotateToRepeat Action
 */
tests.RotateToRepeat = ActionDemo.extend(/** @lends RotateToRepeat.prototype# */{
    title: 'Repeat/RepeatForever + RotateTo',
    subtitle: 'You should see smooth movements',
    
    onEnter: function() {
        tests.RotateToRepeat.superclass.onEnter.call(this);
        
        this.centerSprites(2);

        var act1 = actions.RotateTo.create({duration: 1, angle: 90});
        var act2 = actions.RotateTo.create({duration: 1, angle: 0});
        var seq = actions.Sequence.create({actions: [act1, act2]});
        var rep1 = actions.RepeatForever.create(seq);
        var rep2 = actions.Repeat.create({action: seq, times: 10});
        
        this.get('tamara').runAction(rep1);
        this.get('kathia').runAction(rep2);
    }
});

/**
 * @class
 *
 * Example RotateJerk Action
 */
tests.RotateJerk = ActionDemo.extend(/** @lends RotateJerk.prototype# */{
    title: 'RepeatForever / Repeat + RotateTo',
    subtitle: 'You should see smooth movements',
    
    onEnter: function() {
        tests.RotateJerk.superclass.onEnter.call(this);
        
        this.centerSprites(2);

        var seq = actions.Sequence.create({actions: [
            actions.RotateTo.create({duration: 0.5, angle :-20}),
            actions.RotateTo.create({duration: 0.5, angle: 20})
            ]});
        var rep1 = actions.Repeat.create({action: seq, times: 10});
        var rep2 = actions.RepeatForever.create(seq);
        this.get('tamara').runAction(rep1);
        this.get('kathia').runAction(rep2);
    }
});   

/**
 * @class
 *
 * Example ReverseSequence2 Action
 */
tests.ReverseSequence2 = ActionDemo.extend(/** @lends ReverseSequence2.prototype# */{
    title: 'Reverse sequence 2',
    subtitle: '',
    
    onEnter: function() {
        tests.ReverseSequence2.superclass.onEnter.call(this);
        
        this.alignSpritesLeft(2);
        
        // Sequence should work both with IntervalAction and InstantActions
        var move1 = actions.MoveBy.create({duration: 1, position: ccp(250, 0)});
        var move2 = actions.MoveBy.create({duration: 1, position: ccp(0, 50)});
        var tog1 = actions.ToggleVisibility.create();
        var tog2 = actions.ToggleVisibility.create();
        var seq = actions.Sequence.create({actions: [move1, tog1, move2, tog2, move1.reverse()]});
        var action = actions.Repeat.create({action: actions.Sequence.create({actions: [
            seq, seq.reverse()
            ]}), 
            times: 3});
        this.get('kathia').runAction(action);
        
        //   Also test that the reverse of Hide is Show, and vice-versa
        var move_t = actions.MoveBy.create({duration: 1, position: ccp(100, 0)});
        var move_t2 = actions.MoveBy.create({duration: 1, position: ccp(50, 0)});
        var hide = actions.Hide.create();
        var seq_t = actions.Sequence.create({actions: [
            move_t, hide, move_t2]});
        var seq_back = seq_t.reverse();
        this.get('tamara').runAction(actions.Sequence.create({actions: [
            seq_t, seq_back]}));
    }
});

/**
 * @class
 *
 * Example Speed Action
 */
tests.Speed = ActionDemo.extend(/** @lends Speed.prototype# */{
    title: 'Speed',
    subtitle: '',
    
    onEnter: function() {
        tests.Speed.superclass.onEnter.call(this);
    
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        this.alignSpritesLeft(3);
        // rotate and jump
        var jump1 = actions.JumpBy.create({duration: 4, delta: ccp(-s.width+80, 0), height: 100, jumps: 4});
        var jump2 = jump1.reverse();
        var rot1 = actions.RotateBy.create({duration: 4, angle: 720});
        var rot2 = rot1.reverse();
        
        var seq3_1 = actions.Sequence.create({actions: [jump2, jump1]});
        var seq3_2 = actions.Sequence.create({actions: [rot1, rot2]});
        var spawn = actions.Spawn.create({one: seq3_1, two: seq3_2});
        var action = actions.Speed.create({action: actions.RepeatForever.create(spawn), speed: 1.0});
        action.set('tag', kTagAction1);
        
        var action2 = action.copy();
        var action3 = action.copy();
        action2.set('tag', kTagAction1);
        action3.set('tag', kTagAction1);
        
		this.getChild({tag: kTagSprite1}).runAction(action2);
		this.getChild({tag: kTagSprite2}).runAction(action3);
		this.getChild({tag: kTagSprite3}).runAction(action);
		
	    Scheduler.get('sharedScheduler').schedule({target: this, method: 'update', interval: 1.0, paused: !this.get('isRunning')});
    },
    
    update: function(t) {
        var action1 = this.getChild({tag: kTagSprite1}).getAction({tag: kTagAction1});
        var action2 = this.getChild({tag: kTagSprite2}).getAction({tag: kTagAction1});
        var action3 = this.getChild({tag: kTagSprite3}).getAction({tag: kTagAction1});
        
        action1.setSpeed(Math.random() * 2);
        action2.setSpeed(Math.random() * 2);
        action3.setSpeed(Math.random() * 2);
    }
});

tests.Follow = ActionDemo.extend(/** @lends Follow.prototype# */{
    title: 'Follow action',
    subtitle: 'The sprite should be centered, even though it is being moved',
    
    onEnter: function() {
        tests.Follow.superclass.onEnter.call(this);
        
        this.centerSprites(1);
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        this.get('grossini').set('position', ccp(-200, s.height/2));
        
        var move = actions.MoveBy.create({duration: 2, position: ccp(s.width*3, 0)});
        var move_back = move.reverse();
        var seq = actions.Sequence.create({actions: [move, move_back]});
        var rep = actions.RepeatForever.create(seq);
        
        this.get('grossini').runAction(rep);
        
        this.runAction(actions.Follow.create({target: this.get('grossini'), 
            worldBoundary: new geo.Rect(0, 0, s.width*2-100, s.height)}));
            
    },
    
    draw: function(ctxt) {
        var s = cocos.Director.get('sharedDirector').get('winSize');
        
        var x = s.width*2 - 100,
            y = s.height;
        
        var vertices = [ccp(x-5, 5), ccp(x-5, y-5), ccp(5, y-5)];
        ctxt.beginPath();
        ctxt.moveTo(5, 5);
        for (var i=0; i<vertices.length; i++) {
            ctxt.lineTo(vertices[i].x, vertices[i].y);
        }
        ctxt.strokeStyle = "#ffffff";
        ctxt.stroke();
        ctxt.closePath();
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
