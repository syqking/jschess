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

