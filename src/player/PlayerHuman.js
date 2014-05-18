// PlayerHuman.js
// Created by MonkeyShen 2012
// 人类玩家

var cocos = require('cocos2d');

var Player = BObject.extend({
    name : null,
    camp : null,
    human : true,

    init : function(name, camp) {
        this.name = name;
        this.camp = camp;
    },

    run : function() {
        GameController.enable_user_control(this.camp, true);

        // 检查是否被将军
        Game.check_king();
    },

    stop : function() {
        GameController.enable_user_control(this.camp, false);
    },
});

exports.player = Player;

