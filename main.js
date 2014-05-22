(function(){
__jah__.resources["/AI.js"] = {data: function (exports, require, module, __filename, __dirname) {
// AI.js
// Created by MonkeyShen 2012
// 下棋的AI

require('Evaluater')

var MAX_BOUND = 9999999;
var MIN_BOUND = -MAX_BOUND;

var HASH_TYPE_EXACT = 0;
var HASH_TYPE_LOWER_BOUND = 1;
var HASH_TYPE_UPPER_BOUND = 2;

AI = {

    // 当前激活的阵营
    active_camp : null,

    // 搜索深度
    max_depth : 3,

    // 搜索次数
    search_time : 0,

    // 剪枝次数
    break_time : 0,

    // hash表访问成功次数
    hash_hit_time : 0,

    // 最佳走法
    best_move : null,

    // 历史表，剪枝成功，记录下来，以后排前面，加速剪枝
    history_table : [],

    // 时间
    start_time : 0,
    end_time : 0,

    // hash相关
    chess_hash_key : null,
    chess_hash_checksum : null,
    chess_hash_keys : [],
    chess_hash_checksums : [],
    chess_hash_items : [{}, {}],

    // 初始化
    init : function() {
        this._init_hash_key();
    },

    // 下一步棋
    play_a_chess : function(camp) {
        this.best_move = null;
        this.break_time = 0;
        this.search_time = 0;
        this.hash_hit_time = 0;
        this.active_camp = camp;
        this._reset_history_table();
        this._calc_cur_hash_key();

        // 如果棋子个数少，增加搜索深度
        var depth_levels = [16, 8, 6, 4]; 
        for (var i = 0; i < depth_levels.length; ++i) {
            if (Board.chess_num <= depth_levels[i])
                this.max_depth ++;
        }

        this.start_time = new Date().getTime();

        var val = this._alpha_beta(0, MIN_BOUND, MAX_BOUND);

        this.end_time = new Date().getTime();

        // 执行计算出来的走法
        var m = this.best_move;
        Game.move_chess(m.fx, m.fy, m.tx, m.ty, {move_action : true});
        console.log('depth = ', this.max_depth);
        console.log('break time = ', this.break_time);
        console.log('search time = ', this.search_time);
        console.log('hash hit time = ', this.hash_hit_time);
        console.log('score = ', val);
        console.log('time = ', (this.end_time - this.start_time) / 1000);
    },

    // 设置最大深度
    set_max_depth : function(depth) {
        this.max_depth = depth;
    },

    // 重置历史表
    _reset_history_table : function() {
        this.history_table = new Array(90);
        for (var f = 0; f < 90; ++f) {
            this.history_table[f] = new Array(90);
            for (var t = 0; t < 90; ++t) {
                this.history_table[f][t] = 10;
            }
        }
    },

    // 计算hash键值
    _init_hash_key : function(chesses) {
        this.chess_hash_keys = new Array(15);
        this.chess_hash_checksums = new Array(15);
        for (var c = 0; c < 15; ++c) {
            this.chess_hash_keys[c] = new Array(10);
            this.chess_hash_checksums[c] = new Array(10);
            for (var y = 0; y < 10; ++y) {
                this.chess_hash_keys[c][y] = new Array(9);
                this.chess_hash_checksums[c][y] = new Array(9);
                for (var x = 0; x < 9; ++x) {
                    this.chess_hash_keys[c][y][x] = Math.random() * Math.pow(2, 32);
                    this.chess_hash_checksums[c][y][x] = Math.random() * Math.pow(2, 32);
                }
            }
        }
    },

    // 计算当前的hash值
    _calc_cur_hash_key : function() {
        var chesses = MoveGenerator.get_chesses();

        var key = 0;
        var checksum = 0;

        for (var y = 0; y < 10; ++y) {
            for (var x = 0; x < 9; ++x) {
                var chess = chesses[y][x];
                if (chess != NOCHESS) {
                    key = key ^ this.chess_hash_keys[chess + 7][y][x];
                    checksum = checksum ^ this.chess_hash_checksums[chess + 7][y][x];
                }
            }
        }
        
        this.chess_hash_key = key;
        this.chess_hash_checksum = checksum;
    },

    // 查找hash表，看看能不能直接获取估值
    _lookup_hash_table : function(alpha, beta, depth, camp) {
        var table_id = (camp == CAMP_RED ? 0 : 1);
        var item = this.chess_hash_items[table_id][this.chess_hash_key];

        if (item == null)
            return null;

        // 检查checksum
        if (item.checksum != this.chess_hash_checksum) {
            return null;
        }

        // 检查深度（深度过深的估值不准）
        if (item.depth > depth) {
            return null;
        }

        if (item.type == HASH_TYPE_EXACT)
            return item.score;
        else if (item.type == HASH_TYPE_LOWER_BOUND)
            if (item.score >= beta)
                return item.score;
        else if (item.type == HASH_TYPE_UPPER_BOUND)
            if (item.score <= alpha)
                return item.score;

        return null;
    },

    // 把当前局面信息记录进hash表
    _record_hash_table : function(type, score, depth, camp) {
        var table_id = (camp == CAMP_RED ? 0 : 1);
        var item = {
            type : type,
            depth : depth,
            checksum : this.chess_hash_checksum,
            score : score,
        };
        this.chess_hash_items[table_id][this.chess_hash_key] = item;
    },

    // hash移动一次，修改当前局面的hash值
    _hash_make_move : function(move) {
        var key = this.chess_hash_key;
        var checksum = this.chess_hash_checksum;

        key = key ^ this.chess_hash_keys[move.fc + 7][move.fy][move.fx];
        checksum = checksum ^ this.chess_hash_checksums[move.fc + 7][move.fy][move.fx];

        if (move.tc != NOCHESS) {
            key = key ^ this.chess_hash_keys[move.tc + 7][move.ty][move.tx];
            checksum = checksum ^ this.chess_hash_checksums[move.tc + 7][move.ty][move.tx];
        }

        key = key ^ this.chess_hash_keys[move.fc + 7][move.ty][move.tx];
        checksum = checksum ^ this.chess_hash_checksums[move.fc + 7][move.ty][move.tx];

        this.chess_hash_key = key;
        this.chess_hash_checksum = checksum;
    },

    // hash反向移动一次，修改当前局面的hash值
    _hash_unmake_move : function(move) {
        var key = this.chess_hash_key;
        var checksum = this.chess_hash_checksum;

        key = key ^ this.chess_hash_keys[move.fc + 7][move.ty][move.tx];
        checksum = checksum ^ this.chess_hash_checksums[move.fc + 7][move.ty][move.tx];

        key = key ^ this.chess_hash_keys[move.fc + 7][move.fy][move.fx];
        checksum = checksum ^ this.chess_hash_checksums[move.fc + 7][move.fy][move.fx];
        
        if (move.tc != NOCHESS) {
            key = key ^ this.chess_hash_keys[move.tc + 7][move.ty][move.tx];
            checksum = checksum ^ this.chess_hash_checksums[move.tc + 7][move.ty][move.tx];
        }

        this.chess_hash_key = key;
        this.chess_hash_checksum = checksum;
    },

    // 记录进历史表
    _record_history_score : function(move, depth) {
        var f = move.fy * 9 + move.fx;
        var t = move.ty * 9 + move.tx;
        this.history_table[f][t] += 2 << depth;
    },

    // 获取历史值
    _get_history_score : function(move, depth) {
        var f = move.fy * 9 + move.fx;
        var t = move.ty * 9 + move.tx;
        return this.history_table[f][t];
    },

    // 虚拟地走一步
    _move : function(move) {
        MoveGenerator.move_chess(move);
    },

    // 虚拟返回一步
    _unmove : function(move) {
        MoveGenerator.unmove_chess(move);
    },

    // alpha-beta搜索
    _alpha_beta : function(depth, alpha, beta) {
        var a =  0;
        var bestmove = null;

        // 增加搜索次数
        this.search_time++;

        // 决定阵营
        var camp;
        var flag;

        if (depth % 2 == 0)
            flag = 1;
        else
            flag = -1;

        camp = this.active_camp * flag;

        // 查找hash表，直接获取估值
        if (depth > 0) {
            var score = this._lookup_hash_table(alpha, beta, depth, camp);
            if (score != null) {
                this.hash_hit_time ++;
                return score;
            }
        }

        // 如果已经搜索到最后一层
        if(depth == this.max_depth) {
            // 估值
            var val = Evaluater.evalute(MoveGenerator.get_chesses(), camp);
            this._record_hash_table(HASH_TYPE_EXACT, val, depth, camp);
            return val;
        }

        // 创建所有可能的走法
        var move_list = MoveGenerator.create_possible_moves(camp, depth);

        // 初始化历史值
        for (var i = 0; i < move_list.length; ++i) {
            var move = move_list[i];
            move.score = this._get_history_score(move, depth, camp);
        }

        // 对move_list排一下序，提高剪枝准确性
        move_list.sort(function (a, b) {
            return b.score - a.score;
        });

        // 是否被剪枝
        var is_cutted = false;

        for(var i =0; i < move_list.length ; ++i) {
            var move = move_list[i];

            this._move(move);

            // 检查一下是不是把王给灭了
            if (move.tc == R_KING || move.tc == B_KING) {

                this._unmove(move);

                // 记录最佳走法
                if (depth == 0) {
                    this.best_move = move;
                }

                // 直接返回一个很高的分，就是这一步了
                return 18888;
            }
            else {
                this._hash_make_move(move);

                score = -this._alpha_beta(depth +1, -beta, -alpha);

                this._hash_unmake_move(move);
                this._unmove(move);
            }

            // 如果发现比上限要好
            if (score  > alpha) {
                // 保留最大值
                alpha = score;
                bestmove = move;

                // 记录最佳走法
                if (depth == 0) {
                    this.best_move = move;
                }
            }

            // 剪枝
            if (score >= beta) {
                this.break_time ++;

                // 记录历史
                this._record_history_score(move, depth);

                // 记录hash
                this._record_hash_table(HASH_TYPE_LOWER_BOUND, score, depth, camp);
                
                // 直接返回
                return score;
            }
        }

        // 将最佳走法记录进历史表，虽然它没有造成剪枝
        if (bestmove != null) {
            this._record_hash_table(bestmove, depth);
            this._record_hash_table(HASH_TYPE_EXACT, alpha, depth, camp);
        }
        else {
            this._record_hash_table(HASH_TYPE_UPPER_BOUND, alpha, depth, camp);
        }

        return alpha;
    }
}


}, mimetype: "application/javascript", remote: false}; // END: /AI.js


__jah__.resources["/Board.js"] = {data: function (exports, require, module, __filename, __dirname) {
// Board.js
// Created by MonkeyShen 2012
// 棋盘对象，仅负责逻辑

var cocos = require('cocos2d');
var Piece = require('Piece').Piece;
require('MoveGenerator');

// 初始布局
var _init_chesses = [
	["B_CAR",   "B_HORSE", "B_ELEPHANT", "B_BISHOP", "B_KING",  "B_BISHOP", "B_ELEPHANT", "B_HORSE", "B_CAR"],
	["NOCHESS", "NOCHESS", "NOCHESS",    "NOCHESS",  "NOCHESS", "NOCHESS",  "NOCHESS",    "NOCHESS", "NOCHESS"],
	["NOCHESS", "B_CANNON","NOCHESS",    "NOCHESS",  "NOCHESS", "NOCHESS",  "NOCHESS",    "B_CANNON","NOCHESS"],
    ["B_PAWN",  "NOCHESS", "B_PAWN",     "NOCHESS",  "B_PAWN",  "NOCHESS",  "B_PAWN",     "NOCHESS", "B_PAWN"],
	["NOCHESS", "NOCHESS", "NOCHESS",    "NOCHESS",  "NOCHESS", "NOCHESS",  "NOCHESS",    "NOCHESS", "NOCHESS"],

	["NOCHESS", "NOCHESS", "NOCHESS",    "NOCHESS",  "NOCHESS", "NOCHESS",  "NOCHESS",    "NOCHESS", "NOCHESS"],
	["R_PAWN",  "NOCHESS", "R_PAWN",     "NOCHESS",  "R_PAWN",  "NOCHESS",  "R_PAWN",     "NOCHESS", "R_PAWN"],
	["NOCHESS", "R_CANNON","NOCHESS",    "NOCHESS",  "NOCHESS", "NOCHESS",  "NOCHESS",    "R_CANNON","NOCHESS"],
	["NOCHESS", "NOCHESS", "NOCHESS",    "NOCHESS",  "NOCHESS", "NOCHESS",  "NOCHESS",    "NOCHESS", "NOCHESS"],
	["R_CAR",   "R_HORSE", "R_ELEPHANT", "R_BISHOP", "R_KING",  "R_BISHOP", "R_ELEPHANT", "R_HORSE", "R_CAR"],
];

Board = {
    // 所有棋子，二维数组，表示整个棋盘
    chesses : null,

    // 棋子名字，二维数组，表示整个棋盘，用于估值
    chess_names : null,

    // 所有棋盘监听器
    listeners : [],

    // 棋盘大小
    board_size : [452, 501],

    // 棋盘位置
    board_pos : [400, 300],

    // 移动历史
    move_history : [],

    // 局面上棋子个数
    chess_num : 32,

    // 初始化棋盘
    init_board : function() {
        this.chess_names = _init_chesses.slice(0);
        this.chesses = [];
        this.chess_num = 32;
        for (var y = 0; y < 10; ++y) {
            var row = [];
            this.chesses[y] = row;    
            for (var x = 0; x < 9; ++x) {
                var name = _init_chesses[y][x];
                if (name != 'NOCHESS') {
                    var piece = Piece.create(name, x, y);
                    row[x] = piece;
                }
                else {
                    row[x] = null;
                }
            }
        }

        // 从新设置MoveGenerator的棋盘
        MoveGenerator.init_board(this.chess_names);

        // 通知所有监听器
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = this.listeners[i];
            if (listener.on_start) {
                listener.on_start(this);
            }
        }
    },

    // 清空棋盘
    clear_board : function() {
        this.chesses = [];
        for (var y = 0; y < 10; ++y) {
            this.chesses[y] = [];
            for (var x = 0; x < 9; ++x) {
                this.chesses[y][x] = null;
            }
        }

        // 通知所有监听器
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = this.listeners[i];
            if (listener.on_end) {
                listener.on_end(this);
            }
        }
        
        // 清空移动历史
        this.move_history = [];
    },

    // 获取棋子
    get_chess : function(x, y) {
        return this.chesses[y][x];
    },

    // 移动棋子
    move_chess : function(x, y, tx, ty, move_info) {
        if (! this.is_move_valid(x, y, tx, ty)) {
            return false;
        }

        if (x == tx && y == ty)
            return false;

        // 修改棋子的位置
        var chess = this.get_chess(x, y);
        var target_chess = this.get_chess(tx, ty);

        chess.set_pos(tx, ty);
        chess.move_info = move_info;

        // 目标位置是否有棋子
        if (target_chess != null) {
            // 把目标位置的棋子消灭
            this.kill_chess(tx, ty);   
        }
        
        this.chesses[y][x] = null;
        this.chesses[ty][tx] = chess;

        var move = {
            fx : x, 
            fy : y, 
            tx : tx, 
            ty : ty
        };

        // MoveGenerator同步移动
        MoveGenerator.move_chess(move);

        // 记录到移动历史
        this.move_history.push({
            fx : x,
            fy : y,
            tx : tx,
            ty : ty,
            fc : chess,
            tc : target_chess,
            move : move,
        });

        // 通知所有监听器
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = this.listeners[i];
            if (listener.on_chess_move)
                listener.on_chess_move(chess, tx, ty);
        }

        return true;
    },

    // 撤销移动棋子
    unmove_chess : function() {
        // 获取最后一步一动
        var last_move = this.move_history[this.move_history.length - 1];
        this.move_history.pop(this.move_history.length - 1);
        var fc = last_move.fc;
        var tc = last_move.tc;

        // 撤销移动
        MoveGenerator.unmove_chess(last_move.move);

        this.chesses[last_move.fy][last_move.fx] = fc;
        this.chesses[last_move.ty][last_move.tx] = tc;

        if (last_move.tc) {
            // 棋子个数增加，本来这个棋子被吃了
            this.chess_num ++;
        }

        // 通知移动目标
        for (var i = 0; i < this.listeners.length; ++i) {
            if (tc != null) {
                // 通知所有监听器
                for (var i = 0; i < this.listeners.length; ++i) {
                    var listener = this.listeners[i];
                    if (listener.on_chess_move)
                        listener.on_chess_move(tc, last_move.tx, last_move.ty);
                }
            }
        }

        // 通知移动源
        for (var i = 0; i < this.listeners.length; ++i) {
            if (fc != null) {
                // 通知所有监听器
                for (var i = 0; i < this.listeners.length; ++i) {
                    var listener = this.listeners[i];
                    if (listener.on_chess_move)
                        listener.on_chess_move(fc, last_move.fx, last_move.fy);
                }
            }
        }
    },

    // 消灭棋子
    kill_chess : function(x, y) {
        var chess = this.chesses[y][x];
        if (chess == null)
            return;

        // 通知所有监听器
        for (var i = 0; i < this.listeners.length; ++i) {
            var listener = this.listeners[i];
            if (listener.on_chess_killed)
                listener.on_chess_killed(chess);
        }

        this.chesses[y][x] = null;

        // 棋子个数减少
        this.chess_num --;
    },

    // 移动是否合法
    is_move_valid : function(x, y, tx, ty) {
        return MoveGenerator.is_valid_move(x, y, tx, ty);   
    },

    // 添加棋盘监听器
    add_board_listener : function(listener) {
        this.listeners.push(listener);
    },
};


}, mimetype: "application/javascript", remote: false}; // END: /Board.js


__jah__.resources["/ChessRender.js"] = {data: function (exports, require, module, __filename, __dirname) {
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


}, mimetype: "application/javascript", remote: false}; // END: /ChessRender.js


