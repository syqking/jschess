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
