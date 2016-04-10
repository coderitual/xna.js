var Class = require('./class');
var GameWindow = require('./core/game-window');
var GameLoop = require('./core/game-loop');
var GraphicsDevice = require('./graphics/graphics-device');

var ContentManager = require('./content/content-manager');
var Texture2DLoader = require('./content/texture2d-loader');
var SpriteFontLoader = require('./content/spritefont-loader');
var Pointer = require('./input/pointer');
var Keyboard = require('./input/keyboard');
var Game = Class.extend({

    constructor: function (parent) {

        this.isFixedTimeStep = false;
        this.targetElapsedTime = 16;

        this.window = new GameWindow(parent);
        this.graphicsDevice = new GraphicsDevice(this);

        this.content = new ContentManager(this.graphicsDevice);
        this.content.rootDirectory = 'content';
        this.content.addLoader('Texture2D', Texture2DLoader);
        this.content.addLoader('SpriteFont', SpriteFontLoader);
        
        Object.defineProperty(this, 'isMouseVisible', {
            get: function () {
                return this.window.canvas.style.cursor != 'none';
            },

            set: function (value) {
                this.window.canvas.style.cursor = value ? 'auto' : 'none';
            }
        });

    },

    run: function () {

        this.window.initialize();

        Pointer.initialize(this.window);
        Keyboard.initialize();

        this.initialize();

        this.graphicsDevice.initialize();
        this.loadContent();

        var gameLoop = new GameLoop(this);
        gameLoop.run();
    },

    _tick: function () {
        this.window.update();
    },

    initialize: function () {
        // User code here
    },

    loadContent: function () {
        // User code here
    },

    update: function (gameTime) {
        // User code here
    },

    draw: function (gameTime) {
        // User code here
    }

});

module.exports = Game;