__jah__.resources["/Evaluater.js"] = {data: function (exports, require, module, __filename, __dirname) {
// Evaluater.js
// Created by MonkeyShen 2012
// 估值器，根据棋盘局面进行估值
// 考虑：
// * 基础棋子价值
// * 棋子机动性
// * 棋子攻击点
// * 棋子防守点
// * 空心炮
// * 窝心马

// 不同棋子的基本价值
var VAL_PAWN        = 120 
var VAL_BISHOP      = 250
var VAL_ELEPHANT    = 250
var VAL_CAR         = 500
var VAL_HORSE       = 350
var VAL_CANNON      = 350
var VAL_KING        = 10000

var _chess_values = [] 

// +7为的是让他们能状态数组中
_chess_values[7 + R_PAWN]       = VAL_PAWN;
_chess_values[7 + R_BISHOP]     = VAL_BISHOP;
_chess_values[7 + R_ELEPHANT]   = VAL_ELEPHANT;
_chess_values[7 + R_CAR]        = VAL_CAR;
_chess_values[7 + R_HORSE]      = VAL_HORSE;
_chess_values[7 + R_CANNON]     = VAL_CANNON;
_chess_values[7 + R_KING]       = VAL_KING;
_chess_values[7 + NOCHESS]      = 0;
_chess_values[7 + B_PAWN]       = VAL_PAWN;
_chess_values[7 + B_BISHOP]     = VAL_BISHOP;
_chess_values[7 + B_ELEPHANT]   = VAL_ELEPHANT;
_chess_values[7 + B_CAR]        = VAL_CAR;
_chess_values[7 + B_HORSE]      = VAL_HORSE;
_chess_values[7 + B_CANNON]     = VAL_CANNON;
_chess_values[7 + B_KING]       = VAL_KING;

// 不同棋子的灵活度
var FLEXIBILITY_PAWN        = 15
var FLEXIBILITY_BISHOP      = 1
var FLEXIBILITY_ELEPHANT    = 1
var FLEXIBILITY_CAR         = 6
var FLEXIBILITY_HORSE       = 12
var FLEXIBILITY_CANNON      = 6
var FLEXIBILITY_KING        = 0

var _chess_fexibility = []

_chess_fexibility[7 + R_PAWN]       = FLEXIBILITY_PAWN;
_chess_fexibility[7 + R_BISHOP]     = FLEXIBILITY_BISHOP;
_chess_fexibility[7 + R_ELEPHANT]   = FLEXIBILITY_ELEPHANT;
_chess_fexibility[7 + R_CAR]        = FLEXIBILITY_CAR;
_chess_fexibility[7 + R_HORSE]      = FLEXIBILITY_HORSE;
_chess_fexibility[7 + R_CANNON]     = FLEXIBILITY_CANNON;
_chess_fexibility[7 + R_KING]       = FLEXIBILITY_KING;
_chess_fexibility[7 + NOCHESS]      = 0;
_chess_fexibility[7 + B_PAWN]       = FLEXIBILITY_PAWN;
_chess_fexibility[7 + B_BISHOP]     = FLEXIBILITY_BISHOP;
_chess_fexibility[7 + B_ELEPHANT]   = FLEXIBILITY_ELEPHANT;
_chess_fexibility[7 + B_CAR]        = FLEXIBILITY_CAR;
_chess_fexibility[7 + B_HORSE]      = FLEXIBILITY_HORSE;
_chess_fexibility[7 + B_CANNON]     = FLEXIBILITY_CANNON;
_chess_fexibility[7 + B_KING]       = FLEXIBILITY_KING;

// 兵在不同位置的价值
var _pawn_values =
[
    [0,  0,  0,  0,  0,  0,  0,  0,  0],
	[90,90,110,120,120,120,110,90,90  ],
	[90,90,110,120,120,120,110,90,90  ],
	[70,90,110,110,110,110,110,90,70  ],
	[70,70,70, 70, 70,  70, 70,70,70  ],
	[0,  0,  0,  0,  0,  0,  0,  0,  0],
	[0,  0,  0,  0,  0,  0,  0,  0,  0],
	[0,  0,  0,  0,  0,  0,  0,  0,  0],
	[0,  0,  0,  0,  0,  0,  0,  0,  0],
	[0,  0,  0,  0,  0,  0,  0,  0,  0],
];

Evaluater = {

    // 可以到达的点
    relate_poses : [],

    // 估值
    evalute : function(chesses, camp_turn) {

        var cur_chess;
        var cur_target_chess;
        var sum_value = 0;
        
        // 初始化二维数组
        var chess_values = new Array(10);
        var flex_poses   = new Array(10);
        var guard_poses  = new Array(10);
        var attack_poses = new Array(10);

        for (var i = 0; i < 10; ++i) {
            chess_values[i] = new Array(0,0,0,0,0,0,0,0,0);
            flex_poses[i]   = new Array(0,0,0,0,0,0,0,0,0);
            guard_poses[i]  = new Array(0,0,0,0,0,0,0,0,0);
            attack_poses[i] = new Array(0,0,0,0,0,0,0,0,0);
        }

        // 估值
        for(var i = 0; i < 10; i++)
        {
            for(var j = 0; j < 9; j++)
            {
                if(chesses[i][j] == NOCHESS)
                    continue;

                // 获取所有与本棋子相关的位置
                cur_chess = chesses[i][j];
                this._get_relate_piece(chesses, j, i);

                // 求机动性/防守值/攻击值
                for (var k = 0; k < this.relate_poses.length; k++) {
                    cur_target_chess = chesses[this.relate_poses[k].y][this.relate_poses[k].x];
                    if (cur_target_chess == NOCHESS) {
                        flex_poses[i][j]++;	
                    }
                    else {
                        var y = this.relate_poses[k].y;
                        var x = this.relate_poses[k].x;

                        if (cur_chess * cur_target_chess > 0) {
                            guard_poses[y][x]++;
                        }
                        else {
                            attack_poses[y][x]++;
                            flex_poses[i][j]++;	
                            switch (cur_target_chess)
                            {
                            case R_KING:
                                if (camp_turn == CAMP_BLACK)
                                    return 18888;
                                break;
                            case B_KING:
                                if (camp_turn == CAMP_RED)
                                    return 18888;
                                break;
                            default:
                                // 考虑攻击的棋子的价值
                                // attack_poses[this.relate_poses[k].y][this.relate_poses[k].x] += (30 + (_chess_values[cur_target_chess + 7] - _chess_values[cur_chess + 7])/10)/10;
                                attack_poses[y][x] += _chess_values[cur_target_chess + 7] / 100;
                                break;
                            }
                        }
                    }
                }

                // 空心炮
                if (cur_chess == R_CANNON) {
                    // 红炮
                    var x = j;
                    var y = i - 1;
                    var flag = true;
                    while (y >= 0) {
                        var tc = chesses[y][x];
                        if (tc != NOCHESS && tc != B_KING) {
                            flag = false;
                            break;
                        }
                        y --;
                    }

                    if (flag)
                        chess_values[i][j] += 150 * camp_turn;
                }
                else if (cur_chess == B_CANNON) {
                    // 黑炮
                    var x = j;
                    var y = i + 1;
                    var flag = true;
                    while (y < 10) {
                        var tc = chesses[y][x];
                        if (tc != NOCHESS && tc != R_KING) {
                            flag = false;
                            break;
                        }
                        y ++;
                    }

                    if (flag)
                        chess_values[i][j] -= 150 * camp_turn;
                }

                // 窝心马
                if (cur_chess == R_HORSE) {
                    if (x == 4 && y == 1) {
                        chess_values[i][j] -= 100 * camp_turn;
                    }
                }
                else if (cur_chess == B_HORSE) {
                    if (x == 4 && y == 8) {
                        chess_values[i][j] += 100 * camp_turn;
                    }
                }
            }
        }

        // 小兵的价值 + 机动性
        for(var i = 0; i < 10; i++) {
            for(var j = 0; j < 9; j++) {
                if(chesses[i][j] != NOCHESS) {
                    cur_chess = chesses[i][j];

                    // 机动性
                    chess_values[i][j] += _chess_fexibility[cur_chess + 7] * flex_poses[i][j];

                    // 小兵价值
                    chess_values[i][j] += this._get_bing_value(j, i, chesses);
                }
            }
        }

        // 综合攻击点/防守点 改变每个棋子本身的价值
        var half_value;
        for(var i = 0; i < 10; i++)
        {
            for(var j = 0; j < 9; j++)
            {
                cur_chess = chesses[i][j];
                if(cur_chess)
                {
                    half_value = _chess_values[cur_chess + 7]/16;

                    // 基础价值
                    chess_values[i][j] += _chess_values[cur_chess + 7];
                    
                    if (cur_chess > 0)
                    {
                        // 红棋
                        if (attack_poses[i][j])
                        {
                            if (camp_turn == CAMP_RED)
                            {
                                if (cur_chess == R_KING)
                                {
                                    chess_values[i][j]-= 20;
                                }
                                else
                                {
                                    chess_values[i][j] -= half_value * 2;
                                    if (guard_poses[i][j])
                                        chess_values[i][j] += half_value;
                                }
                            }
                            else
                            {
                                if (cur_chess == R_KING)
                                    return 18888;
                                chess_values[i][j] -= half_value*10;
                                if (guard_poses[i][j])
                                    chess_values[i][j] += half_value*9;
                            }
                            chess_values[i][j] -= attack_poses[i][j];
                        }
                        else
                        {
                            if (guard_poses[i][j])
                                chess_values[i][j] += 5;
                        }
                    }
                    else
                    {
                        // 黑棋
                        if (attack_poses[i][j])
                        {
                            if (camp_turn == CAMP_BLACK)
                            {
                                if (cur_chess == B_KING)
                                {
                                    chess_values[i][j]-= 20;
                                }
                                else
                                {
                                    chess_values[i][j] -= half_value * 2;
                                    if (guard_poses[i][j])
                                        chess_values[i][j] += half_value;
                                }
                            }
                            else
                            {
                                if (cur_chess == B_KING)
                                    return 18888;
                                chess_values[i][j] -= half_value*10;
                                if (guard_poses[i][j])
                                    chess_values[i][j] += half_value*9;
                            }
                            chess_values[i][j] -= attack_poses[i][j];
                        }
                        else
                        {
                            if (guard_poses[i][j])
                                chess_values[i][j] += 5;
                        }
                    }
                }
            }
        }

        // 总结棋子价值
        for(var i = 0; i < 10; i++) {
            for(var j = 0; j < 9; j++)
            {
                cur_chess = chesses[i][j];
                if (cur_chess != NOCHESS)
                {
                    var val = chess_values[i][j];
                    if (cur_chess > 0)
                        sum_value += val;
                    else
                        sum_value -= val;
                }
            }
        }
        
        return sum_value * camp_turn;
    },

    // 增加相关点
    _add_point : function(x, y)
    {
        this.relate_poses.push({x : x, y : y});
    },

    // 获取小兵价值
    _get_bing_value : function(x, y, chesses)
    {
        if (chesses[y][x] == R_PAWN)
            return _pawn_values[y][x];
        
        if (chesses[y][x] == B_PAWN)
            return _pawn_values[9 - y][x];

        return 0;
    },

    // 获取相关棋子
    _get_relate_piece: function(chesses, j, i)
    {
        var flag;
        var x,y;

        this.relate_poses = [];
        var chess = chesses[i][j];

        switch(chess)
        {
        case R_KING:
        case B_KING:
            
            for (y = 0; y < 3; y++)
                for (x = 3; x < 6; x++)
                    if (MoveGenerator.is_valid_move(j, i, x, y))
                        this._add_point(x, y);
            for (y = 7; y < 10; y++)
                for (x = 3; x < 6; x++)
                    if (MoveGenerator.is_valid_move(j, i, x, y))
                        this._add_point(x, y);
            break;
                            
        case R_BISHOP:
            
            for (y = 7; y < 10; y++)
                for (x = 3; x < 6; x++)
                    if (MoveGenerator.is_valid_move(j, i, x, y))
                        this._add_point(x, y);
            break;
                    
        case B_BISHOP:
            
            for (y = 0; y < 3; y++)
                for (x = 3; x < 6; x++)
                    if (MoveGenerator.is_valid_move(j, i, x, y))
                        this._add_point(x, y);
            break;
                    
        case R_ELEPHANT:
        case B_ELEPHANT:
            
            x=j+2;
            y=i+2;
            if(x < 9 && y < 10  && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            
            x=j+2;
            y=i-2;
            if(x < 9 && y>=0  &&  MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            
            x=j-2;
            y=i+2;
            if(x>=0 && y < 10  && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            
            x=j-2;
            y=i-2;
            if(x>=0 && y>=0  && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);

            break;
            
        case R_HORSE:		
        case B_HORSE:		
            x=j+2;
            y=i+1;
            if((x < 9 && y < 10) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
                    
            x=j+2;
            y=i-1;
            if((x < 9 && y >= 0) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            
            x=j-2;
            y=i+1;
            if((x >= 0 && y < 10) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            
            x=j-2;
            y=i-1;
            if((x >= 0 && y >= 0) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            
            x=j+1;
            y=i+2;
            if((x < 9 && y < 10) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            x=j-1;
            y=i+2;
            if((x >= 0 && y < 10) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            x=j+1;
            y=i-2;
            if((x < 9 && y >= 0) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            x=j-1;
            y=i-2;
            if((x >= 0 && y >= 0) && MoveGenerator.is_valid_move(j, i, x, y))
                this._add_point(x, y);
            break;
            
        case R_CAR:
        case B_CAR:
            x = j + 1;
            y = i;
            while(x < 9)
            {
                if( NOCHESS == chesses[y][x] )
                    this._add_point(x, y);
                else
                {
                    this._add_point(x, y);
                    break;
                }
                x++;
            }
            
            x = j-1;
            y = i;
            while(x >= 0)
            {
                if( NOCHESS == chesses[y][x] )
                    this._add_point(x, y);
                else
                {
                    this._add_point(x, y);
                    break;
                }
                x--;
            }
            
            x = j;
            y = i + 1;
            while(y < 10)
            {
                if( NOCHESS == chesses[y][x])
                    this._add_point(x, y);
                else
                {
                    this._add_point(x, y);
                    break;
                }
                y++;
            }
            
            x = j;
            y = i-1;
            while(y>=0)
            {
                if( NOCHESS == chesses[y][x])
                    this._add_point(x, y);
                else
                {
                    this._add_point(x, y);
                    break;
                }
                y--;
            }
            break;
            
        case R_PAWN:
            y = i - 1;
            x = j;
            
            if(y >= 0)
                this._add_point(x, y);
            
            if(i < 5)
            {
                y=i;
                x=j+1;
                if(x < 9 )
                    this._add_point(x, y);
                x=j-1;
                if(x >= 0 )
                    this._add_point(x, y);
            }
            break;
            
        case B_PAWN:
            y = i + 1;
            x = j;
            
            if(y < 10 )
                this._add_point(x, y);
            
            if(i > 4)
            {
                y=i;
                x=j+1;
                if(x < 9)
                    this._add_point(x, y);
                x=j-1;
                if(x >= 0)
                    this._add_point(x, y);
            }
            break;
            
        case B_CANNON:
        case R_CANNON:
            
            x = j + 1;
            y = i;
            flag=false;
            while(x < 9)		
            {
                if( NOCHESS == chesses[y][x] )
                {
                    if(!flag)
                        this._add_point(x, y);
                }
                else
                {
                    if(!flag)
                        flag=true;
                    else 
                    {
                        this._add_point(x, y);
                        break;
                    }
                }
                x++;
            }
            
            x = j - 1;
            flag = false;	
            while(x>=0)
            {
                if( NOCHESS == chesses[y][x] )
                {
                    if(!flag)
                        this._add_point(x, y);
                }
                else
                {
                    if(!flag)
                        flag=true;
                    else 
                    {
                        this._add_point(x, y);
                        break;
                    }
                }
                x--;
            }
            x = j;	
            y = i + 1;
            flag = false;
            while(y < 10)
            {
                if( NOCHESS == chesses[y][x] )
                {
                    if(!flag)
                        this._add_point(x, y);
                }
                else
                {
                    if(!flag)
                        flag=true;
                    else 
                    {
                        this._add_point(x, y);
                        break;
                    }
                }
                y++;
            }
            
            y= i - 1;
            flag = false;	
            while(y >= 0)
            {
                if( NOCHESS == chesses[y][x] )
                {
                    if(!flag)
                        this._add_point(x, y);
                }
                else
                {
                    if(!flag)
                        flag=true;
                    else 
                    {
                        this._add_point(x, y);
                        break;
                    }
                }
                y--;
            }
            break;
            
        default:
            break;
            
        }
    },
}


}, mimetype: "application/javascript", remote: false}; // END: /Evaluater.js


__jah__.resources["/Game.js"] = {data: function (exports, require, module, __filename, __dirname) {
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


}, mimetype: "application/javascript", remote: false}; // END: /Game.js


__jah__.resources["/GameController.js"] = {data: function (exports, require, module, __filename, __dirname) {
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


}, mimetype: "application/javascript", remote: false}; // END: /GameController.js


__jah__.resources["/jquery/jquery-1.7.1.min.js"] = {data: function (exports, require, module, __filename, __dirname) {
/*! jQuery v1.7.1 jquery.com | jquery.org/license */
(function(a,b){function cy(a){return f.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}function cv(a){if(!ck[a]){var b=c.body,d=f("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){cl||(cl=c.createElement("iframe"),cl.frameBorder=cl.width=cl.height=0),b.appendChild(cl);if(!cm||!cl.createElement)cm=(cl.contentWindow||cl.contentDocument).document,cm.write((c.compatMode==="CSS1Compat"?"<!doctype html>":"")+"<html><body>"),cm.close();d=cm.createElement(a),cm.body.appendChild(d),e=f.css(d,"display"),b.removeChild(cl)}ck[a]=e}return ck[a]}function cu(a,b){var c={};f.each(cq.concat.apply([],cq.slice(0,b)),function(){c[this]=a});return c}function ct(){cr=b}function cs(){setTimeout(ct,0);return cr=f.now()}function cj(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function ci(){try{return new a.XMLHttpRequest}catch(b){}}function cc(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var d=a.dataTypes,e={},g,h,i=d.length,j,k=d[0],l,m,n,o,p;for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h=="string"&&(e[h.toLowerCase()]=a.converters[h]);l=k,k=d[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=e[m]||e["* "+k];if(!n){p=b;for(o in e){j=o.split(" ");if(j[0]===l||j[0]==="*"){p=e[j[1]+" "+k];if(p){o=e[o],o===!0?n=p:p===!0&&(n=o);break}}}}!n&&!p&&f.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function cb(a,c,d){var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function ca(a,b,c,d){if(f.isArray(b))f.each(b,function(b,e){c||bE.test(a)?d(a,e):ca(a+"["+(typeof e=="object"||f.isArray(e)?b:"")+"]",e,c,d)});else if(!c&&b!=null&&typeof b=="object")for(var e in b)ca(a+"["+e+"]",b[e],c,d);else d(a,b)}function b_(a,c){var d,e,g=f.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((g[d]?a:e||(e={}))[d]=c[d]);e&&f.extend(!0,a,e)}function b$(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bT,l;for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l=="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=b$(a,c,d,e,l,g)));(k||!l)&&!g["*"]&&(l=b$(a,c,d,e,"*",g));return l}function bZ(a){return function(b,c){typeof b!="string"&&(c=b,b="*");if(f.isFunction(c)){var d=b.toLowerCase().split(bP),e=0,g=d.length,h,i,j;for(;e<g;e++)h=d[e],j=/^\+/.test(h),j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bC(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=b==="width"?bx:by,g=0,h=e.length;if(d>0){if(c!=="border")for(;g<h;g++)c||(d-=parseFloat(f.css(a,"padding"+e[g]))||0),c==="margin"?d+=parseFloat(f.css(a,c+e[g]))||0:d-=parseFloat(f.css(a,"border"+e[g]+"Width"))||0;return d+"px"}d=bz(a,b,b);if(d<0||d==null)d=a.style[b]||0;d=parseFloat(d)||0;if(c)for(;g<h;g++)d+=parseFloat(f.css(a,"padding"+e[g]))||0,c!=="padding"&&(d+=parseFloat(f.css(a,"border"+e[g]+"Width"))||0),c==="margin"&&(d+=parseFloat(f.css(a,c+e[g]))||0);return d+"px"}function bp(a,b){b.src?f.ajax({url:b.src,async:!1,dataType:"script"}):f.globalEval((b.text||b.textContent||b.innerHTML||"").replace(bf,"/*$0*/")),b.parentNode&&b.parentNode.removeChild(b)}function bo(a){var b=c.createElement("div");bh.appendChild(b),b.innerHTML=a.outerHTML;return b.firstChild}function bn(a){var b=(a.nodeName||"").toLowerCase();b==="input"?bm(a):b!=="script"&&typeof a.getElementsByTagName!="undefined"&&f.grep(a.getElementsByTagName("input"),bm)}function bm(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function bl(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bk(a,b){var c;if(b.nodeType===1){b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase();if(c==="object")b.outerHTML=a.outerHTML;else if(c!=="input"||a.type!=="checkbox"&&a.type!=="radio"){if(c==="option")b.selected=a.defaultSelected;else if(c==="input"||c==="textarea")b.defaultValue=a.defaultValue}else a.checked&&(b.defaultChecked=b.checked=a.checked),b.value!==a.value&&(b.value=a.value);b.removeAttribute(f.expando)}}function bj(a,b){if(b.nodeType===1&&!!f.hasData(a)){var c,d,e,g=f._data(a),h=f._data(b,g),i=g.events;if(i){delete h.handle,h.events={};for(c in i)for(d=0,e=i[c].length;d<e;d++)f.event.add(b,c+(i[c][d].namespace?".":"")+i[c][d].namespace,i[c][d],i[c][d].data)}h.data&&(h.data=f.extend({},h.data))}}function bi(a,b){return f.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function U(a){var b=V.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function T(a,b,c){b=b||0;if(f.isFunction(b))return f.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return f.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=f.grep(a,function(a){return a.nodeType===1});if(O.test(b))return f.filter(b,d,!c);b=f.filter(b,d)}return f.grep(a,function(a,d){return f.inArray(a,b)>=0===c})}function S(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function K(){return!0}function J(){return!1}function n(a,b,c){var d=b+"defer",e=b+"queue",g=b+"mark",h=f._data(a,d);h&&(c==="queue"||!f._data(a,e))&&(c==="mark"||!f._data(a,g))&&setTimeout(function(){!f._data(a,e)&&!f._data(a,g)&&(f.removeData(a,d,!0),h.fire())},0)}function m(a){for(var b in a){if(b==="data"&&f.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function l(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(k,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:f.isNumeric(d)?parseFloat(d):j.test(d)?f.parseJSON(d):d}catch(g){}f.data(a,c,d)}else d=b}return d}function h(a){var b=g[a]={},c,d;a=a.split(/\s+/);for(c=0,d=a.length;c<d;c++)b[a[c]]=!0;return b}var c=a.document,d=a.navigator,e=a.location,f=function(){function J(){if(!e.isReady){try{c.documentElement.doScroll("left")}catch(a){setTimeout(J,1);return}e.ready()}}var e=function(a,b){return new e.fn.init(a,b,h)},f=a.jQuery,g=a.$,h,i=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,j=/\S/,k=/^\s+/,l=/\s+$/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=/-([a-z]|[0-9])/ig,w=/^-ms-/,x=function(a,b){return(b+"").toUpperCase()},y=d.userAgent,z,A,B,C=Object.prototype.toString,D=Object.prototype.hasOwnProperty,E=Array.prototype.push,F=Array.prototype.slice,G=String.prototype.trim,H=Array.prototype.indexOf,I={};e.fn=e.prototype={constructor:e,init:function(a,d,f){var g,h,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,this.length=1;return this}if(a==="body"&&!d&&c.body){this.context=c,this[0]=c.body,this.selector=a,this.length=1;return this}if(typeof a=="string"){a.charAt(0)!=="<"||a.charAt(a.length-1)!==">"||a.length<3?g=i.exec(a):g=[null,a,null];if(g&&(g[1]||!d)){if(g[1]){d=d instanceof e?d[0]:d,k=d?d.ownerDocument||d:c,j=m.exec(a),j?e.isPlainObject(d)?(a=[c.createElement(j[1])],e.fn.attr.call(a,d,!0)):a=[k.createElement(j[1])]:(j=e.buildFragment([g[1]],[k]),a=(j.cacheable?e.clone(j.fragment):j.fragment).childNodes);return e.merge(this,a)}h=c.getElementById(g[2]);if(h&&h.parentNode){if(h.id!==g[2])return f.find(a);this.length=1,this[0]=h}this.context=c,this.selector=a;return this}return!d||d.jquery?(d||f).find(a):this.constructor(d).find(a)}if(e.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);return e.makeArray(a,this)},selector:"",jquery:"1.7.1",length:0,size:function(){return this.length},toArray:function(){return F.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=this.constructor();e.isArray(a)?E.apply(d,a):e.merge(d,a),d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")");return d},each:function(a,b){return e.each(this,a,b)},ready:function(a){e.bindReady(),A.add(a);return this},eq:function(a){a=+a;return a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(F.apply(this,arguments),"slice",F.call(arguments).join(","))},map:function(a){return this.pushStack(e.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice},e.fn.init.prototype=e.fn,e.extend=e.fn.extend=function(){var a,c,d,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i=="boolean"&&(l=i,i=arguments[1]||{},j=2),typeof i!="object"&&!e.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){d=i[c],f=a[c];if(i===f)continue;l&&f&&(e.isPlainObject(f)||(g=e.isArray(f)))?(g?(g=!1,h=d&&e.isArray(d)?d:[]):h=d&&e.isPlainObject(d)?d:{},i[c]=e.extend(l,h,f)):f!==b&&(i[c]=f)}return i},e.extend({noConflict:function(b){a.$===e&&(a.$=g),b&&a.jQuery===e&&(a.jQuery=f);return e},isReady:!1,readyWait:1,holdReady:function(a){a?e.readyWait++:e.ready(!0)},ready:function(a){if(a===!0&&!--e.readyWait||a!==!0&&!e.isReady){if(!c.body)return setTimeout(e.ready,1);e.isReady=!0;if(a!==!0&&--e.readyWait>0)return;A.fireWith(c,[e]),e.fn.trigger&&e(c).trigger("ready").off("ready")}},bindReady:function(){if(!A){A=e.Callbacks("once memory");if(c.readyState==="complete")return setTimeout(e.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",B,!1),a.addEventListener("load",e.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",B),a.attachEvent("onload",e.ready);var b=!1;try{b=a.frameElement==null}catch(d){}c.documentElement.doScroll&&b&&J()}}},isFunction:function(a){return e.type(a)==="function"},isArray:Array.isArray||function(a){return e.type(a)==="array"},isWindow:function(a){return a&&typeof a=="object"&&"setInterval"in a},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):I[C.call(a)]||"object"},isPlainObject:function(a){if(!a||e.type(a)!=="object"||a.nodeType||e.isWindow(a))return!1;try{if(a.constructor&&!D.call(a,"constructor")&&!D.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||D.call(a,d)},isEmptyObject:function(a){for(var b in a)return!1;return!0},error:function(a){throw new Error(a)},parseJSON:function(b){if(typeof b!="string"||!b)return null;b=e.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return(new Function("return "+b))();e.error("Invalid JSON: "+b)},parseXML:function(c){var d,f;try{a.DOMParser?(f=new DOMParser,d=f.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(g){d=b}(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&e.error("Invalid XML: "+c);return d},noop:function(){},globalEval:function(b){b&&j.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(w,"ms-").replace(v,x)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,c,d){var f,g=0,h=a.length,i=h===b||e.isFunction(a);if(d){if(i){for(f in a)if(c.apply(a[f],d)===!1)break}else for(;g<h;)if(c.apply(a[g++],d)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break}else for(;g<h;)if(c.call(a[g],g,a[g++])===!1)break;return a},trim:G?function(a){return a==null?"":G.call(a)}:function(a){return a==null?"":(a+"").replace(k,"").replace(l,"")},makeArray:function(a,b){var c=b||[];if(a!=null){var d=e.type(a);a.length==null||d==="string"||d==="function"||d==="regexp"||e.isWindow(a)?E.call(c,a):e.merge(c,a)}return c},inArray:function(a,b,c){var d;if(b){if(H)return H.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length=="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),c!==e&&d.push(a[f]);return d},map:function(a,c,d){var f,g,h=[],i=0,j=a.length,k=a instanceof e||j!==b&&typeof j=="number"&&(j>0&&a[0]&&a[j-1]||j===0||e.isArray(a));if(k)for(;i<j;i++)f=c(a[i],i,d),f!=null&&(h[h.length]=f);else for(g in a)f=c(a[g],g,d),f!=null&&(h[h.length]=f);return h.concat.apply([],h)},guid:1,proxy:function(a,c){if(typeof c=="string"){var d=a[c];c=a,a=d}if(!e.isFunction(a))return b;var f=F.call(arguments,2),g=function(){return a.apply(c,f.concat(F.call(arguments)))};g.guid=a.guid=a.guid||g.guid||e.guid++;return g},access:function(a,c,d,f,g,h){var i=a.length;if(typeof c=="object"){for(var j in c)e.access(a,j,c[j],f,g,d);return a}if(d!==b){f=!h&&f&&e.isFunction(d);for(var k=0;k<i;k++)g(a[k],c,f?d.call(a[k],k,g(a[k],c)):d,h);return a}return i?g(a[0],c):b},now:function(){return(new Date).getTime()},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}e.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function(d,f){f&&f instanceof e&&!(f instanceof a)&&(f=a(f));return e.fn.init.call(this,d,f,b)},a.fn.init.prototype=a.fn;var b=a(c);return a},browser:{}}),e.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){I["[object "+b+"]"]=b.toLowerCase()}),z=e.uaMatch(y),z.browser&&(e.browser[z.browser]=!0,e.browser.version=z.version),e.browser.webkit&&(e.browser.safari=!0),j.test(" ")&&(k=/^[\s\xA0]+/,l=/[\s\xA0]+$/),h=e(c),c.addEventListener?B=function(){c.removeEventListener("DOMContentLoaded",B,!1),e.ready()}:c.attachEvent&&(B=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",B),e.ready())});return e}(),g={};f.Callbacks=function(a){a=a?g[a]||h(a):{};var c=[],d=[],e,i,j,k,l,m=function(b){var d,e,g,h,i;for(d=0,e=b.length;d<e;d++)g=b[d],h=f.type(g),h==="array"?m(g):h==="function"&&(!a.unique||!o.has(g))&&c.push(g)},n=function(b,f){f=f||[],e=!a.memory||[b,f],i=!0,l=j||0,j=0,k=c.length;for(;c&&l<k;l++)if(c[l].apply(b,f)===!1&&a.stopOnFalse){e=!0;break}i=!1,c&&(a.once?e===!0?o.disable():c=[]:d&&d.length&&(e=d.shift(),o.fireWith(e[0],e[1])))},o={add:function(){if(c){var a=c.length;m(arguments),i?k=c.length:e&&e!==!0&&(j=a,n(e[0],e[1]))}return this},remove:function(){if(c){var b=arguments,d=0,e=b.length;for(;d<e;d++)for(var f=0;f<c.length;f++)if(b[d]===c[f]){i&&f<=k&&(k--,f<=l&&l--),c.splice(f--,1);if(a.unique)break}}return this},has:function(a){if(c){var b=0,d=c.length;for(;b<d;b++)if(a===c[b])return!0}return!1},empty:function(){c=[];return this},disable:function(){c=d=e=b;return this},disabled:function(){return!c},lock:function(){d=b,(!e||e===!0)&&o.disable();return this},locked:function(){return!d},fireWith:function(b,c){d&&(i?a.once||d.push([b,c]):(!a.once||!e)&&n(b,c));return this},fire:function(){o.fireWith(this,arguments);return this},fired:function(){return!!e}};return o};var i=[].slice;f.extend({Deferred:function(a){var b=f.Callbacks("once memory"),c=f.Callbacks("once memory"),d=f.Callbacks("memory"),e="pending",g={resolve:b,reject:c,notify:d},h={done:b.add,fail:c.add,progress:d.add,state:function(){return e},isResolved:b.fired,isRejected:c.fired,then:function(a,b,c){i.done(a).fail(b).progress(c);return this},always:function(){i.done.apply(i,arguments).fail.apply(i,arguments);return this},pipe:function(a,b,c){return f.Deferred(function(d){f.each({done:[a,"resolve"],fail:[b,"reject"],progress:[c,"notify"]},function(a,b){var c=b[0],e=b[1],g;f.isFunction(c)?i[a](function(){g=c.apply(this,arguments),g&&f.isFunction(g.promise)?g.promise().then(d.resolve,d.reject,d.notify):d[e+"With"](this===i?d:this,[g])}):i[a](d[e])})}).promise()},promise:function(a){if(a==null)a=h;else for(var b in h)a[b]=h[b];return a}},i=h.promise({}),j;for(j in g)i[j]=g[j].fire,i[j+"With"]=g[j].fireWith;i.done(function(){e="resolved"},c.disable,d.lock).fail(function(){e="rejected"},b.disable,d.lock),a&&a.call(i,i);return i},when:function(a){function m(a){return function(b){e[a]=arguments.length>1?i.call(arguments,0):b,j.notifyWith(k,e)}}function l(a){return function(c){b[a]=arguments.length>1?i.call(arguments,0):c,--g||j.resolveWith(j,b)}}var b=i.call(arguments,0),c=0,d=b.length,e=Array(d),g=d,h=d,j=d<=1&&a&&f.isFunction(a.promise)?a:f.Deferred(),k=j.promise();if(d>1){for(;c<d;c++)b[c]&&b[c].promise&&f.isFunction(b[c].promise)?b[c].promise().then(l(c),j.reject,m(c)):--g;g||j.resolveWith(j,b)}else j!==a&&j.resolveWith(j,d?[a]:[]);return k}}),f.support=function(){var b,d,e,g,h,i,j,k,l,m,n,o,p,q=c.createElement("div"),r=c.documentElement;q.setAttribute("className","t"),q.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>",d=q.getElementsByTagName("*"),e=q.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};g=c.createElement("select"),h=g.appendChild(c.createElement("option")),i=q.getElementsByTagName("input")[0],b={leadingWhitespace:q.firstChild.nodeType===3,tbody:!q.getElementsByTagName("tbody").length,htmlSerialize:!!q.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,checkOn:i.value==="on",optSelected:h.selected,getSetAttribute:q.className!=="t",enctype:!!c.createElement("form").enctype,html5Clone:c.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0},i.checked=!0,b.noCloneChecked=i.cloneNode(!0).checked,g.disabled=!0,b.optDisabled=!h.disabled;try{delete q.test}catch(s){b.deleteExpando=!1}!q.addEventListener&&q.attachEvent&&q.fireEvent&&(q.attachEvent("onclick",function(){b.noCloneEvent=!1}),q.cloneNode(!0).fireEvent("onclick")),i=c.createElement("input"),i.value="t",i.setAttribute("type","radio"),b.radioValue=i.value==="t",i.setAttribute("checked","checked"),q.appendChild(i),k=c.createDocumentFragment(),k.appendChild(q.lastChild),b.checkClone=k.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=i.checked,k.removeChild(i),k.appendChild(q),q.innerHTML="",a.getComputedStyle&&(j=c.createElement("div"),j.style.width="0",j.style.marginRight="0",q.style.width="2px",q.appendChild(j),b.reliableMarginRight=(parseInt((a.getComputedStyle(j,null)||{marginRight:0}).marginRight,10)||0)===0);if(q.attachEvent)for(o in{submit:1,change:1,focusin:1})n="on"+o,p=n in q,p||(q.setAttribute(n,"return;"),p=typeof q[n]=="function"),b[o+"Bubbles"]=p;k.removeChild(q),k=g=h=j=q=i=null,f(function(){var a,d,e,g,h,i,j,k,m,n,o,r=c.getElementsByTagName("body")[0];!r||(j=1,k="position:absolute;top:0;left:0;width:1px;height:1px;margin:0;",m="visibility:hidden;border:0;",n="style='"+k+"border:5px solid #000;padding:0;'",o="<div "+n+"><div></div></div>"+"<table "+n+" cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",a=c.createElement("div"),a.style.cssText=m+"width:0;height:0;position:static;top:0;margin-top:"+j+"px",r.insertBefore(a,r.firstChild),q=c.createElement("div"),a.appendChild(q),q.innerHTML="<table><tr><td style='padding:0;border:0;display:none'></td><td>t</td></tr></table>",l=q.getElementsByTagName("td"),p=l[0].offsetHeight===0,l[0].style.display="",l[1].style.display="none",b.reliableHiddenOffsets=p&&l[0].offsetHeight===0,q.innerHTML="",q.style.width=q.style.paddingLeft="1px",f.boxModel=b.boxModel=q.offsetWidth===2,typeof q.style.zoom!="undefined"&&(q.style.display="inline",q.style.zoom=1,b.inlineBlockNeedsLayout=q.offsetWidth===2,q.style.display="",q.innerHTML="<div style='width:4px;'></div>",b.shrinkWrapBlocks=q.offsetWidth!==2),q.style.cssText=k+m,q.innerHTML=o,d=q.firstChild,e=d.firstChild,h=d.nextSibling.firstChild.firstChild,i={doesNotAddBorder:e.offsetTop!==5,doesAddBorderForTableAndCells:h.offsetTop===5},e.style.position="fixed",e.style.top="20px",i.fixedPosition=e.offsetTop===20||e.offsetTop===15,e.style.position=e.style.top="",d.style.overflow="hidden",d.style.position="relative",i.subtractsBorderForOverflowNotVisible=e.offsetTop===-5,i.doesNotIncludeMarginInBodyOffset=r.offsetTop!==j,r.removeChild(a),q=a=null,f.extend(b,i))});return b}();var j=/^(?:\{.*\}|\[.*\])$/,k=/([A-Z])/g;f.extend({cache:{},uuid:0,expando:"jQuery"+(f.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?f.cache[a[f.expando]]:a[f.expando];return!!a&&!m(a)},data:function(a,c,d,e){if(!!f.acceptData(a)){var g,h,i,j=f.expando,k=typeof c=="string",l=a.nodeType,m=l?f.cache:a,n=l?a[j]:a[j]&&j,o=c==="events";if((!n||!m[n]||!o&&!e&&!m[n].data)&&k&&d===b)return;n||(l?a[j]=n=++f.uuid:n=j),m[n]||(m[n]={},l||(m[n].toJSON=f.noop));if(typeof c=="object"||typeof c=="function")e?m[n]=f.extend(m[n],c):m[n].data=f.extend(m[n].data,c);g=h=m[n],e||(h.data||(h.data={}),h=h.data),d!==b&&(h[f.camelCase(c)]=d);if(o&&!h[c])return g.events;k?(i=h[c],i==null&&(i=h[f.camelCase(c)])):i=h;return i}},removeData:function(a,b,c){if(!!f.acceptData(a)){var d,e,g,h=f.expando,i=a.nodeType,j=i?f.cache:a,k=i?a[h]:h;if(!j[k])return;if(b){d=c?j[k]:j[k].data;if(d){f.isArray(b)||(b in d?b=[b]:(b=f.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,g=b.length;e<g;e++)delete d[b[e]];if(!(c?m:f.isEmptyObject)(d))return}}if(!c){delete j[k].data;if(!m(j[k]))return}f.support.deleteExpando||!j.setInterval?delete j[k]:j[k]=null,i&&(f.support.deleteExpando?delete a[h]:a.removeAttribute?a.removeAttribute(h):a[h]=null)}},_data:function(a,b,c){return f.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=f.noData[a.nodeName.toLowerCase()];if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),f.fn.extend({data:function(a,c){var d,e,g,h=null;if(typeof a=="undefined"){if(this.length){h=f.data(this[0]);if(this[0].nodeType===1&&!f._data(this[0],"parsedAttrs")){e=this[0].attributes;for(var i=0,j=e.length;i<j;i++)g=e[i].name,g.indexOf("data-")===0&&(g=f.camelCase(g.substring(5)),l(this[0],g,h[g]));f._data(this[0],"parsedAttrs",!0)}}return h}if(typeof a=="object")return this.each(function(){f.data(this,a)});d=a.split("."),d[1]=d[1]?"."+d[1]:"";if(c===b){h=this.triggerHandler("getData"+d[1]+"!",[d[0]]),h===b&&this.length&&(h=f.data(this[0],a),h=l(this[0],a,h));return h===b&&d[1]?this.data(d[0]):h}return this.each(function(){var b=f(this),e=[d[0],c];b.triggerHandler("setData"+d[1]+"!",e),f.data(this,a,c),b.triggerHandler("changeData"+d[1]+"!",e)})},removeData:function(a){return this.each(function(){f.removeData(this,a)})}}),f.extend({_mark:function(a,b){a&&(b=(b||"fx")+"mark",f._data(a,b,(f._data(a,b)||0)+1))},_unmark:function(a,b,c){a!==!0&&(c=b,b=a,a=!1);if(b){c=c||"fx";var d=c+"mark",e=a?0:(f._data(b,d)||1)-1;e?f._data(b,d,e):(f.removeData(b,d,!0),n(b,c,"mark"))}},queue:function(a,b,c){var d;if(a){b=(b||"fx")+"queue",d=f._data(a,b),c&&(!d||f.isArray(c)?d=f._data(a,b,f.makeArray(c)):d.push(c));return d||[]}},dequeue:function(a,b){b=b||"fx";var c=f.queue(a,b),d=c.shift(),e={};d==="inprogress"&&(d=c.shift()),d&&(b==="fx"&&c.unshift("inprogress"),f._data(a,b+".run",e),d.call(a,function(){f.dequeue(a,b)},e)),c.length||(f.removeData(a,b+"queue "+b+".run",!0),n(a,b,"queue"))}}),f.fn.extend({queue:function(a,c){typeof a!="string"&&(c=a,a="fx");if(c===b)return f.queue(this[0],a);return this.each(function(){var b=f.queue(this,a,c);a==="fx"&&b[0]!=="inprogress"&&f.dequeue(this,a)})},dequeue:function(a){return this.each(function(){f.dequeue(this,a)})},delay:function(a,b){a=f.fx?f.fx.speeds[a]||a:a,b=b||"fx";return this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){function m(){--h||d.resolveWith(e,[e])}typeof a!="string"&&(c=a,a=b),a=a||"fx";var d=f.Deferred(),e=this,g=e.length,h=1,i=a+"defer",j=a+"queue",k=a+"mark",l;while(g--)if(l=f.data(e[g],i,b,!0)||(f.data(e[g],j,b,!0)||f.data(e[g],k,b,!0))&&f.data(e[g],i,f.Callbacks("once memory"),!0))h++,l.add(m);m();return d.promise()}});var o=/[\n\t\r]/g,p=/\s+/,q=/\r/g,r=/^(?:button|input)$/i,s=/^(?:button|input|object|select|textarea)$/i,t=/^a(?:rea)?$/i,u=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,v=f.support.getSetAttribute,w,x,y;f.fn.extend({attr:function(a,b){return f.access(this,a,b,!0,f.attr)},removeAttr:function(a){return this.each(function(){f.removeAttr(this,a)})},prop:function(a,b){return f.access(this,a,b,!0,f.prop)},removeProp:function(a){a=f.propFix[a]||a;return this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,g,h,i;if(f.isFunction(a))return this.each(function(b){f(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(p);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{g=" "+e.className+" ";for(h=0,i=b.length;h<i;h++)~g.indexOf(" "+b[h]+" ")||(g+=b[h]+" ");e.className=f.trim(g)}}}return this},removeClass:function(a){var c,d,e,g,h,i,j;if(f.isFunction(a))return this.each(function(b){f(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(p);for(d=0,e=this.length;d<e;d++){g=this[d];if(g.nodeType===1&&g.className)if(a){h=(" "+g.className+" ").replace(o," ");for(i=0,j=c.length;i<j;i++)h=h.replace(" "+c[i]+" "," ");g.className=f.trim(h)}else g.className=""}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";if(f.isFunction(a))return this.each(function(c){f(this).toggleClass(a.call(this,c,this.className,b),b)});return this.each(function(){if(c==="string"){var e,g=0,h=f(this),i=b,j=a.split(p);while(e=j[g++])i=d?i:!h.hasClass(e),h[i?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&f._data(this,"__className__",this.className),this.className=this.className||a===!1?"":f._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(o," ").indexOf(b)>-1)return!0;return!1},val:function(a){var c,d,e,g=this[0];{if(!!arguments.length){e=f.isFunction(a);return this.each(function(d){var g=f(this),h;if(this.nodeType===1){e?h=a.call(this,d,g.val()):h=a,h==null?h="":typeof h=="number"?h+="":f.isArray(h)&&(h=f.map(h,function(a){return a==null?"":a+""})),c=f.valHooks[this.nodeName.toLowerCase()]||f.valHooks[this.type];if(!c||!("set"in c)||c.set(this,h,"value")===b)this.value=h}})}if(g){c=f.valHooks[g.nodeName.toLowerCase()]||f.valHooks[g.type];if(c&&"get"in c&&(d=c.get(g,"value"))!==b)return d;d=g.value;return typeof d=="string"?d.replace(q,""):d==null?"":d}}}}),f.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,g=a.selectedIndex,h=[],i=a.options,j=a.type==="select-one";if(g<0)return null;c=j?g:0,d=j?g+1:i.length;for(;c<d;c++){e=i[c];if(e.selected&&(f.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!f.nodeName(e.parentNode,"optgroup"))){b=f(e).val();if(j)return b;h.push(b)}}if(j&&!h.length&&i.length)return f(i[g]).val();return h},set:function(a,b){var c=f.makeArray(b);f(a).find("option").each(function(){this.selected=f.inArray(f(this).val(),c)>=0}),c.length||(a.selectedIndex=-1);return c}}},attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0},attr:function(a,c,d,e){var g,h,i,j=a.nodeType;if(!!a&&j!==3&&j!==8&&j!==2){if(e&&c in f.attrFn)return f(a)[c](d);if(typeof a.getAttribute=="undefined")return f.prop(a,c,d);i=j!==1||!f.isXMLDoc(a),i&&(c=c.toLowerCase(),h=f.attrHooks[c]||(u.test(c)?x:w));if(d!==b){if(d===null){f.removeAttr(a,c);return}if(h&&"set"in h&&i&&(g=h.set(a,d,c))!==b)return g;a.setAttribute(c,""+d);return d}if(h&&"get"in h&&i&&(g=h.get(a,c))!==null)return g;g=a.getAttribute(c);return g===null?b:g}},removeAttr:function(a,b){var c,d,e,g,h=0;if(b&&a.nodeType===1){d=b.toLowerCase().split(p),g=d.length;for(;h<g;h++)e=d[h],e&&(c=f.propFix[e]||e,f.attr(a,e,""),a.removeAttribute(v?e:c),u.test(e)&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(r.test(a.nodeName)&&a.parentNode)f.error("type property can't be changed");else if(!f.support.radioValue&&b==="radio"&&f.nodeName(a,"input")){var c=a.value;a.setAttribute("type",b),c&&(a.value=c);return b}}},value:{get:function(a,b){if(w&&f.nodeName(a,"button"))return w.get(a,b);return b in a?a.value:null},set:function(a,b,c){if(w&&f.nodeName(a,"button"))return w.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,g,h,i=a.nodeType;if(!!a&&i!==3&&i!==8&&i!==2){h=i!==1||!f.isXMLDoc(a),h&&(c=f.propFix[c]||c,g=f.propHooks[c]);return d!==b?g&&"set"in g&&(e=g.set(a,d,c))!==b?e:a[c]=d:g&&"get"in g&&(e=g.get(a,c))!==null?e:a[c]}},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):s.test(a.nodeName)||t.test(a.nodeName)&&a.href?0:b}}}}),f.attrHooks.tabindex=f.propHooks.tabIndex,x={get:function(a,c){var d,e=f.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;b===!1?f.removeAttr(a,c):(d=f.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase()));return c}},v||(y={name:!0,id:!0},w=f.valHooks.button={get:function(a,c){var d;d=a.getAttributeNode(c);return d&&(y[c]?d.nodeValue!=="":d.specified)?d.nodeValue:b},set:function(a,b,d){var e=a.getAttributeNode(d);e||(e=c.createAttribute(d),a.setAttributeNode(e));return e.nodeValue=b+""}},f.attrHooks.tabindex.set=w.set,f.each(["width","height"],function(a,b){f.attrHooks[b]=f.extend(f.attrHooks[b],{set:function(a,c){if(c===""){a.setAttribute(b,"auto");return c}}})}),f.attrHooks.contenteditable={get:w.get,set:function(a,b,c){b===""&&(b="false"),w.set(a,b,c)}}),f.support.hrefNormalized||f.each(["href","src","width","height"],function(a,c){f.attrHooks[c]=f.extend(f.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),f.support.style||(f.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=""+b}}),f.support.optSelected||(f.propHooks.selected=f.extend(f.propHooks.selected,{get:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);return null}})),f.support.enctype||(f.propFix.enctype="encoding"),f.support.checkOn||f.each(["radio","checkbox"],function(){f.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),f.each(["radio","checkbox"],function(){f.valHooks[this]=f.extend(f.valHooks[this],{set:function(a,b){if(f.isArray(b))return a.checked=f.inArray(f(a).val(),b)>=0}})});var z=/^(?:textarea|input|select)$/i,A=/^([^\.]*)?(?:\.(.+))?$/,B=/\bhover(\.\S+)?\b/,C=/^key/,D=/^(?:mouse|contextmenu)|click/,E=/^(?:focusinfocus|focusoutblur)$/,F=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,G=function(a){var b=F.exec(a);b&&(b[1]=(b[1]||"").toLowerCase(),b[3]=b[3]&&new RegExp("(?:^|\\s)"+b[3]+"(?:\\s|$)"));return b},H=function(a,b){var c=a.attributes||{};return(!b[1]||a.nodeName.toLowerCase()===b[1])&&(!b[2]||(c.id||{}).value===b[2])&&(!b[3]||b[3].test((c["class"]||{}).value))},I=function(a){return f.event.special.hover?a:a.replace(B,"mouseenter$1 mouseleave$1")};
f.event={add:function(a,c,d,e,g){var h,i,j,k,l,m,n,o,p,q,r,s;if(!(a.nodeType===3||a.nodeType===8||!c||!d||!(h=f._data(a)))){d.handler&&(p=d,d=p.handler),d.guid||(d.guid=f.guid++),j=h.events,j||(h.events=j={}),i=h.handle,i||(h.handle=i=function(a){return typeof f!="undefined"&&(!a||f.event.triggered!==a.type)?f.event.dispatch.apply(i.elem,arguments):b},i.elem=a),c=f.trim(I(c)).split(" ");for(k=0;k<c.length;k++){l=A.exec(c[k])||[],m=l[1],n=(l[2]||"").split(".").sort(),s=f.event.special[m]||{},m=(g?s.delegateType:s.bindType)||m,s=f.event.special[m]||{},o=f.extend({type:m,origType:l[1],data:e,handler:d,guid:d.guid,selector:g,quick:G(g),namespace:n.join(".")},p),r=j[m];if(!r){r=j[m]=[],r.delegateCount=0;if(!s.setup||s.setup.call(a,e,n,i)===!1)a.addEventListener?a.addEventListener(m,i,!1):a.attachEvent&&a.attachEvent("on"+m,i)}s.add&&(s.add.call(a,o),o.handler.guid||(o.handler.guid=d.guid)),g?r.splice(r.delegateCount++,0,o):r.push(o),f.event.global[m]=!0}a=null}},global:{},remove:function(a,b,c,d,e){var g=f.hasData(a)&&f._data(a),h,i,j,k,l,m,n,o,p,q,r,s;if(!!g&&!!(o=g.events)){b=f.trim(I(b||"")).split(" ");for(h=0;h<b.length;h++){i=A.exec(b[h])||[],j=k=i[1],l=i[2];if(!j){for(j in o)f.event.remove(a,j+b[h],c,d,!0);continue}p=f.event.special[j]||{},j=(d?p.delegateType:p.bindType)||j,r=o[j]||[],m=r.length,l=l?new RegExp("(^|\\.)"+l.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(n=0;n<r.length;n++)s=r[n],(e||k===s.origType)&&(!c||c.guid===s.guid)&&(!l||l.test(s.namespace))&&(!d||d===s.selector||d==="**"&&s.selector)&&(r.splice(n--,1),s.selector&&r.delegateCount--,p.remove&&p.remove.call(a,s));r.length===0&&m!==r.length&&((!p.teardown||p.teardown.call(a,l)===!1)&&f.removeEvent(a,j,g.handle),delete o[j])}f.isEmptyObject(o)&&(q=g.handle,q&&(q.elem=null),f.removeData(a,["events","handle"],!0))}},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,e,g){if(!e||e.nodeType!==3&&e.nodeType!==8){var h=c.type||c,i=[],j,k,l,m,n,o,p,q,r,s;if(E.test(h+f.event.triggered))return;h.indexOf("!")>=0&&(h=h.slice(0,-1),k=!0),h.indexOf(".")>=0&&(i=h.split("."),h=i.shift(),i.sort());if((!e||f.event.customEvent[h])&&!f.event.global[h])return;c=typeof c=="object"?c[f.expando]?c:new f.Event(h,c):new f.Event(h),c.type=h,c.isTrigger=!0,c.exclusive=k,c.namespace=i.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+i.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,o=h.indexOf(":")<0?"on"+h:"";if(!e){j=f.cache;for(l in j)j[l].events&&j[l].events[h]&&f.event.trigger(c,d,j[l].handle.elem,!0);return}c.result=b,c.target||(c.target=e),d=d!=null?f.makeArray(d):[],d.unshift(c),p=f.event.special[h]||{};if(p.trigger&&p.trigger.apply(e,d)===!1)return;r=[[e,p.bindType||h]];if(!g&&!p.noBubble&&!f.isWindow(e)){s=p.delegateType||h,m=E.test(s+h)?e:e.parentNode,n=null;for(;m;m=m.parentNode)r.push([m,s]),n=m;n&&n===e.ownerDocument&&r.push([n.defaultView||n.parentWindow||a,s])}for(l=0;l<r.length&&!c.isPropagationStopped();l++)m=r[l][0],c.type=r[l][1],q=(f._data(m,"events")||{})[c.type]&&f._data(m,"handle"),q&&q.apply(m,d),q=o&&m[o],q&&f.acceptData(m)&&q.apply(m,d)===!1&&c.preventDefault();c.type=h,!g&&!c.isDefaultPrevented()&&(!p._default||p._default.apply(e.ownerDocument,d)===!1)&&(h!=="click"||!f.nodeName(e,"a"))&&f.acceptData(e)&&o&&e[h]&&(h!=="focus"&&h!=="blur"||c.target.offsetWidth!==0)&&!f.isWindow(e)&&(n=e[o],n&&(e[o]=null),f.event.triggered=h,e[h](),f.event.triggered=b,n&&(e[o]=n));return c.result}},dispatch:function(c){c=f.event.fix(c||a.event);var d=(f._data(this,"events")||{})[c.type]||[],e=d.delegateCount,g=[].slice.call(arguments,0),h=!c.exclusive&&!c.namespace,i=[],j,k,l,m,n,o,p,q,r,s,t;g[0]=c,c.delegateTarget=this;if(e&&!c.target.disabled&&(!c.button||c.type!=="click")){m=f(this),m.context=this.ownerDocument||this;for(l=c.target;l!=this;l=l.parentNode||this){o={},q=[],m[0]=l;for(j=0;j<e;j++)r=d[j],s=r.selector,o[s]===b&&(o[s]=r.quick?H(l,r.quick):m.is(s)),o[s]&&q.push(r);q.length&&i.push({elem:l,matches:q})}}d.length>e&&i.push({elem:this,matches:d.slice(e)});for(j=0;j<i.length&&!c.isPropagationStopped();j++){p=i[j],c.currentTarget=p.elem;for(k=0;k<p.matches.length&&!c.isImmediatePropagationStopped();k++){r=p.matches[k];if(h||!c.namespace&&!r.namespace||c.namespace_re&&c.namespace_re.test(r.namespace))c.data=r.data,c.handleObj=r,n=((f.event.special[r.origType]||{}).handle||r.handler).apply(p.elem,g),n!==b&&(c.result=n,n===!1&&(c.preventDefault(),c.stopPropagation()))}}return c.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode);return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,d){var e,f,g,h=d.button,i=d.fromElement;a.pageX==null&&d.clientX!=null&&(e=a.target.ownerDocument||c,f=e.documentElement,g=e.body,a.pageX=d.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=d.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?d.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0);return a}},fix:function(a){if(a[f.expando])return a;var d,e,g=a,h=f.event.fixHooks[a.type]||{},i=h.props?this.props.concat(h.props):this.props;a=f.Event(g);for(d=i.length;d;)e=i[--d],a[e]=g[e];a.target||(a.target=g.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey===b&&(a.metaKey=a.ctrlKey);return h.filter?h.filter(a,g):a},special:{ready:{setup:f.bindReady},load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){f.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=f.extend(new f.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?f.event.trigger(e,null,b):f.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},f.event.handle=f.event.dispatch,f.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},f.Event=function(a,b){if(!(this instanceof f.Event))return new f.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?K:J):this.type=a,b&&f.extend(this,b),this.timeStamp=a&&a.timeStamp||f.now(),this[f.expando]=!0},f.Event.prototype={preventDefault:function(){this.isDefaultPrevented=K;var a=this.originalEvent;!a||(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){this.isPropagationStopped=K;var a=this.originalEvent;!a||(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=K,this.stopPropagation()},isDefaultPrevented:J,isPropagationStopped:J,isImmediatePropagationStopped:J},f.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){f.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c=this,d=a.relatedTarget,e=a.handleObj,g=e.selector,h;if(!d||d!==c&&!f.contains(c,d))a.type=e.origType,h=e.handler.apply(this,arguments),a.type=b;return h}}}),f.support.submitBubbles||(f.event.special.submit={setup:function(){if(f.nodeName(this,"form"))return!1;f.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=f.nodeName(c,"input")||f.nodeName(c,"button")?c.form:b;d&&!d._submit_attached&&(f.event.add(d,"submit._submit",function(a){this.parentNode&&!a.isTrigger&&f.event.simulate("submit",this.parentNode,a,!0)}),d._submit_attached=!0)})},teardown:function(){if(f.nodeName(this,"form"))return!1;f.event.remove(this,"._submit")}}),f.support.changeBubbles||(f.event.special.change={setup:function(){if(z.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")f.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),f.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1,f.event.simulate("change",this,a,!0))});return!1}f.event.add(this,"beforeactivate._change",function(a){var b=a.target;z.test(b.nodeName)&&!b._change_attached&&(f.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&f.event.simulate("change",this.parentNode,a,!0)}),b._change_attached=!0)})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){f.event.remove(this,"._change");return z.test(this.nodeName)}}),f.support.focusinBubbles||f.each({focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){f.event.simulate(b,a.target,f.event.fix(a),!0)};f.event.special[b]={setup:function(){d++===0&&c.addEventListener(a,e,!0)},teardown:function(){--d===0&&c.removeEventListener(a,e,!0)}}}),f.fn.extend({on:function(a,c,d,e,g){var h,i;if(typeof a=="object"){typeof c!="string"&&(d=c,c=b);for(i in a)this.on(i,c,d,a[i],g);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=J;else if(!e)return this;g===1&&(h=e,e=function(a){f().off(a);return h.apply(this,arguments)},e.guid=h.guid||(h.guid=f.guid++));return this.each(function(){f.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on.call(this,a,b,c,d,1)},off:function(a,c,d){if(a&&a.preventDefault&&a.handleObj){var e=a.handleObj;f(a.delegateTarget).off(e.namespace?e.type+"."+e.namespace:e.type,e.selector,e.handler);return this}if(typeof a=="object"){for(var g in a)this.off(g,c,a[g]);return this}if(c===!1||typeof c=="function")d=c,c=b;d===!1&&(d=J);return this.each(function(){f.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){f(this.context).on(a,this.selector,b,c);return this},die:function(a,b){f(this.context).off(a,this.selector||"**",b);return this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length==1?this.off(a,"**"):this.off(b,a,c)},trigger:function(a,b){return this.each(function(){f.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return f.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||f.guid++,d=0,e=function(c){var e=(f._data(this,"lastToggle"+a.guid)||0)%d;f._data(this,"lastToggle"+a.guid,e+1),c.preventDefault();return b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){f.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.on(b,null,a,c):this.trigger(b)},f.attrFn&&(f.attrFn[b]=!0),C.test(b)&&(f.event.fixHooks[b]=f.event.keyHooks),D.test(b)&&(f.event.fixHooks[b]=f.event.mouseHooks)}),function(){function x(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}if(j.nodeType===1){g||(j[d]=c,j.sizset=h);if(typeof b!="string"){if(j===b){k=!0;break}}else if(m.filter(b,[j]).length>0){k=j;break}}j=j[a]}e[h]=k}}}function w(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}j.nodeType===1&&!g&&(j[d]=c,j.sizset=h);if(j.nodeName.toLowerCase()===b){k=j;break}j=j[a]}e[h]=k}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,d="sizcache"+(Math.random()+"").replace(".",""),e=0,g=Object.prototype.toString,h=!1,i=!0,j=/\\/g,k=/\r\n/g,l=/\W/;[0,0].sort(function(){i=!1;return 0});var m=function(b,d,e,f){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];if(!b||typeof b!="string")return e;var i,j,k,l,n,q,r,t,u=!0,v=m.isXML(d),w=[],x=b;do{a.exec(""),i=a.exec(x);if(i){x=i[3],w.push(i[1]);if(i[2]){l=i[3];break}}}while(i);if(w.length>1&&p.exec(b))if(w.length===2&&o.relative[w[0]])j=y(w[0]+w[1],d,f);else{j=o.relative[w[0]]?[d]:m(w.shift(),d);while(w.length)b=w.shift(),o.relative[b]&&(b+=w.shift()),j=y(b,j,f)}else{!f&&w.length>1&&d.nodeType===9&&!v&&o.match.ID.test(w[0])&&!o.match.ID.test(w[w.length-1])&&(n=m.find(w.shift(),d,v),d=n.expr?m.filter(n.expr,n.set)[0]:n.set[0]);if(d){n=f?{expr:w.pop(),set:s(f)}:m.find(w.pop(),w.length===1&&(w[0]==="~"||w[0]==="+")&&d.parentNode?d.parentNode:d,v),j=n.expr?m.filter(n.expr,n.set):n.set,w.length>0?k=s(j):u=!1;while(w.length)q=w.pop(),r=q,o.relative[q]?r=w.pop():q="",r==null&&(r=d),o.relative[q](k,r,v)}else k=w=[]}k||(k=j),k||m.error(q||b);if(g.call(k)==="[object Array]")if(!u)e.push.apply(e,k);else if(d&&d.nodeType===1)for(t=0;k[t]!=null;t++)k[t]&&(k[t]===!0||k[t].nodeType===1&&m.contains(d,k[t]))&&e.push(j[t]);else for(t=0;k[t]!=null;t++)k[t]&&k[t].nodeType===1&&e.push(j[t]);else s(k,e);l&&(m(l,h,e,f),m.uniqueSort(e));return e};m.uniqueSort=function(a){if(u){h=i,a.sort(u);if(h)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a},m.matches=function(a,b){return m(a,null,null,b)},m.matchesSelector=function(a,b){return m(b,null,null,[a]).length>0},m.find=function(a,b,c){var d,e,f,g,h,i;if(!a)return[];for(e=0,f=o.order.length;e<f;e++){h=o.order[e];if(g=o.leftMatch[h].exec(a)){i=g[1],g.splice(1,1);if(i.substr(i.length-1)!=="\\"){g[1]=(g[1]||"").replace(j,""),d=o.find[h](g,b,c);if(d!=null){a=a.replace(o.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!="undefined"?b.getElementsByTagName("*"):[]);return{set:d,expr:a}},m.filter=function(a,c,d,e){var f,g,h,i,j,k,l,n,p,q=a,r=[],s=c,t=c&&c[0]&&m.isXML(c[0]);while(a&&c.length){for(h in o.filter)if((f=o.leftMatch[h].exec(a))!=null&&f[2]){k=o.filter[h],l=f[1],g=!1,f.splice(1,1);if(l.substr(l.length-1)==="\\")continue;s===r&&(r=[]);if(o.preFilter[h]){f=o.preFilter[h](f,s,d,r,e,t);if(!f)g=i=!0;else if(f===!0)continue}if(f)for(n=0;(j=s[n])!=null;n++)j&&(i=k(j,f,n,s),p=e^i,d&&i!=null?p?g=!0:s[n]=!1:p&&(r.push(j),g=!0));if(i!==b){d||(s=r),a=a.replace(o.match[h],"");if(!g)return[];break}}if(a===q)if(g==null)m.error(a);else break;q=a}return s},m.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)};var n=m.getText=function(a){var b,c,d=a.nodeType,e="";if(d){if(d===1||d===9){if(typeof a.textContent=="string")return a.textContent;if(typeof a.innerText=="string")return a.innerText.replace(k,"");for(a=a.firstChild;a;a=a.nextSibling)e+=n(a)}else if(d===3||d===4)return a.nodeValue}else for(b=0;c=a[b];b++)c.nodeType!==8&&(e+=n(c));return e},o=m.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b=="string",d=c&&!l.test(b),e=c&&!d;d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1);a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&m.filter(b,a,!0)},">":function(a,b){var c,d=typeof b=="string",e=0,f=a.length;if(d&&!l.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&m.filter(b,a,!0)}},"":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("parentNode",b,f,a,d,c)},"~":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("previousSibling",b,f,a,d,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!="undefined"&&!c){var d=b.getElementById(a[1]);return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!="undefined"){var c=[],d=b.getElementsByName(a[1]);for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c}},TAG:function(a,b){if(typeof b.getElementsByTagName!="undefined")return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(j,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));return!1},ID:function(a){return a[1].replace(j,"")},TAG:function(a,b){return a[1].replace(j,"").toLowerCase()},CHILD:function(a){if(a[1]==="nth"){a[2]||m.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&m.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){var g=a[1]=a[1].replace(j,"");!f&&o.attrMap[g]&&(a[1]=o.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(j,""),a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=m(b[3],null,null,c);else{var g=m.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(o.match.POS.test(b[0])||o.match.CHILD.test(b[0]))return!0;return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden"},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!m(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){var b=a.getAttribute("type"),c=a.type;return a.nodeName.toLowerCase()==="input"&&"text"===c&&(b===c||b===null)},radio:function(a){return a.nodeName.toLowerCase()==="input"&&"radio"===a.type},checkbox:function(a){return a.nodeName.toLowerCase()==="input"&&"checkbox"===a.type},file:function(a){return a.nodeName.toLowerCase()==="input"&&"file"===a.type},password:function(a){return a.nodeName.toLowerCase()==="input"&&"password"===a.type},submit:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"submit"===a.type},image:function(a){return a.nodeName.toLowerCase()==="input"&&"image"===a.type},reset:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"reset"===a.type},button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&"button"===a.type||b==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)},focus:function(a){return a===a.ownerDocument.activeElement}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=o.filters[e];if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||n([a])||"").indexOf(b[3])>=0;if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}m.error(e)},CHILD:function(a,b){var c,e,f,g,h,i,j,k=b[1],l=a;switch(k){case"only":case"first":while(l=l.previousSibling)if(l.nodeType===1)return!1;if(k==="first")return!0;l=a;case"last":while(l=l.nextSibling)if(l.nodeType===1)return!1;return!0;case"nth":c=b[2],e=b[3];if(c===1&&e===0)return!0;f=b[0],g=a.parentNode;if(g&&(g[d]!==f||!a.nodeIndex)){i=0;for(l=g.firstChild;l;l=l.nextSibling)l.nodeType===1&&(l.nodeIndex=++i);g[d]=f}j=a.nodeIndex-e;return c===0?j===0:j%c===0&&j/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||!!a.nodeName&&a.nodeName.toLowerCase()===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=m.attr?m.attr(a,c):o.attrHandle[c]?o.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];return d==null?f==="!=":!f&&m.attr?d!=null:f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1},POS:function(a,b,c,d){var e=b[2],f=o.setFilters[e];if(f)return f(a,c,b,d)}}},p=o.match.POS,q=function(a,b){return"\\"+(b-0+1)};for(var r in o.match)o.match[r]=new RegExp(o.match[r].source+/(?![^\[]*\])(?![^\(]*\))/.source),o.leftMatch[r]=new RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[r].source.replace(/\\(\d+)/g,q));var s=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(t){s=function(a,b){var c=0,d=b||[];if(g.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length=="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);return d}}var u,v;c.documentElement.compareDocumentPosition?u=function(a,b){if(a===b){h=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;return a.compareDocumentPosition(b)&4?-1:1}:(u=function(a,b){if(a===b){h=!0;return 0}if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,i=b.parentNode,j=g;if(g===i)return v(a,b);if(!g)return-1;if(!i)return 1;while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return v(e[k],f[k]);return k===c?v(a,f[k],-1):v(e[k],b,1)},v=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}),function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(o.find.ID=function(a,c,d){if(typeof c.getElementById!="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[]}},o.filter.ID=function(a,b){var c=typeof a.getAttributeNode!="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),a.getElementsByTagName("*").length>0&&(o.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(o.attrHandle.href=function(a){return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=m,b=c.createElement("div"),d="__sizzle__";b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){m=function(b,e,f,g){e=e||c;if(!g&&!m.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){if(h[1])return s(e.getElementsByTagName(b),f);if(h[2]&&o.find.CLASS&&e.getElementsByClassName)return s(e.getElementsByClassName(h[2]),f)}if(e.nodeType===9){if(b==="body"&&e.body)return s([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);if(!i||!i.parentNode)return s([],f);if(i.id===h[3])return s([i],f)}try{return s(e.querySelectorAll(b),f)}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var k=e,l=e.getAttribute("id"),n=l||d,p=e.parentNode,q=/^\s*[+~]/.test(b);l?n=n.replace(/'/g,"\\$&"):e.setAttribute("id",n),q&&p&&(e=e.parentNode);try{if(!q||p)return s(e.querySelectorAll("[id='"+n+"'] "+b),f)}catch(r){}finally{l||k.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)m[e]=a[e];b=null}}(),function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector;if(b){var d=!b.call(c.createElement("div"),"div"),e=!1;try{b.call(c.documentElement,"[test!='']:sizzle")}catch(f){e=!0}m.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!m.isXML(a))try{if(e||!o.match.PSEUDO.test(c)&&!/!=/.test(c)){var f=b.call(a,c);if(f||!d||a.document&&a.document.nodeType!==11)return f}}catch(g){}return m(c,null,null,[a]).length>0}}}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(!!a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;o.order.splice(1,0,"CLASS"),o.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!="undefined"&&!c)return b.getElementsByClassName(a[1])},a=null}}(),c.documentElement.contains?m.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0)}:c.documentElement.compareDocumentPosition?m.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16)}:m.contains=function(){return!1},m.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1};var y=function(a,b,c){var d,e=[],f="",g=b.nodeType?[b]:b;while(d=o.match.PSEUDO.exec(a))f+=d[0],a=a.replace(o.match.PSEUDO,"");a=o.relative[a]?a+"*":a;for(var h=0,i=g.length;h<i;h++)m(a,g[h],e,c);return m.filter(f,e)};m.attr=f.attr,m.selectors.attrMap={},f.find=m,f.expr=m.selectors,f.expr[":"]=f.expr.filters,f.unique=m.uniqueSort,f.text=m.getText,f.isXMLDoc=m.isXML,f.contains=m.contains}();var L=/Until$/,M=/^(?:parents|prevUntil|prevAll)/,N=/,/,O=/^.[^:#\[\.,]*$/,P=Array.prototype.slice,Q=f.expr.match.POS,R={children:!0,contents:!0,next:!0,prev:!0};f.fn.extend({find:function(a){var b=this,c,d;if(typeof a!="string")return f(a).filter(function(){for(c=0,d=b.length;c<d;c++)if(f.contains(b[c],this))return!0});var e=this.pushStack("","find",a),g,h,i;for(c=0,d=this.length;c<d;c++){g=e.length,f.find(a,this[c],e);if(c>0)for(h=g;h<e.length;h++)for(i=0;i<g;i++)if(e[i]===e[h]){e.splice(h--,1);break}}return e},has:function(a){var b=f(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(f.contains(this,b[a]))return!0})},not:function(a){return this.pushStack(T(this,a,!1),"not",a)},filter:function(a){return this.pushStack(T(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?Q.test(a)?f(a,this.context).index(this[0])>=0:f.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c=[],d,e,g=this[0];if(f.isArray(a)){var h=1;while(g&&g.ownerDocument&&g!==b){for(d=0;d<a.length;d++)f(g).is(a[d])&&c.push({selector:a[d],elem:g,level:h});g=g.parentNode,h++}return c}var i=Q.test(a)||typeof a!="string"?f(a,b||this.context):0;for(d=0,e=this.length;d<e;d++){g=this[d];while(g){if(i?i.index(g)>-1:f.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break}}c=c.length>1?f.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a)return this[0]&&this[0].parentNode?this.prevAll().length:-1;if(typeof a=="string")return f.inArray(this[0],f(a));return f.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var c=typeof a=="string"?f(a,b):f.makeArray(a&&a.nodeType?[a]:a),d=f.merge(this.get(),c);return this.pushStack(S(c[0])||S(d[0])?d:f.unique(d))},andSelf:function(){return this.add(this.prevObject)}}),f.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return f.dir(a,"parentNode")},parentsUntil:function(a,b,c){return f.dir(a,"parentNode",c)},next:function(a){return f.nth(a,2,"nextSibling")},prev:function(a){return f.nth(a,2,"previousSibling")},nextAll:function(a){return f.dir(a,"nextSibling")},prevAll:function(a){return f.dir(a,"previousSibling")},nextUntil:function(a,b,c){return f.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return f.dir(a,"previousSibling",c)},siblings:function(a){return f.sibling(a.parentNode.firstChild,a)},children:function(a){return f.sibling(a.firstChild)},contents:function(a){return f.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:f.makeArray(a.childNodes)}},function(a,b){f.fn[a]=function(c,d){var e=f.map(this,b,c);L.test(a)||(d=c),d&&typeof d=="string"&&(e=f.filter(d,e)),e=this.length>1&&!R[a]?f.unique(e):e,(this.length>1||N.test(d))&&M.test(a)&&(e=e.reverse());return this.pushStack(e,a,P.call(arguments).join(","))}}),f.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?f.find.matchesSelector(b[0],a)?[b[0]]:[]:f.find.matches(a,b)},dir:function(a,c,d){var e=[],g=a[c];while(g&&g.nodeType!==9&&(d===b||g.nodeType!==1||!f(g).is(d)))g.nodeType===1&&e.push(g),g=g[c];return e},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var V="abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",W=/ jQuery\d+="(?:\d+|null)"/g,X=/^\s+/,Y=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,Z=/<([\w:]+)/,$=/<tbody/i,_=/<|&#?\w+;/,ba=/<(?:script|style)/i,bb=/<(?:script|object|embed|option|style)/i,bc=new RegExp("<(?:"+V+")","i"),bd=/checked\s*(?:[^=]|=\s*.checked.)/i,be=/\/(java|ecma)script/i,bf=/^\s*<!(?:\[CDATA\[|\-\-)/,bg={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bh=U(c);bg.optgroup=bg.option,bg.tbody=bg.tfoot=bg.colgroup=bg.caption=bg.thead,bg.th=bg.td,f.support.htmlSerialize||(bg._default=[1,"div<div>","</div>"]),f.fn.extend({text:function(a){if(f.isFunction(a))return this.each(function(b){var c=f(this);c.text(a.call(this,b,c.text()))});if(typeof a!="object"&&a!==b)return this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a));return f.text(this)},wrapAll:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapAll(a.call(this,b))});if(this[0]){var b=f(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapInner(a.call(this,b))});return this.each(function(){var b=f(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=f.isFunction(a);return this.each(function(c){f(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){f.nodeName(this,"body")||f(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=f.clean(arguments);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,f.clean(arguments));return a}},remove:function(a,b){for(var c=0,d;(d=this[c])!=null;c++)if(!a||f.filter(a,[d]).length)!b&&d.nodeType===1&&(f.cleanData(d.getElementsByTagName("*")),f.cleanData([d])),d.parentNode&&d.parentNode.removeChild(d);return this},empty:function()
{for(var a=0,b;(b=this[a])!=null;a++){b.nodeType===1&&f.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild)}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return f.clone(this,a,b)})},html:function(a){if(a===b)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(W,""):null;if(typeof a=="string"&&!ba.test(a)&&(f.support.leadingWhitespace||!X.test(a))&&!bg[(Z.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Y,"<$1></$2>");try{for(var c=0,d=this.length;c<d;c++)this[c].nodeType===1&&(f.cleanData(this[c].getElementsByTagName("*")),this[c].innerHTML=a)}catch(e){this.empty().append(a)}}else f.isFunction(a)?this.each(function(b){var c=f(this);c.html(a.call(this,b,c.html()))}):this.empty().append(a);return this},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(f.isFunction(a))return this.each(function(b){var c=f(this),d=c.html();c.replaceWith(a.call(this,b,d))});typeof a!="string"&&(a=f(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;f(this).remove(),b?f(b).before(a):f(c).append(a)})}return this.length?this.pushStack(f(f.isFunction(a)?a():a),"replaceWith",a):this},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){var e,g,h,i,j=a[0],k=[];if(!f.support.checkClone&&arguments.length===3&&typeof j=="string"&&bd.test(j))return this.each(function(){f(this).domManip(a,c,d,!0)});if(f.isFunction(j))return this.each(function(e){var g=f(this);a[0]=j.call(this,e,c?g.html():b),g.domManip(a,c,d)});if(this[0]){i=j&&j.parentNode,f.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?e={fragment:i}:e=f.buildFragment(a,this,k),h=e.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;if(g){c=c&&f.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)d.call(c?bi(this[l],g):this[l],e.cacheable||m>1&&l<n?f.clone(h,!0,!0):h)}k.length&&f.each(k,bp)}return this}}),f.buildFragment=function(a,b,d){var e,g,h,i,j=a[0];b&&b[0]&&(i=b[0].ownerDocument||b[0]),i.createDocumentFragment||(i=c),a.length===1&&typeof j=="string"&&j.length<512&&i===c&&j.charAt(0)==="<"&&!bb.test(j)&&(f.support.checkClone||!bd.test(j))&&(f.support.html5Clone||!bc.test(j))&&(g=!0,h=f.fragments[j],h&&h!==1&&(e=h)),e||(e=i.createDocumentFragment(),f.clean(a,i,e,d)),g&&(f.fragments[j]=h?e:1);return{fragment:e,cacheable:g}},f.fragments={},f.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){f.fn[a]=function(c){var d=[],e=f(c),g=this.length===1&&this[0].parentNode;if(g&&g.nodeType===11&&g.childNodes.length===1&&e.length===1){e[b](this[0]);return this}for(var h=0,i=e.length;h<i;h++){var j=(h>0?this.clone(!0):this).get();f(e[h])[b](j),d=d.concat(j)}return this.pushStack(d,a,e.selector)}}),f.extend({clone:function(a,b,c){var d,e,g,h=f.support.html5Clone||!bc.test("<"+a.nodeName)?a.cloneNode(!0):bo(a);if((!f.support.noCloneEvent||!f.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!f.isXMLDoc(a)){bk(a,h),d=bl(a),e=bl(h);for(g=0;d[g];++g)e[g]&&bk(d[g],e[g])}if(b){bj(a,h);if(c){d=bl(a),e=bl(h);for(g=0;d[g];++g)bj(d[g],e[g])}}d=e=null;return h},clean:function(a,b,d,e){var g;b=b||c,typeof b.createElement=="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);var h=[],i;for(var j=0,k;(k=a[j])!=null;j++){typeof k=="number"&&(k+="");if(!k)continue;if(typeof k=="string")if(!_.test(k))k=b.createTextNode(k);else{k=k.replace(Y,"<$1></$2>");var l=(Z.exec(k)||["",""])[1].toLowerCase(),m=bg[l]||bg._default,n=m[0],o=b.createElement("div");b===c?bh.appendChild(o):U(b).appendChild(o),o.innerHTML=m[1]+k+m[2];while(n--)o=o.lastChild;if(!f.support.tbody){var p=$.test(k),q=l==="table"&&!p?o.firstChild&&o.firstChild.childNodes:m[1]==="<table>"&&!p?o.childNodes:[];for(i=q.length-1;i>=0;--i)f.nodeName(q[i],"tbody")&&!q[i].childNodes.length&&q[i].parentNode.removeChild(q[i])}!f.support.leadingWhitespace&&X.test(k)&&o.insertBefore(b.createTextNode(X.exec(k)[0]),o.firstChild),k=o.childNodes}var r;if(!f.support.appendChecked)if(k[0]&&typeof (r=k.length)=="number")for(i=0;i<r;i++)bn(k[i]);else bn(k);k.nodeType?h.push(k):h=f.merge(h,k)}if(d){g=function(a){return!a.type||be.test(a.type)};for(j=0;h[j];j++)if(e&&f.nodeName(h[j],"script")&&(!h[j].type||h[j].type.toLowerCase()==="text/javascript"))e.push(h[j].parentNode?h[j].parentNode.removeChild(h[j]):h[j]);else{if(h[j].nodeType===1){var s=f.grep(h[j].getElementsByTagName("script"),g);h.splice.apply(h,[j+1,0].concat(s))}d.appendChild(h[j])}}return h},cleanData:function(a){var b,c,d=f.cache,e=f.event.special,g=f.support.deleteExpando;for(var h=0,i;(i=a[h])!=null;h++){if(i.nodeName&&f.noData[i.nodeName.toLowerCase()])continue;c=i[f.expando];if(c){b=d[c];if(b&&b.events){for(var j in b.events)e[j]?f.event.remove(i,j):f.removeEvent(i,j,b.handle);b.handle&&(b.handle.elem=null)}g?delete i[f.expando]:i.removeAttribute&&i.removeAttribute(f.expando),delete d[c]}}}});var bq=/alpha\([^)]*\)/i,br=/opacity=([^)]*)/,bs=/([A-Z]|^ms)/g,bt=/^-?\d+(?:px)?$/i,bu=/^-?\d/,bv=/^([\-+])=([\-+.\de]+)/,bw={position:"absolute",visibility:"hidden",display:"block"},bx=["Left","Right"],by=["Top","Bottom"],bz,bA,bB;f.fn.css=function(a,c){if(arguments.length===2&&c===b)return this;return f.access(this,a,c,!0,function(a,c,d){return d!==b?f.style(a,c,d):f.css(a,c)})},f.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=bz(a,"opacity","opacity");return c===""?"1":c}return a.style.opacity}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":f.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!!a&&a.nodeType!==3&&a.nodeType!==8&&!!a.style){var g,h,i=f.camelCase(c),j=a.style,k=f.cssHooks[i];c=f.cssProps[i]||i;if(d===b){if(k&&"get"in k&&(g=k.get(a,!1,e))!==b)return g;return j[c]}h=typeof d,h==="string"&&(g=bv.exec(d))&&(d=+(g[1]+1)*+g[2]+parseFloat(f.css(a,c)),h="number");if(d==null||h==="number"&&isNaN(d))return;h==="number"&&!f.cssNumber[i]&&(d+="px");if(!k||!("set"in k)||(d=k.set(a,d))!==b)try{j[c]=d}catch(l){}}},css:function(a,c,d){var e,g;c=f.camelCase(c),g=f.cssHooks[c],c=f.cssProps[c]||c,c==="cssFloat"&&(c="float");if(g&&"get"in g&&(e=g.get(a,!0,d))!==b)return e;if(bz)return bz(a,c)},swap:function(a,b,c){var d={};for(var e in b)d[e]=a.style[e],a.style[e]=b[e];c.call(a);for(e in b)a.style[e]=d[e]}}),f.curCSS=f.css,f.each(["height","width"],function(a,b){f.cssHooks[b]={get:function(a,c,d){var e;if(c){if(a.offsetWidth!==0)return bC(a,b,d);f.swap(a,bw,function(){e=bC(a,b,d)});return e}},set:function(a,b){if(!bt.test(b))return b;b=parseFloat(b);if(b>=0)return b+"px"}}}),f.support.opacity||(f.cssHooks.opacity={get:function(a,b){return br.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=f.isNumeric(b)?"alpha(opacity="+b*100+")":"",g=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&f.trim(g.replace(bq,""))===""){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bq.test(g)?g.replace(bq,e):g+" "+e}}),f(function(){f.support.reliableMarginRight||(f.cssHooks.marginRight={get:function(a,b){var c;f.swap(a,{display:"inline-block"},function(){b?c=bz(a,"margin-right","marginRight"):c=a.style.marginRight});return c}})}),c.defaultView&&c.defaultView.getComputedStyle&&(bA=function(a,b){var c,d,e;b=b.replace(bs,"-$1").toLowerCase(),(d=a.ownerDocument.defaultView)&&(e=d.getComputedStyle(a,null))&&(c=e.getPropertyValue(b),c===""&&!f.contains(a.ownerDocument.documentElement,a)&&(c=f.style(a,b)));return c}),c.documentElement.currentStyle&&(bB=function(a,b){var c,d,e,f=a.currentStyle&&a.currentStyle[b],g=a.style;f===null&&g&&(e=g[b])&&(f=e),!bt.test(f)&&bu.test(f)&&(c=g.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),g.left=b==="fontSize"?"1em":f||0,f=g.pixelLeft+"px",g.left=c,d&&(a.runtimeStyle.left=d));return f===""?"auto":f}),bz=bA||bB,f.expr&&f.expr.filters&&(f.expr.filters.hidden=function(a){var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!f.support.reliableHiddenOffsets&&(a.style&&a.style.display||f.css(a,"display"))==="none"},f.expr.filters.visible=function(a){return!f.expr.filters.hidden(a)});var bD=/%20/g,bE=/\[\]$/,bF=/\r?\n/g,bG=/#.*$/,bH=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bI=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bJ=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,bK=/^(?:GET|HEAD)$/,bL=/^\/\//,bM=/\?/,bN=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bO=/^(?:select|textarea)/i,bP=/\s+/,bQ=/([?&])_=[^&]*/,bR=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,bS=f.fn.load,bT={},bU={},bV,bW,bX=["*/"]+["*"];try{bV=e.href}catch(bY){bV=c.createElement("a"),bV.href="",bV=bV.href}bW=bR.exec(bV.toLowerCase())||[],f.fn.extend({load:function(a,c,d){if(typeof a!="string"&&bS)return bS.apply(this,arguments);if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var g=a.slice(e,a.length);a=a.slice(0,e)}var h="GET";c&&(f.isFunction(c)?(d=c,c=b):typeof c=="object"&&(c=f.param(c,f.ajaxSettings.traditional),h="POST"));var i=this;f.ajax({url:a,type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){c=a}),i.html(g?f("<div>").append(c.replace(bN,"")).find(g):c)),d&&i.each(d,[c,b,a])}});return this},serialize:function(){return f.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?f.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||bO.test(this.nodeName)||bI.test(this.type))}).map(function(a,b){var c=f(this).val();return c==null?null:f.isArray(c)?f.map(c,function(a,c){return{name:b.name,value:a.replace(bF,"\r\n")}}):{name:b.name,value:c.replace(bF,"\r\n")}}).get()}}),f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){f.fn[b]=function(a){return this.on(b,a)}}),f.each(["get","post"],function(a,c){f[c]=function(a,d,e,g){f.isFunction(d)&&(g=g||e,e=d,d=b);return f.ajax({type:c,url:a,data:d,success:e,dataType:g})}}),f.extend({getScript:function(a,c){return f.get(a,b,c,"script")},getJSON:function(a,b,c){return f.get(a,b,c,"json")},ajaxSetup:function(a,b){b?b_(a,f.ajaxSettings):(b=a,a=f.ajaxSettings),b_(a,b);return a},ajaxSettings:{url:bV,isLocal:bJ.test(bW[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":bX},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":f.parseJSON,"text xml":f.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:bZ(bT),ajaxTransport:bZ(bU),ajax:function(a,c){function w(a,c,l,m){if(s!==2){s=2,q&&clearTimeout(q),p=b,n=m||"",v.readyState=a>0?4:0;var o,r,u,w=c,x=l?cb(d,v,l):b,y,z;if(a>=200&&a<300||a===304){if(d.ifModified){if(y=v.getResponseHeader("Last-Modified"))f.lastModified[k]=y;if(z=v.getResponseHeader("Etag"))f.etag[k]=z}if(a===304)w="notmodified",o=!0;else try{r=cc(d,x),w="success",o=!0}catch(A){w="parsererror",u=A}}else{u=w;if(!w||a)w="error",a<0&&(a=0)}v.status=a,v.statusText=""+(c||w),o?h.resolveWith(e,[r,w,v]):h.rejectWith(e,[v,w,u]),v.statusCode(j),j=b,t&&g.trigger("ajax"+(o?"Success":"Error"),[v,d,o?r:u]),i.fireWith(e,[v,w]),t&&(g.trigger("ajaxComplete",[v,d]),--f.active||f.event.trigger("ajaxStop"))}}typeof a=="object"&&(c=a,a=b),c=c||{};var d=f.ajaxSetup({},c),e=d.context||d,g=e!==d&&(e.nodeType||e instanceof f)?f(e):f.event,h=f.Deferred(),i=f.Callbacks("once memory"),j=d.statusCode||{},k,l={},m={},n,o,p,q,r,s=0,t,u,v={readyState:0,setRequestHeader:function(a,b){if(!s){var c=a.toLowerCase();a=m[c]=m[c]||a,l[a]=b}return this},getAllResponseHeaders:function(){return s===2?n:null},getResponseHeader:function(a){var c;if(s===2){if(!o){o={};while(c=bH.exec(n))o[c[1].toLowerCase()]=c[2]}c=o[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){s||(d.mimeType=a);return this},abort:function(a){a=a||"abort",p&&p.abort(a),w(0,a);return this}};h.promise(v),v.success=v.done,v.error=v.fail,v.complete=i.add,v.statusCode=function(a){if(a){var b;if(s<2)for(b in a)j[b]=[j[b],a[b]];else b=a[v.status],v.then(b,b)}return this},d.url=((a||d.url)+"").replace(bG,"").replace(bL,bW[1]+"//"),d.dataTypes=f.trim(d.dataType||"*").toLowerCase().split(bP),d.crossDomain==null&&(r=bR.exec(d.url.toLowerCase()),d.crossDomain=!(!r||r[1]==bW[1]&&r[2]==bW[2]&&(r[3]||(r[1]==="http:"?80:443))==(bW[3]||(bW[1]==="http:"?80:443)))),d.data&&d.processData&&typeof d.data!="string"&&(d.data=f.param(d.data,d.traditional)),b$(bT,d,c,v);if(s===2)return!1;t=d.global,d.type=d.type.toUpperCase(),d.hasContent=!bK.test(d.type),t&&f.active++===0&&f.event.trigger("ajaxStart");if(!d.hasContent){d.data&&(d.url+=(bM.test(d.url)?"&":"?")+d.data,delete d.data),k=d.url;if(d.cache===!1){var x=f.now(),y=d.url.replace(bQ,"$1_="+x);d.url=y+(y===d.url?(bM.test(d.url)?"&":"?")+"_="+x:"")}}(d.data&&d.hasContent&&d.contentType!==!1||c.contentType)&&v.setRequestHeader("Content-Type",d.contentType),d.ifModified&&(k=k||d.url,f.lastModified[k]&&v.setRequestHeader("If-Modified-Since",f.lastModified[k]),f.etag[k]&&v.setRequestHeader("If-None-Match",f.etag[k])),v.setRequestHeader("Accept",d.dataTypes[0]&&d.accepts[d.dataTypes[0]]?d.accepts[d.dataTypes[0]]+(d.dataTypes[0]!=="*"?", "+bX+"; q=0.01":""):d.accepts["*"]);for(u in d.headers)v.setRequestHeader(u,d.headers[u]);if(d.beforeSend&&(d.beforeSend.call(e,v,d)===!1||s===2)){v.abort();return!1}for(u in{success:1,error:1,complete:1})v[u](d[u]);p=b$(bU,d,c,v);if(!p)w(-1,"No Transport");else{v.readyState=1,t&&g.trigger("ajaxSend",[v,d]),d.async&&d.timeout>0&&(q=setTimeout(function(){v.abort("timeout")},d.timeout));try{s=1,p.send(l,w)}catch(z){if(s<2)w(-1,z);else throw z}}return v},param:function(a,c){var d=[],e=function(a,b){b=f.isFunction(b)?b():b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=f.ajaxSettings.traditional);if(f.isArray(a)||a.jquery&&!f.isPlainObject(a))f.each(a,function(){e(this.name,this.value)});else for(var g in a)ca(g,a[g],c,e);return d.join("&").replace(bD,"+")}}),f.extend({active:0,lastModified:{},etag:{}});var cd=f.now(),ce=/(\=)\?(&|$)|\?\?/i;f.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return f.expando+"_"+cd++}}),f.ajaxPrefilter("json jsonp",function(b,c,d){var e=b.contentType==="application/x-www-form-urlencoded"&&typeof b.data=="string";if(b.dataTypes[0]==="jsonp"||b.jsonp!==!1&&(ce.test(b.url)||e&&ce.test(b.data))){var g,h=b.jsonpCallback=f.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2";b.jsonp!==!1&&(j=j.replace(ce,l),b.url===j&&(e&&(k=k.replace(ce,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),b.url=j,b.data=k,a[h]=function(a){g=[a]},d.always(function(){a[h]=i,g&&f.isFunction(i)&&a[h](g[0])}),b.converters["script json"]=function(){g||f.error(h+" was not called");return g[0]},b.dataTypes[0]="json";return"script"}}),f.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){f.globalEval(a);return a}}}),f.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),f.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(c||!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){d&&d.onload(0,1)}}}});var cf=a.ActiveXObject?function(){for(var a in ch)ch[a](0,1)}:!1,cg=0,ch;f.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&ci()||cj()}:ci,function(a){f.extend(f.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(f.ajaxSettings.xhr()),f.support.ajax&&f.ajaxTransport(function(c){if(!c.crossDomain||f.support.cors){var d;return{send:function(e,g){var h=c.xhr(),i,j;c.username?h.open(c.type,c.url,c.async,c.username,c.password):h.open(c.type,c.url,c.async);if(c.xhrFields)for(j in c.xhrFields)h[j]=c.xhrFields[j];c.mimeType&&h.overrideMimeType&&h.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(j in e)h.setRequestHeader(j,e[j])}catch(k){}h.send(c.hasContent&&c.data||null),d=function(a,e){var j,k,l,m,n;try{if(d&&(e||h.readyState===4)){d=b,i&&(h.onreadystatechange=f.noop,cf&&delete ch[i]);if(e)h.readyState!==4&&h.abort();else{j=h.status,l=h.getAllResponseHeaders(),m={},n=h.responseXML,n&&n.documentElement&&(m.xml=n),m.text=h.responseText;try{k=h.statusText}catch(o){k=""}!j&&c.isLocal&&!c.crossDomain?j=m.text?200:404:j===1223&&(j=204)}}}catch(p){e||g(-1,p)}m&&g(j,k,m,l)},!c.async||h.readyState===4?d():(i=++cg,cf&&(ch||(ch={},f(a).unload(cf)),ch[i]=d),h.onreadystatechange=d)},abort:function(){d&&d(0,1)}}}});var ck={},cl,cm,cn=/^(?:toggle|show|hide)$/,co=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,cp,cq=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],cr;f.fn.extend({show:function(a,b,c){var d,e;if(a||a===0)return this.animate(cu("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)d=this[g],d.style&&(e=d.style.display,!f._data(d,"olddisplay")&&e==="none"&&(e=d.style.display=""),e===""&&f.css(d,"display")==="none"&&f._data(d,"olddisplay",cv(d.nodeName)));for(g=0;g<h;g++){d=this[g];if(d.style){e=d.style.display;if(e===""||e==="none")d.style.display=f._data(d,"olddisplay")||""}}return this},hide:function(a,b,c){if(a||a===0)return this.animate(cu("hide",3),a,b,c);var d,e,g=0,h=this.length;for(;g<h;g++)d=this[g],d.style&&(e=f.css(d,"display"),e!=="none"&&!f._data(d,"olddisplay")&&f._data(d,"olddisplay",e));for(g=0;g<h;g++)this[g].style&&(this[g].style.display="none");return this},_toggle:f.fn.toggle,toggle:function(a,b,c){var d=typeof a=="boolean";f.isFunction(a)&&f.isFunction(b)?this._toggle.apply(this,arguments):a==null||d?this.each(function(){var b=d?a:f(this).is(":hidden");f(this)[b?"show":"hide"]()}):this.animate(cu("toggle",3),a,b,c);return this},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){function g(){e.queue===!1&&f._mark(this);var b=f.extend({},e),c=this.nodeType===1,d=c&&f(this).is(":hidden"),g,h,i,j,k,l,m,n,o;b.animatedProperties={};for(i in a){g=f.camelCase(i),i!==g&&(a[g]=a[i],delete a[i]),h=a[g],f.isArray(h)?(b.animatedProperties[g]=h[1],h=a[g]=h[0]):b.animatedProperties[g]=b.specialEasing&&b.specialEasing[g]||b.easing||"swing";if(h==="hide"&&d||h==="show"&&!d)return b.complete.call(this);c&&(g==="height"||g==="width")&&(b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY],f.css(this,"display")==="inline"&&f.css(this,"float")==="none"&&(!f.support.inlineBlockNeedsLayout||cv(this.nodeName)==="inline"?this.style.display="inline-block":this.style.zoom=1))}b.overflow!=null&&(this.style.overflow="hidden");for(i in a)j=new f.fx(this,b,i),h=a[i],cn.test(h)?(o=f._data(this,"toggle"+i)||(h==="toggle"?d?"show":"hide":0),o?(f._data(this,"toggle"+i,o==="show"?"hide":"show"),j[o]()):j[h]()):(k=co.exec(h),l=j.cur(),k?(m=parseFloat(k[2]),n=k[3]||(f.cssNumber[i]?"":"px"),n!=="px"&&(f.style(this,i,(m||1)+n),l=(m||1)/j.cur()*l,f.style(this,i,l+n)),k[1]&&(m=(k[1]==="-="?-1:1)*m+l),j.custom(l,m,n)):j.custom(l,h,""));return!0}var e=f.speed(b,c,d);if(f.isEmptyObject(a))return this.each(e.complete,[!1]);a=f.extend({},a);return e.queue===!1?this.each(g):this.queue(e.queue,g)},stop:function(a,c,d){typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]);return this.each(function(){function h(a,b,c){var e=b[c];f.removeData(a,c,!0),e.stop(d)}var b,c=!1,e=f.timers,g=f._data(this);d||f._unmark(!0,this);if(a==null)for(b in g)g[b]&&g[b].stop&&b.indexOf(".run")===b.length-4&&h(this,g,b);else g[b=a+".run"]&&g[b].stop&&h(this,g,b);for(b=e.length;b--;)e[b].elem===this&&(a==null||e[b].queue===a)&&(d?e[b](!0):e[b].saveState(),c=!0,e.splice(b,1));(!d||!c)&&f.dequeue(this,a)})}}),f.each({slideDown:cu("show",1),slideUp:cu("hide",1),slideToggle:cu("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){f.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),f.extend({speed:function(a,b,c){var d=a&&typeof a=="object"?f.extend({},a):{complete:c||!c&&b||f.isFunction(a)&&a,duration:a,easing:c&&b||b&&!f.isFunction(b)&&b};d.duration=f.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in f.fx.speeds?f.fx.speeds[d.duration]:f.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";d.old=d.complete,d.complete=function(a){f.isFunction(d.old)&&d.old.call(this),d.queue?f.dequeue(this,d.queue):a!==!1&&f._unmark(this)};return d},easing:{linear:function(a,b,c,d){return c+d*a},swing:function(a,b,c,d){return(-Math.cos(a*Math.PI)/2+.5)*d+c}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,this.prop=c,b.orig=b.orig||{}}}),f.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(f.fx.step[this.prop]||f.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=f.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,c,d){function h(a){return e.step(a)}var e=this,g=f.fx;this.startTime=cr||cs(),this.end=c,this.now=this.start=a,this.pos=this.state=0,this.unit=d||this.unit||(f.cssNumber[this.prop]?"":"px"),h.queue=this.options.queue,h.elem=this.elem,h.saveState=function(){e.options.hide&&f._data(e.elem,"fxshow"+e.prop)===b&&f._data(e.elem,"fxshow"+e.prop,e.start)},h()&&f.timers.push(h)&&!cp&&(cp=setInterval(g.tick,g.interval))},show:function(){var a=f._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=a||f.style(this.elem,this.prop),this.options.show=!0,a!==b?this.custom(this.cur(),a):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),f(this.elem).show()},hide:function(){this.options.orig[this.prop]=f._data(this.elem,"fxshow"+this.prop)||f.style(this.elem,this.prop),this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b,c,d,e=cr||cs(),g=!0,h=this.elem,i=this.options;if(a||e>=i.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),i.animatedProperties[this.prop]=!0;for(b in i.animatedProperties)i.animatedProperties[b]!==!0&&(g=!1);if(g){i.overflow!=null&&!f.support.shrinkWrapBlocks&&f.each(["","X","Y"],function(a,b){h.style["overflow"+b]=i.overflow[a]}),i.hide&&f(h).hide();if(i.hide||i.show)for(b in i.animatedProperties)f.style(h,b,i.orig[b]),f.removeData(h,"fxshow"+b,!0),f.removeData(h,"toggle"+b,!0);d=i.complete,d&&(i.complete=!1,d.call(h))}return!1}i.duration==Infinity?this.now=e:(c=e-this.startTime,this.state=c/i.duration,this.pos=f.easing[i.animatedProperties[this.prop]](this.state,c,0,1,i.duration),this.now=this.start+(this.end-this.start)*this.pos),this.update();return!0}},f.extend(f.fx,{tick:function(){var a,b=f.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||f.fx.stop()},interval:13,stop:function(){clearInterval(cp),cp=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){f.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=a.now+a.unit:a.elem[a.prop]=a.now}}}),f.each(["width","height"],function(a,b){f.fx.step[b]=function(a){f.style(a.elem,b,Math.max(0,a.now)+a.unit)}}),f.expr&&f.expr.filters&&(f.expr.filters.animated=function(a){return f.grep(f.timers,function(b){return a===b.elem}).length});var cw=/^t(?:able|d|h)$/i,cx=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?f.fn.offset=function(a){var b=this[0],c;if(a)return this.each(function(b){f.offset.setOffset(this,a,b)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return f.offset.bodyOffset(b);try{c=b.getBoundingClientRect()}catch(d){}var e=b.ownerDocument,g=e.documentElement;if(!c||!f.contains(g,b))return c?{top:c.top,left:c.left}:{top:0,left:0};var h=e.body,i=cy(e),j=g.clientTop||h.clientTop||0,k=g.clientLeft||h.clientLeft||0,l=i.pageYOffset||f.support.boxModel&&g.scrollTop||h.scrollTop,m=i.pageXOffset||f.support.boxModel&&g.scrollLeft||h.scrollLeft,n=c.top+l-j,o=c.left+m-k;return{top:n,left:o}}:f.fn.offset=function(a){var b=this[0];if(a)return this.each(function(b){f.offset.setOffset(this,a,b)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return f.offset.bodyOffset(b);var c,d=b.offsetParent,e=b,g=b.ownerDocument,h=g.documentElement,i=g.body,j=g.defaultView,k=j?j.getComputedStyle(b,null):b.currentStyle,l=b.offsetTop,m=b.offsetLeft;while((b=b.parentNode)&&b!==i&&b!==h){if(f.support.fixedPosition&&k.position==="fixed")break;c=j?j.getComputedStyle(b,null):b.currentStyle,l-=b.scrollTop,m-=b.scrollLeft,b===d&&(l+=b.offsetTop,m+=b.offsetLeft,f.support.doesNotAddBorder&&(!f.support.doesAddBorderForTableAndCells||!cw.test(b.nodeName))&&(l+=parseFloat(c.borderTopWidth)||0,m+=parseFloat(c.borderLeftWidth)||0),e=d,d=b.offsetParent),f.support.subtractsBorderForOverflowNotVisible&&c.overflow!=="visible"&&(l+=parseFloat(c.borderTopWidth)||0,m+=parseFloat(c.borderLeftWidth)||0),k=c}if(k.position==="relative"||k.position==="static")l+=i.offsetTop,m+=i.offsetLeft;f.support.fixedPosition&&k.position==="fixed"&&(l+=Math.max(h.scrollTop,i.scrollTop),m+=Math.max(h.scrollLeft,i.scrollLeft));return{top:l,left:m}},f.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;f.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(f.css(a,"marginTop"))||0,c+=parseFloat(f.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var d=f.css(a,"position");d==="static"&&(a.style.position="relative");var e=f(a),g=e.offset(),h=f.css(a,"top"),i=f.css(a,"left"),j=(d==="absolute"||d==="fixed")&&f.inArray("auto",[h,i])>-1,k={},l={},m,n;j?(l=e.position(),m=l.top,n=l.left):(m=parseFloat(h)||0,n=parseFloat(i)||0),f.isFunction(b)&&(b=b.call(a,c,g)),b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):e.css(k)}},f.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),d=cx.test(b[0].nodeName)?{top:0,left:0}:b.offset();c.top-=parseFloat(f.css(a,"marginTop"))||0,c.left-=parseFloat(f.css(a,"marginLeft"))||0,d.top+=parseFloat(f.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(f.css(b[0],"borderLeftWidth"))||0;return{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;while(a&&!cx.test(a.nodeName)&&f.css(a,"position")==="static")a=a.offsetParent;return a})}}),f.each(["Left","Top"],function(a,c){var d="scroll"+c;f.fn[d]=function(c){var e,g;if(c===b){e=this[0];if(!e)return null;g=cy(e);return g?"pageXOffset"in g?g[a?"pageYOffset":"pageXOffset"]:f.support.boxModel&&g.document.documentElement[d]||g.document.body[d]:e[d]}return this.each(function(){g=cy(this),g?g.scrollTo(a?f(g).scrollLeft():c,a?c:f(g).scrollTop()):this[d]=c})}}),f.each(["Height","Width"],function(a,c){var d=c.toLowerCase();f.fn["inner"+c]=function(){var a=this[0];return a?a.style?parseFloat(f.css(a,d,"padding")):this[d]():null},f.fn["outer"+c]=function(a){var b=this[0];return b?b.style?parseFloat(f.css(b,d,a?"margin":"border")):this[d]():null},f.fn[d]=function(a){var e=this[0];if(!e)return a==null?null:this;if(f.isFunction(a))return this.each(function(b){var c=f(this);c[d](a.call(this,b,c[d]()))});if(f.isWindow(e)){var g=e.document.documentElement["client"+c],h=e.document.body;return e.document.compatMode==="CSS1Compat"&&g||h&&h["client"+c]||g}if(e.nodeType===9)return Math.max(e.documentElement["client"+c],e.body["scroll"+c],e.documentElement["scroll"+c],e.body["offset"+c],e.documentElement["offset"+c]);if(a===b){var i=f.css(e,d),j=parseFloat(i);return f.isNumeric(j)?j:i}return this.css(d,typeof a=="string"?a:a+"px")}}),a.jQuery=a.$=f,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return f})})(window);
}, mimetype: "application/javascript", remote: false}; // END: /jquery/jquery-1.7.1.min.js


