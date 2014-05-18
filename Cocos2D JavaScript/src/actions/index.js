/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    path = require('path');

var modules = 'Action ActionInterval ActionInstant ActionEase'.split(' ');

/**
 * @memberOf cocos
 * @namespace Actions used to animate or change a Node
 */
var actions = {};

util.each(modules, function (mod, i) {
    util.extend(actions, require('./' + mod));
});

module.exports = actions;
