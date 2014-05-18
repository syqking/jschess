/*globals require module exports process console __dirname*/
/*jslint undef: true, strict: true, white: true, newcap: true, indent: 4 */
"use strict"

var sys  = require('util')
  , path = require('path')
  , fs   = require('fs')
  , jah  = require('jah')

exports.description = 'Create a new Cocos2D JavaScript project'
exports.run = function () {
    var cmd = jah.commands['new']

    cmd.skeletonPaths.push(path.join(__dirname, '../../../skeletons'))
    cmd.defaultSkeleton = 'cocos2d'

    var package_json = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8')
      , version = JSON.parse(package_json).version;
    cmd.skeletonSubstitutions = {
        cocosVersion: version
    }

    cmd.run()
}