__jah__.resources["/jquery/jquery-impromptu.js"] = {data: function (exports, require, module, __filename, __dirname) {
/*
 * jQuery Impromptu
 * By: Trent Richardson [http://trentrichardson.com]
 * Version 3.2
 * Last Modified: 10/31/2011
 * 
 * Copyright 2011 Trent Richardson
 * Dual licensed under the MIT and GPL licenses.
 * http://trentrichardson.com/Impromptu/GPL-LICENSE.txt
 * http://trentrichardson.com/Impromptu/MIT-LICENSE.txt
 * 
 */
 
(function($) {
	$.prompt = function(message, options) {
		options = $.extend({},$.prompt.defaults,options);
		$.prompt.currentPrefix = options.prefix;

		var ie6		= ($.browser.msie && $.browser.version < 7);
		var $body	= $(document.body);
		var $window	= $(window);
		
		options.classes = $.trim(options.classes);
		if(options.classes != '')
			options.classes = ' '+ options.classes;
			
		//build the box and fade
		var msgbox = '<div class="'+ options.prefix +'box'+ options.classes +'" id="'+ options.prefix +'box">';
		if(options.useiframe && (($('object, applet').length > 0) || ie6)) {
			msgbox += '<iframe src="javascript:false;" style="display:block;position:absolute;z-index:-1;" class="'+ options.prefix +'fade" id="'+ options.prefix +'fade"></iframe>';
		} else {
			if(ie6) {
				$('select').css('visibility','hidden');
			}
			msgbox +='<div class="'+ options.prefix +'fade" id="'+ options.prefix +'fade"></div>';
		}
		msgbox += '<div class="'+ options.prefix +'" id="'+ options.prefix +'"><div class="'+ options.prefix +'container"><div class="';
		msgbox += options.prefix +'close">X</div><div id="'+ options.prefix +'states"></div>';
		msgbox += '</div></div></div>';

		var $jqib	= $(msgbox).appendTo($body);
		var $jqi	= $jqib.children('#'+ options.prefix);
		var $jqif	= $jqib.children('#'+ options.prefix +'fade');

		//if a string was passed, convert to a single state
		if(message.constructor == String){
			message = {
				state0: {
					html: message,
				 	buttons: options.buttons,
				 	focus: options.focus,
				 	submit: options.submit
			 	}
		 	};
		}

		//build the states
		var states = "";

		$.each(message,function(statename,stateobj){
			stateobj = $.extend({},$.prompt.defaults.state,stateobj);
			message[statename] = stateobj;

			states += '<div id="'+ options.prefix +'_state_'+ statename +'" class="'+ options.prefix + '_state" style="display:none;"><div class="'+ options.prefix +'message">' + stateobj.html +'</div><div class="'+ options.prefix +'buttons">';
			$.each(stateobj.buttons, function(k, v){
				if(typeof v == 'object')
					states += '<button name="' + options.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" id="' + options.prefix + '_' + statename + '_button' + v.title.replace(/[^a-z0-9]+/gi,'') + '" value="' + v.value + '">' + v.title + '</button>';
				else states += '<button name="' + options.prefix + '_' + statename + '_button' + k + '" id="' + options.prefix +	'_' + statename + '_button' + k + '" value="' + v + '">' + k + '</button>';
			});
			states += '</div></div>';
		});

		//insert the states...
		$jqi.find('#'+ options.prefix +'states').html(states).children('.'+ options.prefix +'_state:first').css('display','block');
		$jqi.find('.'+ options.prefix +'buttons:empty').css('display','none');
		
		//Events
		$.each(message,function(statename,stateobj){
			var $state = $jqi.find('#'+ options.prefix +'_state_'+ statename);

			$state.children('.'+ options.prefix +'buttons').children('button').click(function(){
				var msg = $state.children('.'+ options.prefix +'message');
				var clicked = stateobj.buttons[$(this).text()];
				if(clicked == undefined){
					for(var i in stateobj.buttons)
						if(stateobj.buttons[i].title == $(this).text())
							clicked = stateobj.buttons[i].value;
				}
				
				if(typeof clicked == 'object')
					clicked = clicked.value;
				var forminputs = {};

				//collect all form element values from all states
				$.each($jqi.find('#'+ options.prefix +'states :input').serializeArray(),function(i,obj){
					if (forminputs[obj.name] === undefined) {
						forminputs[obj.name] = obj.value;
					} else if (typeof forminputs[obj.name] == Array || typeof forminputs[obj.name] == 'object') {
						forminputs[obj.name].push(obj.value);
					} else {
						forminputs[obj.name] = [forminputs[obj.name],obj.value];	
					} 
				});

				var close = stateobj.submit(clicked,msg,forminputs);
				if(close === undefined || close) {
					removePrompt(true,clicked,msg,forminputs);
				}
			});
			$state.find('.'+ options.prefix +'buttons button:eq('+ stateobj.focus +')').addClass(options.prefix +'defaultbutton');

		});

		var fadeClicked = function(){
			if(options.persistent){
				var offset = (options.top.toString().indexOf('%') >= 0? ($window.height()*(parseInt(options.top,10)/100)) : parseInt(options.top,10)),
					top = parseInt($jqi.css('top').replace('px',''),10) - offset;

				//$window.scrollTop(top);
				$('html,body').animate({ scrollTop: top }, 'fast', function(){
					var i = 0;
					$jqib.addClass(options.prefix +'warning');
					var intervalid = setInterval(function(){
						$jqib.toggleClass(options.prefix +'warning');
						if(i++ > 1){
							clearInterval(intervalid);
							$jqib.removeClass(options.prefix +'warning');
						}
					}, 100);
				});
			}
			else {
				removePrompt();
			}
		};
		
		var keyPressEventHandler = function(e){
			var key = (window.event) ? event.keyCode : e.keyCode; // MSIE or Firefox?
			
			//escape key closes
			if(key==27) {
				fadeClicked();	
			}
			
			//constrain tabs
			if (key == 9){
				var $inputels = $(':input:enabled:visible',$jqib);
				var fwd = !e.shiftKey && e.target == $inputels[$inputels.length-1];
				var back = e.shiftKey && e.target == $inputels[0];
				if (fwd || back) {
				setTimeout(function(){ 
					if (!$inputels)
						return;
					var el = $inputels[back===true ? $inputels.length-1 : 0];

					if (el)
						el.focus();						
				},10);
				return false;
				}
			}
		};
		
		var positionPrompt = function(){
			var bodyHeight = $body.outerHeight(true),
				windowHeight = $window.height(),
				documentHeight = $(document).height(),
				height = bodyHeight > windowHeight ? bodyHeight : windowHeight,
				top = parseInt($window.scrollTop(),10) + (options.top.toString().indexOf('%') >= 0? (windowHeight*(parseInt(options.top,10)/100)) : parseInt(options.top,10));
			height = height > documentHeight? height : documentHeight;
			
			$jqib.css({
				position: "absolute",
				height: height,
				width: "100%",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			});
			$jqif.css({
				position: "absolute",
				height: height,
				width: "100%",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0
			});
			$jqi.css({
				position: "absolute",
				top: top,
				left: "50%",
				marginLeft: (($jqi.outerWidth()/2)*-1)
			});
		};

		var stylePrompt = function(){
			$jqif.css({
				zIndex: options.zIndex,
				display: "none",
				opacity: options.opacity
			});
			$jqi.css({
				zIndex: options.zIndex+1,
				display: "none"
			});
			$jqib.css({
				zIndex: options.zIndex
			});
		};

		var removePrompt = function(callCallback, clicked, msg, formvals){
			$jqi.remove();
			$window.unbind('resize',positionPrompt);
			$jqif.fadeOut(options.overlayspeed,function(){
				$jqif.unbind('click',fadeClicked);
				$jqif.remove();
				if(callCallback) {
					options.callback(clicked,msg,formvals);
				}
				$jqib.unbind('keypress',keyPressEventHandler);
				$jqib.remove();
				if(ie6 && !options.useiframe) {
					$('select').css('visibility','visible');
				}
			});
		};

		positionPrompt();
		stylePrompt();
		
		$jqif.click(fadeClicked);
		$window.resize(positionPrompt);
		$jqib.bind("keydown keypress",keyPressEventHandler);
		$jqi.find('.'+ options.prefix +'close').click(removePrompt);

		//Show it
		$jqif.fadeIn(options.overlayspeed);
		$jqi[options.show](options.promptspeed,options.loaded);
		$jqi.find('#'+ options.prefix +'states .'+ options.prefix +'_state:first .'+ options.prefix +'defaultbutton').focus();
		
		if(options.timeout > 0)
			setTimeout($.prompt.close,options.timeout);

		return $jqib;
	};
	
	$.prompt.defaults = {
		prefix:'jqi',

		classes: '',
		buttons: {
			Ok: true
		},
	 	loaded: function(){

	 	},
	  	submit: function(){
	  		return true;
		},
	 	callback: function(){



	 	},
		opacity: 0.6,
	 	zIndex: 999,
	  	overlayspeed: 'slow',
	   	promptspeed: 'fast',
   		show: 'promptDropIn',
	   	focus: 0,
	   	useiframe: false,
	 	top: '15%',
	  	persistent: true,
	  	timeout: 0,
	  	state: {
			html: '',
		 	buttons: {
		 		Ok: true
		 	},
		  	focus: 0,
		   	submit: function(){
		   		return true;
		   }
	  	}
	};
	
	$.prompt.currentPrefix = $.prompt.defaults.prefix;

	$.prompt.setDefaults = function(o) {
		$.prompt.defaults = $.extend({}, $.prompt.defaults, o);
	};
	
	$.prompt.setStateDefaults = function(o) {
		$.prompt.defaults.state = $.extend({}, $.prompt.defaults.state, o);
	};
	
	$.prompt.getStateContent = function(state) {
		return $('#'+ $.prompt.currentPrefix +'_state_'+ state);
	};
	
	$.prompt.getCurrentState = function() {
		return $('.'+ $.prompt.currentPrefix +'_state:visible');
	};
	
	$.prompt.getCurrentStateName = function() {
		var stateid = $.prompt.getCurrentState().attr('id');
		
		return stateid.replace($.prompt.currentPrefix +'_state_','');
	};
	
	$.prompt.goToState = function(state, callback) {
		$('.'+ $.prompt.currentPrefix +'_state').slideUp('slow');
		$('#'+ $.prompt.currentPrefix +'_state_'+ state).slideDown('slow',function(){
			$(this).find('.'+ $.prompt.currentPrefix +'defaultbutton').focus();
			if (typeof callback == 'function')
				callback();
		});
	};
	
	$.prompt.nextState = function(callback) {
		var $next = $('.'+ $.prompt.currentPrefix +'_state:visible').next();

		$('.'+ $.prompt.currentPrefix +'_state').slideUp('slow');
		
		$next.slideDown('slow',function(){
			$next.find('.'+ $.prompt.currentPrefix +'defaultbutton').focus();
			if (typeof callback == 'function')
				callback();
		});
	};
	
	$.prompt.prevState = function(callback) {
		var $next = $('.'+ $.prompt.currentPrefix +'_state:visible').prev();

		$('.'+ $.prompt.currentPrefix +'_state').slideUp('slow');
		
		$next.slideDown('slow',function(){
			$next.find('.'+ $.prompt.currentPrefix +'defaultbutton').focus();
			if (typeof callback == 'function')
				callback();
		});
	};
	
	$.prompt.close = function() {
		$('#'+ $.prompt.currentPrefix +'box').fadeOut('fast',function(){
        		$(this).remove();
		});
	};
	
	$.fn.extend({ 
		prompt: function(options){
			if(options == undefined) 
				options = {};
			if(options.withDataAndEvents == undefined)
				options.withDataAndEvents = false;
			
			$.prompt($(this).clone(options.withDataAndEvents).html(),options);
		},
		promptDropIn: function(speed, callback){ 
			var $t = $(this); 
			
			if($t.css("display") == "none"){ 
				var eltop = $t.css('top');
				$t.css({ top: $(window).scrollTop(), display: 'block' }).animate({ top: eltop },speed,'swing',callback); 
			}
		}
		
	});
	
})(jQuery);

}, mimetype: "application/javascript", remote: false}; // END: /jquery/jquery-impromptu.js


