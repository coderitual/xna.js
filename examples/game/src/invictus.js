/// <reference path="../typings/node/node.d.ts"/>
// XnaJs.Core using
var Game            = require('xnajs/game');
var Pointer         = require('xnajs/input/pointer');
var Keyboard        = require('xnajs/input/keyboard');
var Keys            = require('xnajs/input/keys');
var Device          = require('xnajs/device');

// XnaJs.Graphics using
var Effect          = require('xnajs/graphics/effect');
var SpriteBatch     = require('xnajs/graphics/sprite-batch');
var VertexBuffer    = require('xnajs/graphics/vertex-buffer');
var IndexBuffer     = require('xnajs/graphics/index-buffer');
var Texture2D       = require('xnajs/graphics/texture2d');
var Blend           = require('xnajs/graphics/blend');
var BlendState      = require('xnajs/graphics/blend-state');
var RenderTarget2D  = require('xnajs/graphics/render-target2d');
var vec2            = require('xnajs/matrix/vec2');

// Game using
var FpsMeter        = require('./fps-meter');
var Input           = require('./input');
var Art             = require('./art');
var GameState       = require('./game-state');
var Player          = require('./entities/player');
var Enemy           = require('./entities/enemy');
var Powerup         = require('./entities/powerup');
var Bullet          = require('./entities/bullet');
var EntityManager   = require('./entity-manager');

var STATES = {
    GAME: 1,
    PAUSE: 2
};

var VERSION = 'ver.10';

var state = STATES.PAUSE;

var MAP_WIDTH = 1024;
var MAP_HEIGHT = 1024;

var delta = 0;
var delta2 = 0;

