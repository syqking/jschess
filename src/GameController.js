// GameController.js
// Created by MonkeyShen 2012
// 控制器，鼠标键盘输入控制

var cocos = require('cocos2d');

GameController = {

    // 当前可控制的阵营
    cur_camp : null,

    // 开启/关闭用户控制
    enable_user_control : function(camp, enable) {
        if (enable) 
            this.cur_camp = camp;
        else
            this.cur_camp = null;
    },

    // 获取当前可控制的阵营
    get_cur_camp : function() {
        return this.cur_camp;
    },
}