__jah__.resources["/jquery/themes/brown/brown.css"] = {data: __jah__.assetURL + "/jquery/themes/brown/brown.css", mimetype: "text/css", remote: true};
__jah__.resources["/jquery/themes/brown/brown_theme_gradient.jpg"] = {data: __jah__.assetURL + "/jquery/themes/brown/brown_theme_gradient.jpg", mimetype: "image/jpeg", remote: true};
__jah__.resources["/jquery/themes/brown/help.gif"] = {data: __jah__.assetURL + "/jquery/themes/brown/help.gif", mimetype: "image/gif", remote: true};
__jah__.resources["/jquery/themes/classic-impromptu.css"] = {data: __jah__.assetURL + "/jquery/themes/classic-impromptu.css", mimetype: "text/css", remote: true};
__jah__.resources["/jquery/themes/clean-blue.css"] = {data: __jah__.assetURL + "/jquery/themes/clean-blue.css", mimetype: "text/css", remote: true};
__jah__.resources["/jquery/themes/columns/button_bg.jpg"] = {data: __jah__.assetURL + "/jquery/themes/columns/button_bg.jpg", mimetype: "image/jpeg", remote: true};
__jah__.resources["/jquery/themes/columns/columns.css"] = {data: __jah__.assetURL + "/jquery/themes/columns/columns.css", mimetype: "text/css", remote: true};
__jah__.resources["/jquery/themes/ext-blue.css"] = {data: __jah__.assetURL + "/jquery/themes/ext-blue.css", mimetype: "text/css", remote: true};
__jah__.resources["/jquery/themes/smooth.css"] = {data: __jah__.assetURL + "/jquery/themes/smooth.css", mimetype: "text/css", remote: true};
__jah__.resources["/main.js"] = {data: function (exports, require, module, __filename, __dirname) {
// main.js
// Created by MonkeyShen 2012
// 程序入口

"use strict"  // Use strict JavaScript mode

require.paths.push('/')

var cocos  = require('cocos2d')   // Import the cocos2d module
  , events = require('events')    // Import the events module
  , geo    = require('geometry')  // Import the geometry module
  , ccp    = geo.ccp              // Short hand to create points

require('jquery/jquery-1.7.1.min')
require('jquery/jquery-impromptu')
require('Game')
require('GameController')

var Jschess = cocos.nodes.Layer.extend(/** @lends Jschess# */{

    bat: null,

    /**
     * @class Initial application layer
     * @extends cocos.nodes.Layer
     * @constructs
     */
    init: function () {
        // You must always call the super class version of init
        Jschess.superclass.init.call(this)

        // Set mouse enable
        this.set('isMouseEnabled', true);

        // Init game
        Game.init(this);
    },

    mouseMoved: function(evt) {
    },

    mouseDown: function(evt) {
    },

    mouseUp: function(evt) {
    },
})

/**
 * Entry point for the application
 */
exports.main = function () {
    // Initialise application

    // Get director
    var director = cocos.Director.get('sharedDirector')

    // Attach director to our <div> element
    director.attachInView(document.getElementById('jschess_app'))

    // Wait for the director to finish preloading our assets
    events.addListener(director, 'ready', function (director) {
        // Create a scene
        var scene = cocos.nodes.Scene.create()

        // Add our layer to the scene
        scene.addChild({ child: Jschess.create() })

        // Run the scene
        director.replaceScene(scene)
    })

    // Preload our assets
    director.runPreloadScene()
}

}, mimetype: "application/javascript", remote: false}; // END: /main.js


