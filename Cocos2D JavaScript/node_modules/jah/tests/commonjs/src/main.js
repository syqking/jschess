"use strict";

var container = document.getElementById('commonjs-test-log');
container.className = 'logs';

var logNum = 0;
while (container.firstChild) {
    container.removeChild(container.firstChild);
}

exports.main = function () {
    var tests = [
        '/tests/modules/1.0/absolute',
        '/tests/modules/1.0/cyclic',
        '/tests/modules/1.0/determinism',
        '/tests/modules/1.0/exactExports',
        '/tests/modules/1.0/hasOwnProperty',
        '/tests/modules/1.0/method',
        '/tests/modules/1.0/missing',
        '/tests/modules/1.0/monkeys',
        '/tests/modules/1.0/nested',
        '/tests/modules/1.0/relative',
        '/tests/modules/1.0/transitive'
    ];

    var i = 0;
    function nextTest() {
        var test = tests[i];

        window.print = function (msg, tag) {
            if (tag == 'info') {
                return;
            }
            var div = document.createElement('div')
              , testName = test.split('/').pop();
            logNum++;
            div.appendChild(document.createTextNode(logNum + ' (' + testName + '): ' +  msg));
            div.className = 'log ' + tag;
            container.appendChild(div);
            container.scrollTop = container.offsetHeight;
        };




        require.paths.push(test);
        require('program');
        require.paths.splice(require.paths.indexOf(test), 1);
        i++;
        if (i < tests.length) {
            setTimeout(nextTest, 1);
        }
    }
    nextTest();
}
