/*globals module exports resource require*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var q = require('qunit');

q.test("a basic test example", function () {
    q.ok(true, "this test is fine");
    var value = "hello";
    q.equals("hello", value, "We expect value to be hello");
});

q.module("Module A");

q.test("first test within module", function () {
    q.ok(true, "all pass");
});

q.test("second test within module", function () {
    q.ok(true, "all pass");
});

q.module("Module B");

q.test("some other test", function () {
    q.expect(2);
    q.equals(true, false, "failing test");
    q.equals(true, true, "passing test");
});
