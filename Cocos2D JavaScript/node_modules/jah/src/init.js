if (!Object.keys) {
    /**
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
     */
    Object.keys = function(o) {
        if (o !== Object(o)) {
            throw new TypeError('Object.keys called on non-object');
        }
        var ret = []
          , p;
        for (p in o) {
            if (Object.prototype.hasOwnProperty.call(o,p)) {
                ret.push(p);
            }
        }
        return ret;
    };
}

if (!Object.create) {
    /**
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/create
     */
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}

if (!Function.prototype.bind) {
    /**
     * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
     */
    Function.prototype.bind = function (oThis) {

        if (typeof this !== "function") // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be fBound is not callable");

        var aArgs = Array.prototype.slice.call(arguments, 1), 
            fToBind = this, 
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP ? this : oThis || window, aArgs.concat(Array.prototype.slice.call(arguments)));    
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;

    };
}

if (!window.requestAnimationFrame) {
    /**
     * Provides requestAnimationFrame in a cross browser way.
     * @see http://paulirish.com/2011/requestanimationframe-for-smart-animating/
     */
    window.requestAnimationFrame = ( function() {
        return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function( /* function FrameRequestCallback */ callback, /* DOMElement Element */ element ) {
            window.setTimeout( callback, 1000 / 60 );
        };
    } )();
}
