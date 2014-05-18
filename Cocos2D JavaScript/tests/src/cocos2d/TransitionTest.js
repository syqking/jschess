/*globals module exports resource require FLIP_Y_AXIS console*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
	Texture2D = require('cocos2d/Texture2D').Texture2D,
	cocos = require('cocos2d'),
	nodes = cocos.nodes,
	events = require('events'),
	actions = cocos.actions,
	geo = require('geometry'),
	ccp = geo.ccp;

var sceneIdx = -1;
var transitions = [
	"TransitionRotoZoomTest",
	"TransitionMoveInLTest", 
	"TransitionMoveInRTest", 
	"TransitionMoveInTTest",
	"TransitionMoveInBTest",
	"TransitionSlideInLTest", 
	"TransitionSlideInRTest", 
	"TransitionSlideInTTest", 
	"TransitionSlideInBTest"];
var transObjects = [
	cocos.nodes.TransitionRotoZoom,
	cocos.nodes.TransitionMoveInL, 
	cocos.nodes.TransitionMoveInR,
	cocos.nodes.TransitionMoveInT,
	cocos.nodes.TransitionMoveInB,
	cocos.nodes.TransitionSlideInL, 
	cocos.nodes.TransitionSlideInR, 
	cocos.nodes.TransitionSlideInT, 
	cocos.nodes.TransitionSlideInB];
var tests = {};

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


var TransitionDemo = nodes.Layer.extend({
	title: '',
	subtitle: null,

	init: function() {
		TransitionDemo.superclass.init.call(this);

		this.set('isMouseEnabled', true);

		var s = cocos.Director.get('sharedDirector').get('winSize');

		var label = nodes.Label.create({
			string: this.get('title'),
			fontName: 'Arial',
			fontSize: 26
		});
		this.addChild({
			child: label,
			z: 1
		});
		label.set('position', ccp(s.width / 2, s.height - 50));

		var subtitle = this.get('subtitle');
		if (subtitle) {
			var l = nodes.Label.create({
				string: subtitle,
				fontName: "Thonburi",
				fontSize: 16
			});
			this.addChild({
				child: l,
				z: 1
			});
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

	restartCallback: function() {
		var director = cocos.Director.get('sharedDirector');

		var scene = nodes.Scene.create();
		scene.addChild({
			child: restartAction().create()
		});

		director.replaceScene(scene);
	},

	backCallback: function() {
		var director = cocos.Director.get('sharedDirector');

		var scene = nodes.Scene.create();
		scene.addChild({
			child: backAction().create()
		});
		
		director.replaceScene(transObjects[sceneIdx].create({duration: 1.5, 
			scene: scene}));
	},

	nextCallback: function() {
		var director = cocos.Director.get('sharedDirector');
		var scene = nodes.Scene.create();
		scene.addChild({
			child: nextAction().create()
		});
		var transIdx = (sceneIdx === 0) ? transObjects.length-1 : sceneIdx-1;
		director.replaceScene(transObjects[transIdx].create({duration: 1.5, 
			scene: scene}));
	}
	
});


tests.TransitionRotoZoomTest = TransitionDemo.extend({
	title: 'TransitionRotoZoom Test',
	subtitle: 'rotates and zooms & reverse to next scene',

	init: function() {
		tests.TransitionRotoZoomTest.superclass.init.call(this);
	}
});

tests.TransitionMoveInLTest = TransitionDemo.extend({
	title: 'TransitionMoveInL Test',
	subtitle: 'next scene moves in from the left',

	init: function() {
		tests.TransitionMoveInLTest.superclass.init.call(this);
	}
});

tests.TransitionMoveInRTest = TransitionDemo.extend({
	title: 'TransitionMoveInR Test',
	subtitle: 'next scene moves in from the right',

	init: function() {
		tests.TransitionMoveInLTest.superclass.init.call(this);
	}
});

tests.TransitionMoveInTTest = TransitionDemo.extend({
	title: 'TransitionMoveInT Test',
	subtitle: 'next scene moves in from the top',

	init: function() {
		tests.TransitionMoveInTTest.superclass.init.call(this);
	}
});

tests.TransitionMoveInBTest = TransitionDemo.extend({
	title: 'TransitionMoveInB Test',
	subtitle: 'next scene moves in from the bottom',

	init: function() {
		tests.TransitionMoveInBTest.superclass.init.call(this);
	}
});

tests.TransitionSlideInLTest = TransitionDemo.extend({
	title: 'TransitionSlideInL Test',
	subtitle: 'next scene pans in from the left',

	init: function() {
		tests.TransitionSlideInLTest.superclass.init.call(this);
	}
});

tests.TransitionSlideInRTest = TransitionDemo.extend({
	title: 'TransitionSlideInR Test',
	subtitle: 'next scene pans in from the right',

	init: function() {
		tests.TransitionSlideInRTest.superclass.init.call(this);
	}
});

tests.TransitionSlideInTTest = TransitionDemo.extend({
	title: 'TransitionSlideInT Test',
	subtitle: 'next scene slides in from the top',

	init: function() {
		tests.TransitionSlideInTTest.superclass.init.call(this);
	}
});

tests.TransitionSlideInBTest = TransitionDemo.extend({
	title: 'TransitionSlideInB Test',
	subtitle: 'next scene slides in from the bottom',

	init: function() {
		tests.TransitionSlideInBTest.superclass.init.call(this);
	}
});

exports.main = function() {
	// Initialise test
	var director = cocos.Director.get('sharedDirector');

	director.attachInView(document.getElementById('cocos2d-tests'));
	director.set('displayFPS', true);

	events.addListener(director, 'ready', function(director) {
		var scene = nodes.Scene.create();
		scene.addChild({
			child: nextAction().create()
		});
		director.replaceScene(scene);
	});

	director.runPreloadScene();
};