__jah__.resources["/MainFrame.js"] = {data: function (exports, require, module, __filename, __dirname) {
// MainFrame.js
// Created by MonkeyShen 2012
// 主界面

var cocos = require('cocos2d');
var geo = require('geometry');

MainFrame = {
    layer : null,

    init : function(layer) {
        this.layer = layer;

        // 创建背景
        this._create_bg();
        
        // 创建界面
        var begin_item = this._create_begin_button();
        var lose_item = this._create_lose_button();
        var regret_item = this._create_regret_button();
        var restart_item = this._create_restart_button();

        var menu = cocos.nodes.Menu.create({items : [
                    restart_item,
                    begin_item, 
                    regret_item, 
                    lose_item
                ]});

        menu.set('position', geo.ccp(0, 0))

        this.layer.addChild({child : menu});
    },

    _create_bg : function() {
        // 创建背景
        for (var i = 0; i < 8; ++i) {
            for (var j = 0; j < 8; ++j) {
                // 背景
                var bg = cocos.nodes.Sprite.create({
                        file : '/resources/bg.png'
                    });
                bg.set('position', geo.ccp(i * 170, j * 170));
                this.layer.addChild({child : bg});
            }
        }

        var bg = cocos.nodes.Sprite.create({
                file : '/resources/bg1.png'
            });
        bg.set('position', geo.ccp(194, 486));
        this.layer.addChild({child : bg});
    },

    // 创建开始按钮
    _create_begin_button : function() {
        var normal = cocos.nodes.Sprite.create({
                file : '/resources/button_begin.png',
                rect : new geo.Rect(0, 0, 54, 36),
            });

        var disable = cocos.nodes.Sprite.create({
                file : '/resources/button_begin.png',
                rect : new geo.Rect(54, 0, 54, 36),
            });

        var select = cocos.nodes.Sprite.create({
                file : '/resources/button_begin.png',
                rect : new geo.Rect(108, 0, 54, 36),
            });

        // 按下开始后的回调
        var callback = function() {

            var playerHuman = require('player/PlayerHuman').player;
            var playerEasy = require('player/PlayerAIEasy').player;
            var playerNormal = require('player/PlayerAINormal').player;
            var playerHard = require('player/PlayerAIHard').player;

            // 选择先后手回调
            function on_select_first(v,m,f){
                Game.start(v);
            }

            // 选择黑方玩家
            function on_select_black_player(v, m, f){
                Game.set_player(CAMP_BLACK, '黑方玩家', v);

                $.prompt('请选择先后手', {
                    buttons  : { 红棋先手: CAMP_RED, 黑棋先手: CAMP_BLACK},
                    callback : on_select_first,
                });
            }

            // 选择玩家回调
            function on_select_red_player(v, m, f) {
                Game.set_player(CAMP_RED, '红方玩家', v);

                $.prompt('请设定黑方玩家', {
                    buttons : {
                        人类 : playerHuman,
                        简单AI : playerEasy,
                        普通AI : playerNormal,
                        困难AI : playerHard
                    },
                    callback : on_select_black_player,
                });
            }

            $.prompt('请设定红方玩家', {
                buttons : {
                    人类 : playerHuman,
                    简单AI : playerEasy,
                    普通AI : playerNormal,
                    困难AI : playerHard
                },
                callback : on_select_red_player,
            });

            /*
            ////---- 自动开始
            Game.set_player(CAMP_BLACK, 'xx', playerEasy);
            Game.set_player(CAMP_RED, 'yy', playerHuman);
            Game.start(CAMP_BLACK); */
        }

        var menuitem = cocos.nodes.MenuItemSprite.create({
                normalImage : normal,
                disabledImage : disable,
                selectedImage : select,
                callback : callback,
            });
        menuitem.set('position', geo.ccp(700, 420));

        return menuitem;
    },

    // 创建认输按钮
    _create_lose_button : function() {
        var normal = cocos.nodes.Sprite.create({
                file : '/resources/button_lost.png',
                rect : new geo.Rect(0, 0, 53, 33),
            });

        var disable = cocos.nodes.Sprite.create({
                file : '/resources/button_lost.png',
                rect : new geo.Rect(53, 0, 53, 33),
            });

        var select = cocos.nodes.Sprite.create({
                file : '/resources/button_lost.png',
                rect : new geo.Rect(106, 0, 53, 33),
            });

        // 按下认输后的回调
        var callback = function() {
            $.prompt('胜败乃兵家常事');
            // 清空棋盘，结束棋局
            Board.clear_board();
        }

        var menuitem = cocos.nodes.MenuItemSprite.create({
                normalImage : normal,
                disabledImage : disable,
                selectedImage : select,
                callback : callback,
            });
        menuitem.set('position', geo.ccp(700, 520));

        return menuitem;
    },

    // 创建悔棋按钮
    _create_regret_button : function() {
        var normal = cocos.nodes.Sprite.create({
                file : '/resources/button_regret.png',
                rect : new geo.Rect(0, 0, 51, 32),
            });

        var disable = cocos.nodes.Sprite.create({
                file : '/resources/button_regret.png',
                rect : new geo.Rect(51, 0, 51, 32),
            });

        var select = cocos.nodes.Sprite.create({
                file : '/resources/button_regret.png',
                rect : new geo.Rect(102, 0, 51, 32),
            });

        // 按下悔棋后的回调
        var callback = function() {
            Game.regret();
        }

        var menuitem = cocos.nodes.MenuItemSprite.create({
                normalImage : normal,
                disabledImage : disable,
                selectedImage : select,
                callback : callback,
            });
        menuitem.set('position', geo.ccp(700, 470));

        return menuitem;
    },

    // 创建重新开始按钮
    _create_restart_button : function() {
        var normal = cocos.nodes.Sprite.create({
                file : '/resources/button_restart.png',
            });

        var disable = cocos.nodes.Sprite.create({
                file : '/resources/button_restart.png',
            });

        var select = cocos.nodes.Sprite.create({
                file : '/resources/button_restart.png',
            });

        var callback = function() {
            if (Game.is_player_seted())
                Game.restart();
            else
                $.prompt('不能重新开始，玩家信息还未设定，请按"开始"');
        }

        var menuitem = cocos.nodes.MenuItemSprite.create({
                normalImage : normal,
                disabledImage : disable,
                selectedImage : select,
                callback : callback,
            });
        menuitem.set('position', geo.ccp(700, 370));

        return menuitem;
     },             
}

}, mimetype: "application/javascript", remote: false}; // END: /MainFrame.js


