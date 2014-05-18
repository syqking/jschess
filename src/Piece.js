// Piece.js
// Created by MonkeyShen 2012
// 棋子对象，保存棋子相关的信息

require('cocos2d');

var _cur_id = 0;
var _alloc_id = function() {
    return _cur_id ++;
}

var Piece = BObject.extend({
    name : null,
    x : null,
    y : null,
    id : null,
    camp : null,
    
    init : function(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.id = _alloc_id();

        // 决定阵营
        if (name[0] == "R") {
            this.camp = CAMP_RED;
        }
        else if (name[0] == "B") {
            this.camp = CAMP_BLACK;
        }
    },

    set_pos : function(x, y) {
        this.x = x;
        this.y = y;
    },
});

exports.Piece = Piece;

