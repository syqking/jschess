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

