/** @namespace */
var system = {
    /** @namespace */
    stdio: {
        /**
         * Print text and objects to the debug console if the browser has one
         * 
         * @param {*} Any value to output
         */
        print: function() {
            if (console) {
                console.log.apply(console, arguments);
            } else {
                // TODO
            }
        }
    }
};

if (window.console) {
    system.console = window.console
} else {
    system.console = {
        log: function(){}
    }
}
