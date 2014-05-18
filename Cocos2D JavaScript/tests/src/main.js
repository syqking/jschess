/*globals module exports resource require window*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var params = window.location.search;
if (params) {
    var mod = params.split('=')[1];
    require('./' + mod).main();
} else {
    var c = document.getElementById('cocos2d-tests');
    c.style.textAlign = 'center';
    c.style.fontSize = '20pt';
    c.style.lineHeight = c.clientHeight + 'px';
    while (c.firstChild) {
        c.removeChild(c.firstChild);
    }
    c.appendChild(document.createTextNode('Select a test to run'));
}