var MobileGame = Game.extend({

    initialize: function () {

        this.super();

        if (Device.ua.mobile) {

            this.width = 480;
            this.height = Math.round(window.innerHeight * (this.width / window.innerWidth));

            // Scale the canvas via CSS to fill the screen
            this.window.canvas.style.width = window.innerWidth + 'px';
            this.window.canvas.style.height = window.innerHeight + 'px';

        } else {

            this.width = 480;
            this.height = 720;

            // Scale the canvas via CSS to fill the screen height
            //this.window.canvas.style.height = '100%';
        }

        this.graphicsDevice.backBufferWidth = this.width;
        this.graphicsDevice.backBufferHeight = this.height;

        this.newState = null;
        this.oldState = Keyboard.getState();

        this.fps = new FpsMeter();

        // init code

        GameState.highscore = localStorage.getItem('highscore') || 0;

        Player.pos[0] = this.width / 2;
        Player.pos[1] = this.height / 2;

        EntityManager.powerups.push(new Powerup(Math.random() * this.width, Math.random() * this.height, 10));
    },

    loadContent: function () {

        this.spriteBatch = new SpriteBatch(this.graphicsDevice);
        Art.load(this.content);
        this.debugfont = this.content.load['SpriteFont']('fonts/tahoma_18.fnt');
    },

    reset: function() {

        if(GameState.points > GameState.highscore) {
            GameState.highscore = GameState.points;
            localStorage.setItem('highscore', GameState.highscore);
        }

        state = STATES.PAUSE;

        EntityManager.enemies = [];
        EntityManager.powerups = [];
        EntityManager.bullets = [];

        Player.isActive = true;

        Player.pos[0] = this.width / 2;
        Player.pos[1] = this.height / 2;
    },

    update: function (gameTime) {

        this.newState = Keyboard.getState();
        this.oldState = this.newState;

        var dt = gameTime.elapsedGameTime / 1000;
        delta += dt;
        delta2 += dt;
        Input.update();

        if(state == STATES.PAUSE) {

            if(Input.tap()) {
                state = STATES.GAME;
                GameState.points = 0;
            }
            return;
        }

        GameState.points += Math.round(gameTime.elapsedGameTime / 10);

        if(Input.tap()) {
            Player.aa = -Player.aa;
        }

        Player.update(dt);
        EntityManager.update(dt);

        this.fps.update(gameTime);

        if(delta > 1) {
            delta = 0;
            var newEnemy = new Enemy(Math.random() * this.width, Math.random() * this.height);

            if(EntityManager.isColliding(Player, newEnemy)) {

                vec2.set(newEnemy.pos, Player.pos[0], Player.pos[1]);

                var dirx = Math.cos(Player.angle - Math.PI / 2);
                var diry = Math.sin(Player.angle - Math.PI / 2);

                var tv = vec2.create();
                tv[0] = -dirx;
                tv[1] = -diry;
                vec2.scaleAndAdd(newEnemy.pos, newEnemy.pos, tv, Player.radius * 3);

            }

            EntityManager.enemies.push(newEnemy);
        }

        if(delta2 > 2) {
            delta2 = 0;

            EntityManager.powerups.push(new Powerup(Math.random() * this.width, Math.random() * this.height, 10));
        }

        // clear dead entities
        for(var i = EntityManager.enemies.length - 1; i >= 0; i--) {
            var enemy = EntityManager.enemies[i];

            if(enemy.isExpired) {
                EntityManager.enemies.splice(i, 1);
                GameState.points += 100;
            }
        }

        for(i = EntityManager.bullets.length - 1; i >= 0; i--) {
            var bullet = EntityManager.bullets[i];

            if(bullet.isExpired) {
                EntityManager.bullets.splice(i, 1);
            }
        }

        for(i = EntityManager.powerups.length - 1; i >= 0; i--) {
            var powerup = EntityManager.powerups[i];

            if(powerup.isExpired) {

                for(var j = 0 ; j < powerup.shots; j++) {
                    EntityManager.bullets.push(new Bullet(powerup.pos[0], powerup.pos[1], (2 * Math.PI / powerup.shots) * j, powerup.speed));
                }

               EntityManager.powerups.splice(i, 1);
            }
        }

        if(Player.pos[0] > this.width) {
            Player.pos[0] = 0;
        }

        if(Player.pos[0] < 0) {
            Player.pos[0] = this.width;
        }

        if(Player.pos[1] > this.height) {
            Player.pos[1] = 0;
        }

        if(Player.pos[1] < 0) {
            Player.pos[1] = this.height;
        }


        if(!Player.isActive) {
            this.reset();
        }
    },

    draw: function (gameTime) {



        if (!this.content.isReady) {


            this.graphicsDevice.clear([0, 0, 0, 0]);

            if(Art.fontSmall.isReady) {
                this.spriteBatch.begin();
                this.spriteBatch.drawString(Art.fontSmall, 'LOADING...', [10, this.height - 50], null, 0, null, [0.8, 0.8, 0.8, 0.8]);
                this.spriteBatch.end();
            }

            return;
        }

        if(state == STATES.PAUSE) {

            this.spriteBatch.begin();
            this.spriteBatch.draw(Art.background.texture, [0, 0]);
            this.spriteBatch.end();

            this.spriteBatch.begin();
            this.spriteBatch.drawString(Art.font, 'INVICTUS', [95, this.height / 2 - 110], null, 0, null, [0.8, 0.8, 0.8, 0.8]);

            this.spriteBatch.drawString(Art.fontTiny, 'TAP/CLICK TO CHANGE DIRECTION', [65, this.height / 2 + 10], null, 0, null, [0.8, 0.8, 0.8, 0.8]);
            this.spriteBatch.drawString(Art.fontSmall, 'TAP/CLICK TO START', [80, this.height / 2 - 20], null, 0, null, [0.8, 0.8, 0.8, 0.8]);
            this.spriteBatch.drawString(Art.fontSmall, 'LD32 ' + VERSION, [10, this.height - 50], null, 0, null, [0.8, 0.8, 0.8, 0.8]);
            this.spriteBatch.drawString(Art.fontSmall, GameState.highscore.toString(),[12, 60], null, 0, null, [0.8, 0.8, 0.8, 0.8]);
            this.spriteBatch.drawString(Art.font, GameState.points.toString(),[10, 10], null, 0, null, [0.8, 0.8, 0.8, 0.8]);

            this.spriteBatch.end();

            return;
        }

        // Draw background
        this.spriteBatch.begin();
        this.spriteBatch.draw(Art.background.texture, [0, 0]);
        this.spriteBatch.end();

        // Draw powerups
        this.spriteBatch.begin();

        for(i = 0; i < EntityManager.powerups.length; i++) {

            var powerup = EntityManager.powerups[i];
            this.spriteBatch.draw(Art.powerup.texture, powerup.pos, Art.powerup.rectangle, Art.powerup.origin, powerup.angle, powerup.scale, powerup.color);
        }

        this.spriteBatch.end();

        // Draw enemies
        this.spriteBatch.begin();

        for(var i = 0; i < EntityManager.enemies.length; i++) {

            var enemy = EntityManager.enemies[i];
            this.spriteBatch.draw(Art.enemy.texture, enemy.pos, Art.enemy.rectangle, Art.enemy.origin, enemy.angle, enemy.scale, enemy.color);
        }

        this.spriteBatch.end();

        // Draw bullets
        this.spriteBatch.begin(BlendState.ADDITIVE);

        for(i = 0; i < EntityManager.bullets.length; i++) {

            var bullet = EntityManager.bullets[i];
            this.spriteBatch.draw(Art.bullet.texture, bullet.pos, Art.bullet.rectangle, Art.bullet.origin, bullet.angle, bullet.scale, bullet.color);
        }

        this.spriteBatch.end();

        // Draw player
        this.spriteBatch.begin();
        this.spriteBatch.draw(Art.ship.texture, Player.pos, Art.ship.rectangle, Art.ship.origin, Player.angle, Player.scale, Player.color);
        this.spriteBatch.end();

        // Draw points
        this.spriteBatch.begin();
        this.spriteBatch.drawString(Art.font, GameState.points.toString(),[10, 10], null, 0, null, [0.8, 0.8, 0.8, 0.8]);
        this.spriteBatch.drawString(Art.fontSmall, GameState.highscore.toString(),[12, 60], null, 0, null, [0.8, 0.8, 0.8, 0.8]);
        this.spriteBatch.end();

        //this.drawDebug();
    },

    drawDebug: function() {

        var lines = [
            '#LD32',
            'resolution: ' + this.width + 'x' + this.height,
            'fps: ' + this.fps.fps,
            'ENEMIES:' + EntityManager.enemies.length,
        ];

        this.spriteBatch.begin();

        for (var i = 0; i < lines.length; i++) {
            this.spriteBatch.drawString(this.debugfont, lines[i], [10, 100 + this.debugfont.lineHeight * i]);
        }

        this.spriteBatch.end();
    }

});

module.exports = MobileGame;
