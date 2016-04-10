var Game                = require('xnajs/game');
var Pointer             = require('xnajs/input/pointer');
var Keyboard            = require('xnajs/input/keyboard');
var Keys                = require('xnajs/input/keys');

// Test

var Effect              = require('xnajs/graphics/effect');
var SpriteBatch         = require('xnajs/graphics/sprite-batch');
var VertexBuffer        = require('xnajs/graphics/vertex-buffer');
var IndexBuffer         = require('xnajs/graphics/index-buffer');
var Texture2d           = require('xnajs/graphics/texture2d');
var BlendState          = require('xnajs/graphics/blend-state');

var mat4                = require('xnajs/matrix/mat4');

var vb, cvb, uvb, ib;
var projectionMatrix = mat4.create();
var texture = [];
var x,y;
var angle = 0;
var counter = 0, elapsed = 0, fps = 0;

var asteroids = [];
var MAX_ASTEROIDS = 10;
var astlen = 0;

var blending = 0; // 1 -  add

for(var i = 0; i < 200000; i++) {
    asteroids.push({
        x: - 300,
        y: (Math.random() * 800) | 0 - 800,
        angle: Math.random(),
        scale: Math.random(),
        vx: Math.random() * 200 + 100,
        vy: Math.random() * 200 + 100,
        va: Math.random() - 0.5,
        alpha: Math.random()
    });
}

function addAsteroid() {

    for(var i = astlen; i < MAX_ASTEROIDS; i++) {

        var asteroid = asteroids[i];

        asteroid.x = -300;
        asteroid.y = (Math.random() * 800) | 0 - 800;
        asteroid.angle =  Math.random();
        asteroid.scale = Math.random();
        asteroid.vx = Math.random() * 200 + 300;
        asteroid.vy = Math.random() * 200 + 500;
        asteroid.va = Math.random() - 0.5;
        asteroid.alpha = Math.random();

       astlen++;
    }
};

function removeAsteroid(i) {
    var item = asteroids[i];
    asteroids[i] = asteroids[astlen - 1];
    asteroids[astlen - 1] = item;
    astlen--;
};

function updateAsteroids(dx) {

    for (var i = astlen - 1; i >= 0; i--) {
        var asteroid = asteroids[i];

        asteroid.x += asteroid.vx * dx;
        asteroid.y += asteroid.vy * dx;
        asteroid.angle += asteroid.va * dx;

        if(asteroid.alpha > 0) {
            asteroid.alpha -= 0.001;
        }

        if (asteroid.x > 3000 || asteroid.y > 3000) {
            removeAsteroid(i);
        }

    }

};

var pos = [0, 0];
var orig = [0 , 0];
var sc = [0,0];
var cl = [0,0,0,0];

function draw() {

};

function drawAsteroids(spriteBatch, texture) {
    for (var i = astlen - 1; i >= 0; i--) {
        var asteroid = asteroids[i];

        var x = asteroid.x;
        var y = asteroid.y;
        var angle = asteroid.angle;
        var scale = asteroid.scale;
        var alpha = asteroid.alpha;
        spriteBatch.draw(texture, [160, 210], null, [texture.width / 2, texture.height / 2], angle, [scale, scale], [alpha, alpha, alpha, alpha]);
    }

}

var MobileGame = Game.extend({

    initialize: function() {
        this.base();

        this.width = 480;
        this.height = 720;

        this.graphicsDevice.backBufferWidth = this.width;
        this.graphicsDevice.backBufferHeight = this.height;

        Keyboard.addKey(Keys.LEFT);
        Keyboard.addKey(Keys.RIGHT);
        Keyboard.addKey(Keys.UP);
        Keyboard.addKey(Keys.DOWN);
        Keyboard.addKey(Keys.SPACEBAR);
    },

    loadContent: function() {

        texture[1] = this.content.load['Texture2D']('textures/floor_tile_02-1024.jpg');
        texture[2] = this.content.load['Texture2D']('textures/face.jpg');
        texture[3] = this.content.load['Texture2D']('fonts/ArialBlack_0.png');
        texture[4] = this.content.load['Texture2D']('textures/asteroid0.png');
        texture[5] = this.content.load['Texture2D']('textures/fire.png');
        texture[6] = this.content.load['Texture2D']('textures/smoke.png');


        this.spriteBatch = new SpriteBatch(this.graphicsDevice);
        this.fontLittera = this.content.load['SpriteFont']('fonts/font.fnt');
        this.fontArcade = this.content.load['SpriteFont']('fonts/arcade.fnt');
        this.font = this.content.load['SpriteFont']('fonts/quant.fnt');

    },

    update: function(gameTime) {

        if(Keyboard.isKeyDown(Keys.SPACEBAR)) {
            //key space action
        }
    },

    draw: function(gameTime) {

        if(!this.content.isReady) {
            return;
        }

        var gl = this.graphicsDevice.gl;

        this.graphicsDevice.clear([100 / 255, 149 / 255, 237 / 255, 1]);


        x = Pointer.items[0].x;
        y = Pointer.items[0].y;

        angle = (angle + gameTime.elapsedGameTime / 1000 * 0.8) % 360;

        counter++;
        elapsed += gameTime.elapsedGameTime;

        if(elapsed >= 1000) {
            fps = counter;
            elapsed = 0;
            counter = 0;
            document.title = fps + 'x: ' + x + ' y:' + y;
            lastFps = fps;
        }

        var fpsText = fps.toPrecision(2);

        drawAsteroids(this.spriteBatch, texture[4]);

        this.spriteBatch.drawString(this.fontLittera, 'Time: ' + Date(), [x, y + -50], null, 0, [0.5, 0.5], null);
        this.spriteBatch.drawString(this.fontLittera, 'Time: ' + Date(), [x, y + -80], null, 0, [0.5, 0.5], null);

        this.spriteBatch.drawString(this.fontLittera, 'fps: ' + fpsText, [x, y], null, 0, [1, 1], null);
        this.spriteBatch.drawString(this.fontLittera, 'xna.js framework', [x, y + 50], null, 0, [1, 1], null);
        this.spriteBatch.drawString(this.fontLittera, 'xna.js framework', [x, y + 100], null, angle, [1, 1], null);
        this.spriteBatch.drawString(this.fontLittera, 'xna.js framework', [x, y + 300], null, 0, [1, 1], null);
        this.spriteBatch.drawString(this.fontLittera, 'Press space to change blending', [x, y + 350], null, 0, [1, 1], null);

        this.spriteBatch.drawString(this.fontArcade, 'xna.js framework', [x, y + 150], null, 0, [1, 1], null);
        this.spriteBatch.drawString(this.fontArcade, 'Hello 3', [x, y + 200], null, 0, [(angle % 3) / 2, (angle % 3) / 2], null);

        this.spriteBatch.begin();
        for (var i = 0; i < 10; i++)
        this.spriteBatch.draw(texture[2], [x, y], null, null, 0, [this.width / texture[2].width, this.height / texture[2].height], [0.5, 0.5, 0.5, 0.5]);

        this.spriteBatch.end();

        // window.title
        var alpha = 1;
        var color = [alpha, alpha, alpha, 1];
        this.spriteBatch.begin();
        this.spriteBatch.drawString(this.font, 'xna.js', [10, 10], null, 0, [1, 1], color);
        this.spriteBatch.drawString(this.font, fps.toString(), [10, 10], null, 0, [1, 1], color);
        this.spriteBatch.drawString(this.font, 'Particles: ' + MAX_ASTEROIDS, [10, 46], null, 0, [1, 1], color);
        this.spriteBatch.end();

    }

});

module.exports = MobileGame;
