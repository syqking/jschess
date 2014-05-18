/*globals module exports require process*/
/*jslint undef: true, strict: true, white: true, newcap: true, indent: 4 */
"use strict";

function Template(str) {
    this.string = str;
}
(function () {
    this.substitute = function (subs) {
        var newStr = this.string;
        for (var key in subs) {
            if (subs.hasOwnProperty(key)) {
                newStr = newStr.replace(new RegExp('\\$' + key + '\\$', 'g'), subs[key]);
            }
        }

        return newStr;
    };

    this.toString = function () {
        return this.string;
    };
}).call(Template.prototype);

exports.Template = Template;
