/*globals module exports resource require BObject BArray*/
/*jslint undef: true, strict: true, white: true, newcap: true, browser: true, indent: 4 */
"use strict";

var util = require('util'),
    console = require('system').console,
    Timer = require('./Scheduler').Timer,
    Scheduler = require('./Scheduler').Scheduler;

var ActionManager = BObject.extend(/** @lends cocos.ActionManager# */{
    targets: null,
    currentTarget: null,
    currentTargetSalvaged: null,

    /**
     * <p>A singleton that manages all the actions. Normally you
     * won't need to use this singleton directly. 99% of the cases you will use the
     * cocos.nodes.Node interface, which uses this singleton. But there are some cases where
     * you might need to use this singleton. Examples:</p>
     *
     * <ul>
     * <li>When you want to run an action where the target is different from a cocos.nodes.Node</li>
     * <li>When you want to pause / resume the actions</li>
     * </ul>
     *
     * @memberOf cocos
     * @constructs
     * @extends BObject
     * @singleton
     */
    init: function () {
        ActionManager.superclass.init.call(this);

        Scheduler.get('sharedScheduler').scheduleUpdate({target: this, priority: 0, paused: false});
        this.targets = [];
    },

    /**
     * Adds an action with a target. If the target is already present, then the
     * action will be added to the existing target. If the target is not
     * present, a new instance of this target will be created either paused or
     * paused, and the action will be added to the newly created target. When
     * the target is paused, the queued actions won't be 'ticked'.
     *
     * @opt {cocos.nodes.Node} target Node to run the action on
     */
    addAction: function (opts) {

        var targetID = opts.target.get('id');
        var element = this.targets[targetID];

        if (!element) {
            element = this.targets[targetID] = {
                paused: false,
                target: opts.target,
                actions: []
            };
        }

        element.actions.push(opts.action);

        opts.action.startWithTarget(opts.target);
    },

    /**
     * Remove an action
     *
     * @param {cocos.actions.Action} action Action to remove
     */
    removeAction: function (action) {
        var targetID = action.originalTarget.get('id'),
            element = this.targets[targetID];

        if (!element) {
            return;
        }

        var actionIndex = element.actions.indexOf(action);

        if (actionIndex == -1) {
            return;
        }

        if (this.currentTarget == element) {
            element.currentActionSalvaged = true;
        } 
        
        element.actions[actionIndex] = null;
        element.actions.splice(actionIndex, 1); // Delete array item

        if (element.actions.length === 0) {
            if (this.currentTarget == element) {
                this.set('currentTargetSalvaged', true);
            }
        }
            
    },

    /**
     * Fetch an action belonging to a cocos.nodes.Node
     *
     * @returns {cocos.actions.Action}
     *
     * @opts {cocos.nodes.Node} target Target of the action
     * @opts {String} tag Tag of the action
     */
    getActionFromTarget: function(opts) {
        var tag = opts.tag,
            targetID = opts.target.get('id');

        var element = this.targets[targetID];
        if (!element) {
            return null;
        }
        for (var i = 0; i < element.actions.length; i++ ) {
            if (element.actions[i] && 
                (element.actions[i].get('tag') === tag)) {
                return element.actions[i];
            }
        }
        // Not found
        return null;
    },
     
    /**
     * Remove all actions for a cocos.nodes.Node
     *
     * @param {cocos.nodes.Node} target Node to remove all actions for
     */
    removeAllActionsFromTarget: function (target) {
        var targetID = target.get('id');

        var element = this.targets[targetID];
        if (!element) {
            return;
        }
        // Delete everything in array but don't replace it incase something else has a reference
        element.actions.splice(0, element.actions.length);
    },

    /**
     * @private
     */
    update: function (dt) {
        var self = this;
        util.each(this.targets, function (currentTarget, i) {

            if (!currentTarget) {
                return;
            }
            self.currentTarget = currentTarget;

            if (!currentTarget.paused) {
                util.each(currentTarget.actions, function (currentAction, j) {
                    if (!currentAction) {
                        return;
                    }

                    currentTarget.currentAction = currentAction;
                    currentTarget.currentActionSalvaged = false;

                    currentTarget.currentAction.step(dt);

                    if (currentTarget.currentAction.get('isDone')) {
                        currentTarget.currentAction.stop();

                        var a = currentTarget.currentAction;
                        currentTarget.currentAction = null;
                        self.removeAction(a);
                    }

                    currentTarget.currentAction = null;

                });
            }

            if (self.currentTargetSalvaged && currentTarget.actions.length === 0) {
                self.targets[i] = null;
                delete self.targets[i];
            }
        });
    },

    pauseTarget: function (target) {
    },

    resumeTarget: function (target) {
        // TODO
    }
});

util.extend(ActionManager, /** @lends cocos.ActionManager */{
    /**
     * Singleton instance of cocos.ActionManager
     * @getter sharedManager
     * @type cocos.ActionManager
     */
    get_sharedManager: function (key) {
        if (!this._instance) {
            this._instance = this.create();
        }

        return this._instance;
    }
});

exports.ActionManager = ActionManager;