__jah__.resources["/MoveGenerator.js"] = {data: function (exports, require, module, __filename, __dirname) {
// MoveGenerator.js
// Created by MonkeyShen 2012
// 移动生成器，用于判断是否可移动和找出所有可移动的地点

require('Util')

var _chesses = {
    B_CAR       : B_CAR,
    B_HORSE     : B_HORSE,
    B_ELEPHANT  : B_ELEPHANT,
    B_BISHOP    : B_BISHOP,
    B_KING      : B_KING,
    B_CANNON    : B_CANNON,
    B_PAWN      : B_PAWN,
    R_CAR       : R_CAR,
    R_HORSE     : R_HORSE,
    R_ELEPHANT  : R_ELEPHANT,
    R_BISHOP    : R_BISHOP,
    R_KING      : R_KING,
    R_CANNON    : R_CANNON,
    R_PAWN      : R_PAWN,
    NOCHESS     : NOCHESS,
};

MoveGenerator = {

    // 所有棋子，二维数组，保存棋子名称
    chesses : [],

    // 移动列表[depth, move_list]
    move_list : [],

    // 当前步数
    cur_step : 0,
    
    // 当前深度
    cur_depth : 0,

    // 初始化棋盘
    init_board : function(chess_names) {
        for (var y = 0; y < 10; ++y) {
            this.chesses[y] = [];
            for (var x = 0; x < 9; ++x) {
                var name = chess_names[y][x];
                this.chesses[y][x] = _chesses[name];
            }
        }
    },

    // 获取棋子布局
    get_chesses : function() {
        return this.chesses;
    },

    // 获取某个棋子
    get_chess : function(x, y) {
        return this.chesses[y][x];
    },

    // 获取移动列表
    get_move_list : function(depth) {
        return this.move_list[depth];
    },

    // 添加一步移动
    _add_move : function(x, y, tx, ty, depth) {
        var move = {
            fx : x,
            fy : y,
            tx : tx,
            ty : ty,
        };

        if (this.move_list[depth] == null)
            this.move_list[depth] = [];

        this.move_list[depth].push(move);
    },

    // 为某一个位置的棋子创建可能的走法
    _create_possible_moves : function(x, y, depth) {

        var chess = this.chesses[y][x];

        switch (chess) {

        case R_KING:
        case B_KING:
            this._gen_king_move(chess, x, y, depth);
            break;

        case R_BISHOP:
        case B_BISHOP:
            this._gen_bishop_move(chess, x, y, depth);
            break;

        case R_ELEPHANT:
        case B_ELEPHANT:
            this._gen_elephant_move(chess, x, y, depth);
            break;

        case R_HORSE:
        case B_HORSE:
            this._gen_horse_move(chess, x, y, depth);
            break;

        case R_CAR:
        case B_CAR:
            this._gen_car_move(chess, x, y, depth);
            break;

        case R_CANNON:
        case B_CANNON:
            this._gen_cannon_move(chess, x, y, depth);
            break;

        case R_PAWN:
        case B_PAWN:
            this._gen_pawn_move(chess, x, y, depth);
            break;

        default:
            alert('Invalid chess!');
            break;
        }
    },

    // 创建某一个阵营当前所有可能的走法
    create_possible_moves : function(camp, depth) {
        this.move_list[depth] = [];
        for (var y = 0; y < 10; ++y) {
            for (var x = 0; x < 9; ++x) {

                var chess = this.chesses[y][x];
                if (chess * camp <= 0)
                    continue;

                this._create_possible_moves(x, y, depth);
            }
        }
        return this.move_list[depth];
    },

    // 从x,y点移动到tx,ty点
    move_chess : function(move) {
        var fc = this.chesses[move.fy][move.fx];
        var tc = this.chesses[move.ty][move.tx];
        move.fc = fc;
        move.tc = tc;
        this.chesses[move.ty][move.tx] = fc;
        this.chesses[move.fy][move.fx] = NOCHESS;

        // console.log('move', move.fx, move.fy, move.tx, move.ty, fc, tc);
    },

    // 取消某一步的移动
    unmove_chess : function(move) {
        this.chesses[move.ty][move.tx] = move.tc;
        this.chesses[move.fy][move.fx] = move.fc;

        // console.log('unmove', move.fx, move.fy, move.tx, move.ty, move.fc, move.tc); 
    },

    // 从x,y点移动到tx,ty点是否合法
    is_valid_move : function(fx, fy, tx, ty) {
        var i, j;
        var move_chess, target_chess;
        var chesses = this.chesses;

        move_chess = chesses[fy][fx];
        target_chess = chesses[ty][tx];

        // 源是空
        if (move_chess == NOCHESS)
            return false;

        //目的与源相同
        if (fx == tx && fy == ty)
            return false;

        //不能吃自己的棋
        if (move_chess * target_chess > 0)
            return false;
        
        switch(move_chess)
        {

        // 红王
        case R_KING:     
            if (target_chess == B_KING) {
                //两个将不在同一列
                if (fx != tx)
                    return false;

                for (i = fy - 1; i > ty; i--)
                    if (chesses[i][fx] != NOCHESS)
                        //中间有别的子
                        return false;
            }
            else {
                if (ty < 7 || tx > 5 || tx < 3)
                    //目标点在九宫之外
                    return false;

                if(Math.abs(fy - ty) + Math.abs(tx - fx) > 1) 
                    //将帅只走一步直线
                    return false;
            }
            break;
        // 黑王
        case B_KING:
            if (target_chess == R_KING) {
                if (fx != tx)
                    return false;
                for (i = fy + 1; i < ty; i++)
                    if (chesses[i][fx] != NOCHESS)
                        return false;
            }
            else { 
                //目标点在九宫之外
                if (ty > 2 || tx > 5 || tx < 3)
                    return false;

                //将帅只走一步直线
                if(Math.abs(fy - ty) + Math.abs(tx - fx) > 1)
                    return false;
            }
            break;

        // 红士
        case R_BISHOP:   

            //士出九宫	
            if (ty < 7 || tx > 5 || tx < 3)
                return false;

            //士走斜线
            if (Math.abs(fy - ty) != 1 || Math.abs(tx - fx) != 1)
                return false;
            
            break;

        //黑士
        case B_BISHOP:   

            //士出九宫	
            if (ty > 2 || tx > 5 || tx < 3)
                return false;

            //士走斜线
            if (Math.abs(fy - ty) != 1 || Math.abs(tx - fx) != 1)
                return false;
            
            break;

        //红象
        case R_ELEPHANT:

            //相不能过河
            if(ty < 5)
                return false;

            //相走田字
            if(Math.abs(fx-tx) != 2 || Math.abs(fy-ty) != 2)
                return false;

            //相眼被塞住了
            if(chesses[(fy + ty) / 2][(fx + tx) / 2] != NOCHESS)
                return false;
            
            break;

        //黑象 
        case B_ELEPHANT:

            //相不能过河
            if(ty > 4)
                return false;

            //相走田字
            if(Math.abs(fx-tx) != 2 || Math.abs(fy-ty) != 2)
                return false;

            //相眼被塞住了
            if(chesses[(fy + ty) / 2][(fx + tx) / 2] != NOCHESS)
                return false;
            
            break;

        //黑兵
        case B_PAWN:

            //兵不回头
            if(ty < fy)
                return false;

            //兵过河前只能直走
            if( fy < 5 && fy == ty)
                return false;

            //兵只走一步直线
            if(ty - fy + Math.abs(tx - fx) > 1)
                return false;
            
            break;

        //红兵
        case R_PAWN:

            //兵不回头
            if(ty > fy)
                return false;

            //兵过河前只能直走
            if( fy > 4 && fy == ty)
                return false;

            //兵只走一步直线
            if(fy - ty + Math.abs(tx - fx) > 1)
                return false;
            
            break;
            
        
        // 车
        case B_CAR:      
        case R_CAR:      

            //车走直线
            if(fy != ty && fx != tx)
                return false;
            
            if(fy == ty) {
                if(fx < tx) {
                    for(i = fx + 1; i < tx; i++)
                        if(chesses[fy][i] != NOCHESS)
                            return false;
                }
                else {
                    for(i = tx + 1; i < fx; i++)
                        if(chesses[fy][i] != NOCHESS)
                            return false;
                }
            }
            else {
                if(fy < ty) {
                    for(j = fy + 1; j < ty; j++)
                        if(chesses[j][fx] != NOCHESS)
                            return false;
                }
                else {
                    for(j= ty + 1; j < fy; j++)
                        if(chesses[j][fx] != NOCHESS)
                            return false;
                }
            }
            
            break;
            
        // 马
        case B_HORSE:    
        case R_HORSE:    

            //马走日字
            if(!((Math.abs(tx-fx)==1 && Math.abs(ty-fy)==2)
                ||(Math.abs(tx-fx)==2 && Math.abs(ty-fy)==1)))
                return false;
            
            if	(tx - fx==2) {
                i = fx + 1;
                j = fy;
            }
            else if	(fx - tx == 2) {
                i = fx - 1;
                j = fy;
            }
            else if	(ty - fy == 2) {
                i = fx;
                j = fy + 1;
            }
            else if	(fy - ty == 2) {
                i = fx;
                j = fy - 1;
            }

            //绊马腿
            if(chesses[j][i] != NOCHESS)
                return false;
            
            break;
        
        // 炮
        case B_CANNON:    
        case R_CANNON:    

            //炮走直线
            if(fy != ty && fx != tx)
                return false;
            
            //炮不吃子时经过的路线中不能有棋子
            if(chesses[ty][tx] == NOCHESS) {
                if(fy == ty) {
                    if(fx < tx) {
                        for(i = fx + 1; i < tx; i++)
                            if(chesses[fy][i] != NOCHESS)
                                return false;
                    }
                    else {
                        for(i = tx + 1; i < fx; i++)
                            if(chesses[fy][i]!=NOCHESS)
                                return false;
                    }
                }
                else {
                    if(fy < ty) {
                        for(j = fy + 1; j < ty; j++)
                            if(chesses[j][fx] != NOCHESS)
                                return false;
                    }
                    else {
                        for(j = ty + 1; j < fy; j++)
                            if(chesses[j][fx] != NOCHESS)
                                return false;
                    }
                }
            }
            //炮吃子时
            else	
            {
                var count = 0;
                if(fy == ty) {
                    if(fx < tx) {
                        for(i = fx + 1; i < tx; i++)
                            if(chesses[fy][i] != NOCHESS)
                                count++;
                            if(count != 1)
                                return false;
                    }
                    else {
                        for(i = tx + 1; i < fx; i++)
                            if(chesses[fy][i] != NOCHESS)
                                count++;
                            if(count != 1)
                                return false;
                    }
                }
                else {
                    if(fy<ty) {
                        for(j = fy + 1; j < ty; j++)
                            if(chesses[j][fx] != NOCHESS)
                                count++;
                            if(count != 1)
                                return false;
                    }
                    else {
                        for(j = ty + 1; j < fy; j++)
                            if(chesses[j][fx] != NOCHESS)
                                count++;
                            if(count != 1)
                                return false;
                    }
                }
            }
            break;

        default:
            return false;
        }
        
        return true;
    },

    // 生成将的走法
    _gen_king_move : function(chess, x, y, depth) {
        if (chess < 0)
            for (var ty = 0; ty < 3; ty++)
                for (var tx = 3; tx < 6; tx++){
                    if (this.is_valid_move(x, y, tx, ty))
                        this._add_move(x, y, tx, ty, depth);
                }
        else
            for (var ty = 7; ty < 10; ty++)
                for (var tx = 3; tx < 6; tx++)
                    if (this.is_valid_move(x, y, tx, ty))
                        this._add_move(x, y, tx, ty, depth);
    },

    // 生成士的走法
    _gen_bishop_move : function(chess, x, y, depth) {
        if (chess < 0) {
            for (var ty = 0; ty < 3; ty++)
                for (var tx = 3; tx < 6; tx++)
                    if (this.is_valid_move(x, y, tx, ty))
                        this._add_move(x, y, tx, ty, depth);
        }
        else {
            for (var ty = 7; ty < 10; ty++)
                for (var tx = 3; tx < 6; tx++)
                    if (this.is_valid_move(x, y, tx, ty))
                        this._add_move(x, y, tx, ty, depth);
        }
    },

    // 生成象的走法
    _gen_elephant_move : function(chess, x, y, depth) {
        var tx, ty;

        tx = x + 2;
        ty = y + 2;
        if(tx < 9 && ty < 10  && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
        
        tx = x + 2;
        ty = y - 2;
        if(tx < 9 && ty >=0  &&  this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
        
        tx = x - 2;
        ty = y + 2;
        if(tx >= 0 && ty < 10  && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
        
        tx = x - 2;
        ty = y - 2;
        if(tx >= 0 && ty >= 0 && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
    },

    // 生成马的走法
    _gen_horse_move : function(chess, x, y, depth) {
        var tx, ty;

        tx = x + 2;
        ty = y + 1;
        if((tx < 9 && ty < 10) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
        
        tx = x + 2;
        ty = y - 1;
        if((tx < 9 && ty >= 0) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
        
        tx = x - 2;
        ty = y + 1;
        if((tx >= 0 && ty < 10) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
        
        tx = x - 2;
        ty = y - 1;
        if((tx >= 0 && ty >= 0) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
        
        tx = x + 1;
        ty = y + 2;
        if((tx < 9 && ty < 10) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);

        tx = x - 1;
        ty = y + 2;
        if((tx >= 0 && ty < 10) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);

        tx = x + 1;
        ty = y - 2;
        if((tx < 9 && ty >= 0) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);

        tx = x - 1;
        ty = y - 2;
        if((tx >= 0 && ty >= 0) && this.is_valid_move(x, y, tx, ty))
            this._add_move(x, y, tx, ty, depth);
    },

    // 生成车的走法
    _gen_car_move : function(chess, x, y, depth) {
        var tx, ty;

        tx = x + 1;
        ty = y;
        while(tx < 9) {
            var tc = this.chesses[ty][tx];
            if( NOCHESS == tc)
                this._add_move(x, y, tx, ty, depth);
            else {
                if(tc * chess < 0)
                    // 不同阵营，可以干掉
                    this._add_move(x, y, tx, ty, depth);

                // 无论如何都break出去，后面的不可能了
                break;
            }
            tx++;
        }
        
        tx = x-1;
        ty = y;
        while(tx >= 0) {
            var tc = this.chesses[ty][tx];
            if( NOCHESS == tc)
                this._add_move(x, y, tx, ty, depth);
            else {
                if (tc * chess < 0)
                    this._add_move(x, y, tx, ty, depth);
                break;
            }
            tx--;
        }
        
        tx = x;
        ty = y + 1;
        while(ty < 10) {
            var tc = this.chesses[ty][tx];
            if( NOCHESS == tc)
                this._add_move(x, y, tx, ty, depth);
            else {
                if(tc * chess < 0)
                    this._add_move(x, y, tx, ty, depth);
                break;
            }
            ty++;
        }
        
        tx = x;
        ty = y - 1;
        while(ty >= 0) {
            var tc = this.chesses[ty][tx];
            if( NOCHESS == tc)
                this._add_move(x, y, tx, ty, depth);
            else {
                if(tc * chess < 0)
                    this._add_move(x, y, tx, ty, depth);
                break;
            }
            ty--;
        }
            
    },

    // 生成炮的走法
    _gen_cannon_move : function(chess, x, y, depth) {
		var tx, ty;
		var flag;

		ty = y;
		tx = x + 1;
		flag = false;
		while(tx < 9) {
            var tc = this.chesses[ty][tx];
            if( NOCHESS == tc) {
				if(! flag)
					this._add_move(x, y, tx, ty, depth);
			}
			else {
				if(! flag)
					flag = true;
				else {
                    if (tc * chess < 0)
						this._add_move(x, y, tx, ty, depth);
					break;
				}
			}
			tx++;
		}
		
		tx = x - 1;
		flag = false ;	
		while(tx >= 0) {
            var tc = this.chesses[ty][tx];
			if(NOCHESS == tc) {
				if(! flag)
					this._add_move(x, y, tx, ty, depth);
			}
			else {
				if(! flag)
					flag = true;
				else {
                    if (tc * chess < 0)
						this._add_move(x, y, tx, ty, depth);
					break;
				}
			}
			tx--;
		}

		tx = x;	
		ty = y + 1;
		flag = false;
		while(ty < 10) {
            var tc = this.chesses[ty][tx];
			if(NOCHESS == tc) {
				if(! flag)
					this._add_move(x, y, tx, ty, depth);
			}
			else {
				if(!flag)
					flag = true;
				else {
                    if (tc * chess < 0)
						this._add_move(x, y, tx, ty, depth);
					break;
				}
			}
			ty++;
		}
		
		ty = y - 1;
		flag = false;	
		while(ty >= 0) {
            var tc = this.chesses[ty][tx];
			if(NOCHESS == tc) {
				if(! flag)
					this._add_move(x, y, tx, ty, depth);
			}
			else {
				if(!flag)
					flag = true;
				else {
                    if (tc * chess < 0)
						this._add_move(x, y, tx, ty, depth);
					break;
				}
			}
			ty--;
		}
    },

    // 生成兵的走法
    _gen_pawn_move : function(chess, x, y, depth) {
        var tx, ty;

        if (chess > 0) {
            ty = y - 1;
            tx = x;

            if(ty >= 0 && this.chesses[ty][tx] * chess <= 0)
                this._add_move(x, y, tx, ty, depth);
            
            if(y < 5) {
                ty = y;

                tx = x + 1;
                if(tx < 9 && chess * this.chesses[ty][tx] <= 0)
                    this._add_move(x, y, tx, ty, depth);

                tx = x - 1;
                if(tx >= 0 && chess * this.chesses[ty][tx] <= 0)
                    this._add_move(x, y, tx, ty, depth);
            }
        }
        else {
            ty = y + 1;
            tx = x;

            if(ty < 10 && this.chesses[ty][tx] * chess <= 0)
                this._add_move(x, y, tx, ty, depth);
            
            if(y > 4) {
                ty = y;

                tx = x + 1;
                if(tx < 9 && chess * this.chesses[ty][tx] <= 0)
                    this._add_move(x, y, tx, ty, depth);

                tx = x - 1;
                if(x >= 0 && chess * this.chesses[ty][tx] <= 0)
                    this._add_move(x, y, tx, ty, depth);
            }
        }
    },
}


}, mimetype: "application/javascript", remote: false}; // END: /MoveGenerator.js


__jah__.resources["/Piece.js"] = {data: function (exports, require, module, __filename, __dirname) {
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


}, mimetype: "application/javascript", remote: false}; // END: /Piece.js


__jah__.resources["/player/PlayerAIEasy.js"] = {data: function (exports, require, module, __filename, __dirname) {
// PlayerAIEasy.js
// Created by MonkeyShen 2012
// 简单AI玩家 

var cocos = require('cocos2d');

var Player = BObject.extend({
    name : null,
    camp : null,

    init : function(name, camp) {
        this.name = name;
        this.camp = camp;
    },

    run : function() {
        AI.set_max_depth(3);
        AI.play_a_chess(this.camp);
    },

    stop : function() {
    },
});

exports.player = Player;

}, mimetype: "application/javascript", remote: false}; // END: /player/PlayerAIEasy.js


__jah__.resources["/player/PlayerAIHard.js"] = {data: function (exports, require, module, __filename, __dirname) {
// PlayerAIHard.js
// Created by MonkeyShen 2012
// 困难AI玩家 

var cocos = require('cocos2d');

var Player = BObject.extend({
    name : null,
    camp : null,

    init : function(name, camp) {
        this.name = name;
        this.camp = camp;
    },

    run : function() {
        AI.set_max_depth(5);
        AI.play_a_chess(this.camp);
    },

    stop : function() {
    },
});

exports.player = Player;

}, mimetype: "application/javascript", remote: false}; // END: /player/PlayerAIHard.js


__jah__.resources["/player/PlayerAINormal.js"] = {data: function (exports, require, module, __filename, __dirname) {
// PlayerAINormal.js
// Created by MonkeyShen 2012
// 中等AI玩家 

var cocos = require('cocos2d');

var Player = BObject.extend({
    name : null,
    camp : null,

    init : function(name, camp) {
        this.name = name;
        this.camp = camp;
    },

    run : function() {
        AI.set_max_depth(4);
        AI.play_a_chess(this.camp);
    },

    stop : function() {
    },
});

exports.player = Player;

}, mimetype: "application/javascript", remote: false}; // END: /player/PlayerAINormal.js


__jah__.resources["/player/PlayerHuman.js"] = {data: function (exports, require, module, __filename, __dirname) {
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


}, mimetype: "application/javascript", remote: false}; // END: /player/PlayerHuman.js


__jah__.resources["/resources/bg.png"] = {data: __jah__.assetURL + "/resources/bg.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/bg1.png"] = {data: __jah__.assetURL + "/resources/bg1.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/board.png"] = {data: __jah__.assetURL + "/resources/board.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/button_begin.png"] = {data: __jah__.assetURL + "/resources/button_begin.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/button_lost.png"] = {data: __jah__.assetURL + "/resources/button_lost.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/button_regret.png"] = {data: __jah__.assetURL + "/resources/button_regret.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/button_restart.png"] = {data: __jah__.assetURL + "/resources/button_restart.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/chess.png"] = {data: __jah__.assetURL + "/resources/chess.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/cur_pos.png"] = {data: __jah__.assetURL + "/resources/cur_pos.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/jiangjun.png"] = {data: __jah__.assetURL + "/resources/jiangjun.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/last_pos.png"] = {data: __jah__.assetURL + "/resources/last_pos.png", mimetype: "image/png", remote: true};
__jah__.resources["/resources/screenshot.png"] = {data: __jah__.assetURL + "/resources/screenshot.png", mimetype: "image/png", remote: true};
__jah__.resources["/Util.js"] = {data: function (exports, require, module, __filename, __dirname) {
// Util.js
// 一些通用或全局的属性和方法

// 所有棋子
B_CAR = -1;
B_HORSE = -2;
B_ELEPHANT = -3;
B_BISHOP = -4;
B_KING = -5;
B_CANNON = -6;
B_PAWN = -7;
R_CAR = 1;
R_HORSE = 2;
R_ELEPHANT = 3;
R_BISHOP = 4;
R_KING = 5;
R_CANNON = 6;
R_PAWN = 7;
NOCHESS = 0;

// 阵营
CAMP_RED = 1;
CAMP_BLACK = -1;


}, mimetype: "application/javascript", remote: false}; // END: /Util.js


})();