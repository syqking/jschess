// Game.js
// Created by MonkeyShen 2012
// 游戏对象，单件

var cocos = require('cocos2d');
var geo = require('geometry');
var ChessRender = require('ChessRender').ChessRender;

require('Util')
require('AI')
require('MainFrame')
require('Board')

Game = {
    chess_render : null,

    // 当前可以移动的正营
    cur_camp : null,

    // 玩家身份（人类还是AI）
    player_red : null,
    player_black : null,

    // 是否已经结束
    is_over : false,

    // 赢家
    winner : null,

    // 提醒被将军的sprite
    red_king_sprite : null,
    black_king_sprite : null,

    // 初始化
    init : function(layer) {

        // 初始化主界面
        MainFrame.init(layer);

        // 初始化AI
        AI.init();

        // 创建棋盘
        Board.clear_board();
        this.chess_render = ChessRender.create();
        this.chess_render.set('position', new geo.Point(174, 50));
        layer.addChild({child : this.chess_render});

        Board.add_board_listener(this);

        // 创建被将军时用于提醒的sprite
        this.red_king_sprite = cocos.nodes.Sprite.create({
            file : '/resources/jiangjun.png',
        });
        this.black_king_sprite = cocos.nodes.Sprite.create({
            file : '/resources/jiangjun.png',
        });

        this.red_king_sprite.set('position', geo.ccp(100, 100));
        this.black_king_sprite.set('position', geo.ccp(100, 500));
        this.red_king_sprite.set('visible', false);
        this.black_king_sprite.set('visible', false);

        layer.addChild(this.red_king_sprite);
        layer.addChild(this.black_king_sprite);
    },

    // 开始棋局，传入先手正营
    start : function(first_camp) {
        this.cur_camp = first_camp;
        this.is_over = false;
        Board.init_board();
        this.step();
    },

    // 停止棋局
    stop : function() {
        this.cur_camp = null;
        Board.clear_board();
        this.is_over = true;
    },

    // 重新开始
    restart : function() {
        Board.init_board();
        this.step();
    },

    // 悔棋
    regret : function() {
        Board.unmove_chess();

        // 如果对方不是人类，也unmove一下
        if (this.cur_camp == CAMP_RED && ! this.player_black.get('human')) {
            Board.unmove_chess();
        }
        else if (this.cur_camp == CAMP_BLACK && ! this.player_red.get('human')) {
            Board.unmove_chess();
        }
        else {
            this.step();
        }
    },

    // 玩家是否已设定
    is_player_seted : function() {
        console.log(this.player_red, this.player_black);
        return this.player_red != null && this.player_black != null;
    },

    // 某一方赢了
    win : function(camp) {
        var text;
        if (camp == CAMP_RED)
            text = '红方胜利了';
        else
            text = '黑方胜利了';

        // 回调
        function callback(v) {
            if (v == 'replay')
                Game.restart();
            else
                Game.stop();
        }

        $.prompt(text, {
            buttons : {
                重新开始 : 'replay',
                退出 : 'quit',
            },
            callback : callback,
        });
    },

    // 移一步
    step : function() {
        this.red_king_sprite.set('visible', false);
        this.black_king_sprite.set('visible', false);

        if (this.cur_camp == CAMP_RED) {
            this.player_black.stop();
            this.player_red.run();
        }
        else {
            this.player_red.stop();
            this.player_black.run();
        }
    },

    // 设置玩家
    set_player : function(camp, name, player_class) {
        if (camp == CAMP_RED)
            this.player_red = player_class.create(name, camp);
        else
            this.player_black = player_class.create(name, camp);
    },

    // 移动棋子
    move_chess : function(x, y, tx, ty, move_info) {
        // 移动棋子
        if (Board.move_chess(x, y, tx, ty, move_info)) {

            // 切换阵营
            this.cur_camp = -this.cur_camp;

            // 移动一步
            setTimeout("Game.step()", 300);
        }
    },

    // 检查是否被将军
    check_king : function() {
        var move_list = MoveGenerator.create_possible_moves(-this.cur_camp);
        var king = R_KING * this.cur_camp;
        for (var i = 0; i < move_list.length; ++i) {
            var move = move_list[i];
            var tc = MoveGenerator.get_chess(move.tx, move.ty);
            if (tc == king) {
                if (this.cur_camp == CAMP_RED)
                    this.red_king_sprite.set('visible', true);
                else
                    this.black_king_sprite.set('visible', true);
            }

        }
    },

    // 监听：棋子被杀掉
    on_chess_killed: function(chess) {
        if (chess.name == 'R_KING')
            this.win(CAMP_BLACK);
        else if (chess.name == 'B_KING')
            this.win(CAMP_RED);
    },
}

