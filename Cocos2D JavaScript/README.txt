What is Cocos2D JavaScript?
===========================

Cocos2D JavaScript is an HTML5 port of Cocos2D for iPhone.
It is a 2D graphics engine which allows rapid development of 2D games and
graphical applications which can run in any modern Web browser without the need
for third-party plug-ins such as Adobe Flash.

Upgrading
=========

We don't currently support running multiple versions of Cocos2D JavaScript on
the same machine so you should first uninstall the old version before installing
a new version.

If you really do want to run multiple versions on the same machine you will
have to do a manual install and launch the appropriate 'cocos' command
directly.

To upgrade your project from v0.1 you should create a new project using the
'cocos' command and then copy the _src_ folder from your old project into the
new one. There may be backwards incompatibilities which you'll need to debug.

Installation
============

Follow the instructions for your given platform or skip ahead to 'manual
installation' if you want to install from git.

Windows
-------

Download and launch the installer.

<http://cocos2d-javascript.org/downloads>

Mac OS X
--------

Download the DMG and launch the installer.

<http://cocos2d-javascript.org/downloads>

Linux or Mac OS X using Node.js and NPM
---------------------------------------

If you have [Node.js][nodejs] and [npm][npm] installed you can install Cocos2D
JavaScript as a global package.

For the latest stable release:

    npm install -g cocos2d

For the latest unstable:

    npm install -g cocos2d@unstable

Linux or Mac OS X using Zip archive
-----------------------------------

If you don't have, or don't want to use npm, you can install by downloading the
latest Zip.

<http://cocos2d-javascript.org/downloads>

Then from your terminal run `sudo ./install.sh`. The script will copy Cocos2D
JavaScript to a global location of your choice and symlink the executable to
/usr/local/bin/cocos

Manual Installation (all platforms)
-----------------------------------

You don't need to use the installer if you don't want to. You can download the
latest ZIP or checkout the latest version from github.

If you checkout from github and don't have Node.js installed, be sure to also
get the git submodule which includes precompiled Node.js binaries.

    git submodule update --init

You can put Cocos2D JavaScript anywhere you want and from there use the
'cocos', 'cocos.bat' or .EXEs in _bin/_ to launch the various commands.

Creating your first project
===========================

On Windows use the 'Create project' shortcut from your start menu to create and
select a location for your new project.

On Linux and Mac OS X open your terminal and run:

    cocos new ~/my_first_project

This will create a bare-bones project which simply draws the project name in the
centre of the screen.

To test that it's working, on Windows double click the 'Serve project' shortcut
in your project's folder.

On Linux and Mac OS X from your terminal run:

    cd ~/my_first_project
    cocos server

Now visit http://127.0.0.1:4000 and with a bit of luck you'll have something
showing.

Developing
==========

Cocos2D JavaScript uses a package called [Jah][jah] to handle development and
compilation. All the code you write will be in separate JavaScript files which
you can organise any way you wish. When it comes to deploying your application,
Jah will compile these files down into a small number of JavaScript files for
you to put on your webserver.

The entry point for the code is the file _src/main.js_ where you'll find an
`exports.main` function which will be called when your application starts.

The HTML for the page sent by the development server is at
_public/index.html.template_ and can be customised if you need any special
alterations to it.

Compiling your application
==========================

You should never use the development server in production. It's slow and
insecure. Instead you will compile your application into a handful of
JavaScript files. You'll get one file for each library that you use. So
normally you'll end up with three files: _jah.js_, _cocos2d.js_ and
_application.js_. The first two are standard libraries that you can reuse in
multiple applications. While the third file is your application code.

To compile your project on Windows double click the 'Compile project' shortcut in your
project's folder.

To compile on Linux or Mac OS X open your terminal and run:

    cd ~/my_first_project
    cocos make

The files will be written to _build/_. You can run the resulting .js files
through a JavaScript minifier if you so choose. You will also get a good
reduction in size if your Web server is configured to gzip JavaScript files.

Browser Support
===============

Everything is designed to work in Firefox 4, Chrome, Safari, Opera and IE9+. If
that is not the case then please file a bug report.

Documentation
=============

Documentation can be viewed online at <http://cocos2d-javascript.org/documentation>

If you wish to generate the documentation yourself you need to follow these steps.

Download JsDoc 2.3 (or 2.4) from <http://code.google.com/p/jsdoc-toolkit/>.

Copy that to /usr/local/jsdoc-toolkit or wherever you like and then run:

    JSDOC_HOME=/usr/local/jsdoc-toolkit ./bin/jsdoc

The documentation will appear in the 'docs' directory.

License
=======

Cocos2D JavaScript is released under the MIT license. See LICENSE for more details.

© 2010-2011 Ryan Williams <ryan@cocos2d-javascript.org>

Links
=====

* Twitter: [@cocos2djs](http://twitter.com/cocos2djs)
* Website: <http://cocos2d-javascript.org/>
* Documentation: <http://cocos2d-javascript.org/documentation>
* Forum: <http://cocos2d-javascript.org/forum>
* Email: <ryan@cocos2d-javascript.org>
* GitHub: <https://github.com/ryanwilliams/cocos2d-javascript>


[jah]: https://github.com/ryanwilliams/jah
[nodejs]: http://nodejs.org
[npm]: http://npmjs.org
