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

