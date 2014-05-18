// ChessRender.js
// Created by MonkeyShen 2012
// 象棋渲染器，渲染棋盘和棋子，并提供渲染相关的功能

var cocos = require('cocos2d');
var geo = require('geometry');

require('Board');

// 棋子在图片上的位置
var _chesse_pos = {
    R_CAR :         0,
    R_HORSE :       1,
    R_CANNON :      2,
    R_KING :        3,
    R_BISHOP :      4,
    R_ELEPHANT :    5,
    R_PAWN :        6,
    B_CAR :         7,
    B_HORSE :       8,
    B_CANNON :      9,
    B_KING :        10,
    B_BISHOP :      11,
    B_ELEPHANT :    12,
    B_PAWN :        13,
};

// 棋子大小
var _chess_size = 43;

// 棋子间隔
var _chess_interval = 49;

var ChessRender = cocos.nodes.Layer.extend({

    // 所有棋子图
    chesse_sprites : {},

    // 棋盘图
    board_sprite : null,

    // 棋盘
    board : null,

    // 当前正在拖拽的棋子
    draging_chess : null,

    // 上一次位置的spri
    last_pos_sprite : null,

    cur_pos_sprite : null,

    // 初始化
    init : function() {
        // 调用基类
        ChessRender.superclass.init.call(this);

        // 设置逻辑棋盘
        this.board = Board;
        this.board.add_board_listener(this);

        // 创建棋盘渲染对象
        this.board_sprite = cocos.nodes.Sprite.create({
            file : '/resources/board.png',
        });
        this.board_sprite.set('anchorPoint', new geo.Point(0, 0));
        this.addChild({child : this.board_sprite});
        this.set('contentSize', this.board_sprite.get('contentSize'));

        // Set mouse enable
        this.set('isMouseEnabled', true);

        // 创建位置sprite
        this.cur_pos_sprite = cocos.nodes.Sprite.create({
            file : '/resources/cur_pos.png',
        });
        this.last_pos_sprite = cocos.nodes.Sprite.create({
            file : '/resources/last_pos.png',
        });
        this.cur_pos_sprite.set('visible', false);
        this.last_pos_sprite.set('visible', false);
        this.addChild({child : this.cur_pos_sprite});
        this.addChild({child : this.last_pos_sprite});

        // 初始化棋盘
        this.init_board();
    },


    // 初始化棋盘
    init_board : function() {
        // 清空棋盘
        this.clear_board();

        // 根据棋盘创建渲染对象
        for (x = 0; x < 9; ++x) {
            for (y = 0; y < 10; ++y) {
                var chess = this.board.get_chess(x, y);
                if (chess != null)
                    this.create_chess(chess, x, y);
            }
        }
    },

    // 清空棋盘
    clear_board : function() {
        // 清空棋盘上的棋子
        for (var k in this.chess_sprites) {
            var sprite = this.chess_sprites[k];
            if (sprite != null)
                this.board_sprite.removeChild(sprite);
        }
        this.chess_sprites = {};

        // 隐藏位置sprite
        this.cur_pos_sprite.set('visible', false);
        this.last_pos_sprite.set('visible', false);
    },

    // 创建棋子
    create_chess : function(chess, x, y) {

        // 创建sprite
        var pos = _chesse_pos[chess.get('name')];      
        var chess_sprite = cocos.nodes.Sprite.create({
            file : '/resources/chess.png',
            rect : new geo.Rect(pos * _chess_size, 0, _chess_size, _chess_size),
        });
        this.chess_sprites[chess.get('id')] = chess_sprite;
        this.board_sprite.addChild({child : chess_sprite});

        // 设置位置
        var render_pos = this._board_pos_to_layer(x, y);
        var pos = new geo.Point(render_pos[0], render_pos[1]);
        chess_sprite.set('position', pos);
        chess_sprite.set('board_x', x);
        chess_sprite.set('board_y', y);
    },

    // 销毁棋子
    destroy_chess : function(chess) {
        var chess_sprite = this.chess_sprites[chess];

        if (chess_sprite != null) {
            this.chess_sprites[chess] = null;
            this.board_sprite.removeChild(chess_sprite);
        }
    },

    // 移动棋子
    move_chess : function(chess, x, y, move_info) {
        var chess_sprite = this.chess_sprites[chess];

        var move_action = false;
        if (move_info)
            move_action = move_info.move_action;

        if (chess_sprite != null) {
            var render_pos = this._board_pos_to_layer(x, y);
            var pos = new geo.Point(render_pos[0], render_pos[1]);
            var ori_pos = chess_sprite.get('position');

            var len = Math.abs(ori_pos.x - pos.x) + Math.abs(ori_pos.y - pos.y);
            var duration = len / 800;
            var action = new cocos.actions.MoveTo({
                duration : duration,
                position : pos
            });

            this.cur_pos_sprite.set('position', pos);
            this.cur_pos_sprite.set('visible', true);

            this.last_pos_sprite.set('position', ori_pos);
            this.last_pos_sprite.set('visible', true);

            chess_sprite.set('board_x', x);
            chess_sprite.set('board_y', y);
            chess_sprite.set('visible', true);
            chess_sprite.set('opacity', 255);

            if (move_action)
                chess_sprite.runAction(action);
            else
                chess_sprite.set('position', pos);
        }
    },

    // 获取鼠标下方的棋子
    _get_chess_under_mouse : function(x, y) { 
        var pos = this.get('position');
        var size = this.get('contentSize');

        x -= pos.x;
        y -= pos.y;

        var board_pos = this._layer_pos_to_board(x, y);

        var chess = Board.get_chess(board_pos[0], board_pos[1]); 
        if (chess != null) {
            var chess_sprite = this.chess_sprites[chess.get('id')];
            return {chess : chess, sprite : chess_sprite};
        }
        else {
            return null;
        }
    },

    // 渲染置转换为棋盘位置
    _layer_pos_to_board : function(x, y) {
        var col = Math.round(x / _chess_interval - 0.5);
        var row = Math.round(9.5 - y / _chess_interval);
        return [col, row];
    },

    // 棋盘位置转化为渲染位置
    _board_pos_to_layer : function(col, row) {
        var x = (col + 0.5) * _chess_interval;
        var y = (9.5 - row) * _chess_interval;
        return [x, y];
    },

    // 鼠标移动
    mouseMoved: function(evt) {
        if (this.draging_chess != null) {
            var pos = this.get('position');
            var x = evt.offsetX;
            var y = evt.offsetY;
            x -= pos.x;
            y -= pos.y;

            this.draging_chess.set('position', new geo.Point(x, y));
        }
    },

    // 鼠标按下
    mouseDown: function(evt) {
        var x = evt.offsetX;
        var y = evt.offsetY;

        var chess = this._get_chess_under_mouse(x, y);
        var cur_active_camp = GameController.get_cur_camp();
        if (chess != null && cur_active_camp == chess.chess.camp)
        {
            this.draging_chess = chess.sprite;
            this.board_sprite.removeChild(chess.sprite);
            this.board_sprite.addChild(chess.sprite);
        }
    },

    // 鼠标弹起
    mouseUp: function(evt) {
        if (this.draging_chess != null) {
            // 设置位置
            var pos = this.draging_chess.get('position');
            var board_pos = this._layer_pos_to_board(pos.x, pos.y);
            var fx = this.draging_chess.get('board_x');
            var fy = this.draging_chess.get('board_y');
            var ori_pos = this._board_pos_to_layer(fx, fy);

            // 移动回原来的位置
            this.draging_chess.set('position', new geo.Point(ori_pos[0], ori_pos[1]));

            if (fx != board_pos[0] || fy != board_pos[1])
                // 尝试移动棋子
                Game.move_chess(fx, fy, board_pos[0], board_pos[1], {});

            // 清空当前拖拽棋子
            this.draging_chess = null;
        }
    },

    // 监听：一局开始
    on_start : function() {
        this.init_board();
    },

    // 监听：一局结束
    on_end : function() {
        this.clear_board();
    },

    // 监听：棋子移动
    on_chess_move : function(chess, x, y) {
        this.move_chess(chess.get('id'), x, y, chess.move_info);
    },

    // 监听：棋子销毁
    on_chess_killed: function(chess) {
        // 隐藏棋子
        var id = chess.get('id');
        var chess_sprite = this.chess_sprites[id];
        // chess_sprite.set('visible', false);

        var action = new cocos.actions.FadeOut({duration : 0.5});
        chess_sprite.runAction(action);
    },
});

exports.ChessRender = ChessRender;

