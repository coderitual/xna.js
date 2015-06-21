# xna.js
This is the first public version of xna.js. WebGL library strongly inspired by XNA/Monogame framework.
The library is in the early stages. I'm writing it because I want to learn WebGL and create some demo. Still a lot to do here.

Live demos:
* 2D Lighting:              
  http://xnajs.com/examples/02/
* Mobile game prototype:    
  http://xnajs.com/ld32/release/

How to use (lighting-example.js):
```javascript
// Core
var Game                = require('xnajs/game');
var Pointer             = require('xnajs/input/pointer');
var Keyboard            = require('xnajs/input/keyboard');
var Keys                = require('xnajs/input/keys');

// Graphics
var Effect              = require('xnajs/graphics/effect');
var SpriteBatch         = require('xnajs/graphics/sprite-batch');
var VertexBuffer        = require('xnajs/graphics/vertex-buffer');
var IndexBuffer         = require('xnajs/graphics/index-buffer');
var Texture2d           = require('xnajs/graphics/texture2d');
var Blend               = require('xnajs/graphics/blend');
var BlendState          = require('xnajs/graphics/blend-state');
var RenderTarget2D      = require('xnajs/graphics/render-target2d');

// Components
var FpsMeter            = require('xnajs-components/fps-meter');
var mat4                = require('xnajs/matrix/mat4');

var MobileGame = Game.extend({

    initialize: function() {
        this.base();

        this.width = 1136;
        this.height = 640;

        this.graphicsDevice.backBufferWidth = this.width;
        this.graphicsDevice.backBufferHeight = this.height;

        Keyboard.addKey(Keys.SPACE);
        Keyboard.addKey(Keys.D);
        Keyboard.addKey(Keys.Q);
        Keyboard.addKey(Keys.W);
        Keyboard.addKey(Keys.A);
        Keyboard.addKey(Keys.S);

        this.debug = false;

        var ambient = 0.1;

        this._lights = [];
        this._ambientLight = [ambient, ambient, ambient, 1];
        this._specularStrength = 0.5;

        // add lights
        this._lights.push({
            color: [1.0, 0.0, 1.0, 1.0],
            power: 0.8,
            lightDecay: 400,
            position: [0, 0, 10],
            isEnabled: true
        });

        this._lights.push({
            color: [0.2, 0.4, 1.0, 1.0],
            power: 0.4,
            lightDecay: 300,
            position: [this.width / 2, 100, 10],
            isEnabled: true
        });

        this.newState = null;
        this.oldState = Keyboard.getState();

    },

    loadContent: function() {

        this.spriteBatch = new SpriteBatch(this.graphicsDevice);

        this.texture         = this.content.load['Texture2D']('textures/floor_tile_02-1024.jpg');
        this.textureNormal   = this.content.load['Texture2D']('textures/floor_tile_02-1024_norm.jpg');
        this.font            = this.content.load['SpriteFont']('fonts/quant.fnt');
        this.debugFont       = this.content.load['SpriteFont']('fonts/calibri16.fnt');

        this.width = this.graphicsDevice.backBufferWidth;
        this.height= this.graphicsDevice.backBufferHeight;

        this.colorMapRenderTarget = new RenderTarget2D(this.graphicsDevice, this.width, this.height);
        this.shadowMapRenderTarget = new RenderTarget2D(this.graphicsDevice, this.width, this.height);
        this.normalMapRenderTarget = new RenderTarget2D(this.graphicsDevice, this.width, this.height);

        this.pointLightEffect = new Effect(this.graphicsDevice, require('./shaders/deferred-pointlight.fx'));
        this.lightCombinedEffect = new Effect(this.graphicsDevice, require('./shaders/deferred-combined.fx'));

        this.fpsMeter = new FpsMeter();
    },

    update: function(gameTime) {

        // Tweak parameters

        this.newState = Keyboard.getState();

        // Is the SPACE key down?
        if (this.newState.isKeyDown(Keys.SPACE))
        {
            //key has just been pressed.
            if (!this.oldState.isKeyDown(Keys.SPACE))
            {
                this._lights.push({
                    color: [Math.random(), Math.random(), Math.random(), 1.0],
                    power: (Math.random() * 10 + 1) * 0.1,
                    lightDecay:  Math.random() * 300 + 100,
                    position: [Math.random() * this.width, Math.random() * this.height, 80],
                    isEnabled: true
                })
            }
        }

        // Is the SPACE key down?
        if (this.newState.isKeyDown(Keys.D))
        {
            //key has just been pressed.
            if (!this.oldState.isKeyDown(Keys.D))
            {
               this.debug = !this.debug;
            }
        }


        if(this.newState.isKeyDown(Keys.Q)) {
            var ambient = this._ambientLight[0];
            ambient -= 0.05;
            ambient = Math.max(0, ambient);
            this._ambientLight = [ambient, ambient, ambient, 1];
        }

        if(this.newState.isKeyDown(Keys.W)) {
            var ambient = this._ambientLight[0];
            ambient += 0.05;
            ambient = Math.min(1, ambient);
            this._ambientLight = [ambient, ambient, ambient, 1];
        }

        if(this.newState.isKeyDown(Keys.A)) {
            this._specularStrength -= 0.05;
            this._specularStrength = Math.max(0, this._specularStrength);
        }

        if(this.newState.isKeyDown(Keys.S)) {
            this._specularStrength += 0.05;
            this._specularStrength = Math.min(10, this._specularStrength);
        }

        // Update saved state.
        this.oldState = this.newState;

        this._lights[0].position[0] = Pointer.items[0].x;
        this._lights[0].position[1] = Pointer.items[0].y;

        light = this._lights[1];
        light.position[0] = Math.sin(gameTime.totalGameTime / 1000) * this.width / 4 + this.width / 2;
        light.position[1] = Math.cos(gameTime.totalGameTime / 1000) * this.height / 4 + this.height / 2;

        this.fpsMeter.update(gameTime);
    },

    draw: function(gameTime) {

        if(!this.content.isReady) {
            return;
        }

        this.graphicsDevice.clear([100 / 255, 149 / 255, 237 / 255, 1]);

        // Set the render targets
        this.graphicsDevice.setRenderTarget(this.colorMapRenderTarget);

        // Clear all render targets
        this.graphicsDevice.clear([0, 0, 0, 0]);

        this.drawColorMap();

        this.graphicsDevice.setRenderTarget(null);
        this.graphicsDevice.setRenderTarget(this.normalMapRenderTarget);

        // Clear all render targets
        this.graphicsDevice.clear([0, 0, 0, 0]);

        this.drawNormalMap();

        // Deactive the rander targets to resolve them
        this.graphicsDevice.setRenderTarget(null);

        this.generateShadowMap();

        this.graphicsDevice.clear([0, 0, 0, 1]);

        // Finally draw the combined Maps onto the screen
        this.drawCombinedMaps();

        this.drawDebugRenderTargets(this.spriteBatch);
        this.drawDebugInformation();
    },

    drawColorMap: function() {

        this.spriteBatch.begin();
        this.spriteBatch.draw(this.texture, [0, 0]);
        this.spriteBatch.end();
    },

    drawNormalMap: function() {

        this.spriteBatch.begin();
        this.spriteBatch.draw(this.textureNormal, [0, 0]);
        this.spriteBatch.end();

    },

    generateShadowMap: function() {

        this.graphicsDevice.setRenderTarget(this.shadowMapRenderTarget);
        this.graphicsDevice.clear([0, 0, 0, 1]);

        for(var i = 0; i < this._lights.length; i++) {

            var light = this._lights[i];

            if(!light.isEnabled) {
                continue;
            }

            this.pointLightEffect.apply();

            this.pointLightEffect.parameters['lightStrength'].setValue(light.power);
            this.pointLightEffect.parameters['lightPosition'].setValue(light.position);
            this.pointLightEffect.parameters['lightColor'].setValue(light.color);
            this.pointLightEffect.parameters['lightDecay'].setValue(light.lightDecay);
            this.pointLightEffect.parameters['specularStrength'].setValue(this._specularStrength);

            this.pointLightEffect.parameters['screenWidth'].setValue(this.width);
            this.pointLightEffect.parameters['screenHeight'].setValue(this.height);
            this.pointLightEffect.parameters['NormalMap'].setValue(this.normalMapRenderTarget);
            this.pointLightEffect.parameters['ColorMap'].setValue(this.colorMapRenderTarget);


            this.spriteBatch.begin(null, this.pointLightEffect);

            var gl = this.graphicsDevice.gl;
            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.SRC_ALPHA, gl.ONE);
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

            this.spriteBatch.draw(this.normalMapRenderTarget, [0, 0]);
            this.spriteBatch.end();

        }


        this.graphicsDevice.setRenderTarget(null);

    },

    drawCombinedMaps: function() {

        this.lightCombinedEffect.apply();
        this.lightCombinedEffect.parameters['ambient'].setValue(1);
        this.lightCombinedEffect.parameters['lightAmbient'].setValue(4);
        this.lightCombinedEffect.parameters['ambientColor'].setValue(this._ambientLight);
        this.lightCombinedEffect.parameters['NormalMap'].setValue(this.normalMapRenderTarget);
        this.lightCombinedEffect.parameters['ColorMap'].setValue(this.colorMapRenderTarget);
        this.lightCombinedEffect.parameters['ShadingMap'].setValue(this.shadowMapRenderTarget);


        this.spriteBatch.begin(Blend.ALPHA_BLEND, this.lightCombinedEffect);
        this.spriteBatch.draw(this.colorMapRenderTarget, [0, 0]);
        this.spriteBatch.end();
    },

    drawDebugRenderTargets: function(spriteBatch) {

        if(!this.debug) {
            return;
        }

        spriteBatch.begin();

        var scale = [1 / 3, 1 / 3];

        spriteBatch.draw(this.colorMapRenderTarget, [0, this.height - this.height / 3], null, null, 0, scale, null);
        spriteBatch.draw(this.normalMapRenderTarget, [this.width / 3, this.height - this.height / 3], null, null, 0, scale, null);
        spriteBatch.draw(this.shadowMapRenderTarget, [this.width / 3 * 2, this.height - this.height / 3], null, null, 0, scale, null);

        spriteBatch.end();

    },

    drawDebugInformation: function() {

        var lines = [
            'xna.js',
            'fps: ' + this.fpsMeter.fps,
            'x: ' + Pointer.items[0].x + ', y: ' + Pointer.items[0].y,
            'lights: ' + this._lights.length,
            'Press SPACE to add light',
            'Press D to toggle debug',
            'Q,W: Ambient light: ' + this._ambientLight[0].toPrecision(2),
            'A,S: Specular strength: ' + this._specularStrength.toPrecision(2)
        ];

        this.spriteBatch.begin();

        for(var i = 0; i < lines.length; i++) {
            this.spriteBatch.drawString(this.debugFont, lines[i], [10, 10 + this.debugFont.lineHeight * i]);
        }


        this.spriteBatch.end();

    }

});

//public static BlendState BlendBlack = new BlendState()
//{
//    ColorBlendFunction = BlendFunction.Add,
//        ColorSourceBlend = Blend.One,
//        ColorDestinationBlend = Blend.One,
//
//        AlphaBlendFunction = BlendFunction.Add,
//        AlphaSourceBlend = Blend.SourceAlpha,
//        AlphaDestinationBlend = Blend.One
//};

module.exports = MobileGame;

```
