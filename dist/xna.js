(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.XNAJS = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var e = !1;
var i = /\bsuper\b/;

var Class = function() {};

Class.extend = function(t) {
    function s() {
        e || (this.constructor && this.constructor.apply(this, arguments))
    }
    var n = this.prototype;
    e = true;
    var o = new this();
    e = false;
    for (var h in t) {
        var r = Object.getOwnPropertyDescriptor(t, h);
        r.get || r.set ? Object.defineProperty(o, h, r) : o[h] = "function" == typeof t[h] && "function" == typeof n[h] && i.test(t[h]) ? function(t, e) {
            return function() {
                var u = this.super;
                this.super = n[t], this._fn = e;
                var c = this._fn.apply(this, arguments);
                return this.super = u, c;
            }
        }(h, t[h]) : t[h]
    }
    
    s.prototype = o;
    s.prototype.constructor = o.constructor;
    s.extend = this.extend;
    return s;
}; 

module.exports = Class 

},{}],2:[function(require,module,exports){
var ContentManager = function(graphicsDevice) {

    this.graphicsDevice = graphicsDevice;
    this.rootDirectory  = '';

    this._pending   = 0;
    this._loaded    = 0;
    this._assets     = {};

    this.load       = {};

    Object.defineProperty(this, 'isReady', {
        get: function() {
            return this._pending === this._loaded;
        }
    });
};

ContentManager.prototype = {
    
    constructor: ContentManager,

    addLoader: function(name, loader) {
        this.load[name] = loader(this);
    },

    addAsset: function(loader, assetName, asset, async) {

        if (this._assets[assetName]) {
            return;
        }

        this._assets[assetName] = {
            loader: loader,
            asset:  asset,
            async:  async || 0,
            loaded: !async
        };

        this._pending++;

        if(!async) {
            this._loaded++;
        }
    },

    getAsset: function(assetName) {

        var item = this._assets[assetName];
        return item && item.asset;
    },

    onAssetLoaded: function(assetName) {

        var item = this._assets[assetName];

        if(item && item.async && !item.loaded) {
            item.loaded = true;
            this._loaded++;
        }
    }
};

module.exports = ContentManager;

},{}],3:[function(require,module,exports){
var SpriteFont = require('../graphics/sprite-font');

var onLoad = function(contentManager, assetName, spriteFont, request) {

    return function() {

        if (request.readyState !== 4 || request.status !== 200) {
            return;
        }

        var responseXML = request.responseXML;

        // load associated texture
        var baseUrl = assetName.replace(/[^\/]*$/, '');
        var textureUrl = baseUrl + responseXML.getElementsByTagName('page')[0].getAttribute('file');
        spriteFont.texture = contentManager.load['Texture2D'](textureUrl);

        // parse font info
        var info = responseXML.getElementsByTagName('info')[0];
        var common = responseXML.getElementsByTagName('common')[0];

        spriteFont.name = info.getAttribute('face');
        spriteFont.size = parseInt(info.getAttribute('size'), 10);
        spriteFont.lineHeight = parseInt(common.getAttribute('lineHeight'), 10);

        spriteFont.glyphs = {};

        //parse letters
        var chars = responseXML.getElementsByTagName('char');
        for (var i = 0; i < chars.length; i++) {
            var charCode = parseInt(chars[i].getAttribute('id'), 10);

            var source = [
                parseInt(chars[i].getAttribute('x'), 10),
                parseInt(chars[i].getAttribute('y'), 10),
                parseInt(chars[i].getAttribute('width'), 10),
                parseInt(chars[i].getAttribute('height'), 10)
            ];

            spriteFont.glyphs[charCode] = {
                offset: [parseInt(chars[i].getAttribute('xoffset'), 10), parseInt(chars[i].getAttribute('yoffset'), 10)],
                xAdvance: parseInt(chars[i].getAttribute('xadvance'), 10),
                kerning: {},
                source: source
            };
        }

        //parse kernings
        var kernings = responseXML.getElementsByTagName('kerning');
        for (i = 0; i < kernings.length; i++) {
            var first = parseInt(kernings[i].getAttribute('first'), 10);
            var second = parseInt(kernings[i].getAttribute('second'), 10);
            var amount = parseInt(kernings[i].getAttribute('amount'), 10);

            spriteFont.glyphs[second].kerning[first] = amount;

        }

        // finished
        contentManager.onAssetLoaded(assetName);
    }
};

var SpriteFontLoader = function(contentManager) {

    return function(assetName) {
        var spriteFont = contentManager.getAsset(assetName);

        if(!spriteFont) {

            spriteFont = new SpriteFont(contentManager.graphicsDevice);
            contentManager.addAsset(this, assetName, spriteFont, true);

            var request = new XMLHttpRequest();
            request.addEventListener('readystatechange', onLoad(contentManager, assetName, spriteFont, request));
            request.open('GET', contentManager.rootDirectory + '/' + assetName);
            request.overrideMimeType('application/xml');
            request.send(null);
        }

        return spriteFont;
    };
};

module.exports = SpriteFontLoader;
},{"../graphics/sprite-font":20}],4:[function(require,module,exports){
var Texture2D = require('../graphics/texture2d');

var onLoad = function(contentManager, assetName, texture, image) {

    return function() {
        texture.setData(image);
        contentManager.onAssetLoaded(assetName);
    }
};

var Texture2DLoader = function(contentManager) {

    return function(assetName) {

        var texture = contentManager.getAsset(assetName);

        if(!texture) {

            texture = new Texture2D(contentManager.graphicsDevice);
            contentManager.addAsset(this, assetName, texture, true);

            var image = new Image();
            image.addEventListener('load', onLoad(contentManager, assetName, texture, image));
            image.src = contentManager.rootDirectory + '/' + assetName;
        }

        return texture;
    };
};

module.exports = Texture2DLoader;
},{"../graphics/texture2d":21}],5:[function(require,module,exports){
// shim layer with setTimeout fallback
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ) { window.setTimeout(callback, 1000 / 60); };
})();

// shim performance timer
window.performance = window.performance || {};
performance.now = (function() {
    return performance.now      ||
        performance.mozNow    ||
        performance.msNow     ||
        performance.oNow      ||
        performance.webkitNow ||
        function() { return new Date().getTime(); };
})();

var GameTime = require('./game-time');

var GameLoop = function(game) {
    
    this.game           = game;
    this.maxElapsedTime = 500;
    
    this._gameTime                  = new GameTime();
    this._accumulatedElapsedTime    = 0;
    this._previousTicks             = 0;
    
    var _this = this;
    this._onframe = function() {
        _this.tick();
    }
};

GameLoop.prototype = {
    
    constructor: GameLoop,
    
    tick: function() {
        
        requestAnimFrame(this._onframe);
        
        var game = this.game;
        var targetElapsedTime = game.targetElapsedTime;
        var isFixedTimeStep = game.isFixedTimeStep;
            
        var currentTicks = performance.now();
        this._accumulatedElapsedTime += (currentTicks - this._previousTicks);
        this._previousTicks = currentTicks;
        
        if (this._accumulatedElapsedTime > this.maxElapsedTime) {
            this._accumulatedElapsedTime = this.maxElapsedTime;
        }

        game._tick();
        
        if(isFixedTimeStep) {
            
            this._gameTime.elapsedGameTime = targetElapsedTime;
            
            while (this._accumulatedElapsedTime >= targetElapsedTime) {
                
                this._gameTime.totalGameTime += targetElapsedTime;
                this._accumulatedElapsedTime -= targetElapsedTime;
                
                game.update(this._gameTime);
            }
            
        } else {
            
            this._gameTime.elapsedGameTime = this._accumulatedElapsedTime;
            this._gameTime.totalGameTime += this._accumulatedElapsedTime;
            this._accumulatedElapsedTime = 0;
            
            game.update(this._gameTime);
        }
        
        this._gameTime.alpha = this._accumulatedElapsedTime / targetElapsedTime;
        game.draw(this._gameTime);
    },
    
    run: function() {
        
        this._gameTime.totalGameTime    = 0;
        this._gameTime.elapsedGameTime  = 0;
        this._gameTime.alpha            = 0;
        
        this._accumulatedElapsedTime    = 0;
        this._previousTicks             = 0;
        
        this.tick();
    }
    
}

module.exports = GameLoop

},{"./game-time":6}],6:[function(require,module,exports){
var GameTime = function() {
    this.elapsedGameTime    = 0;
    this.totalGameTime      = 0;
    this.alpha              = 0;
};

module.exports = GameTime;
},{}],7:[function(require,module,exports){
function isElement(o){
  return typeof HTMLElement === "object" ? o instanceof HTMLElement : 
         o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string";
}

var GameWindow = function(element) {
    
    this._initialized = false;
    
    this.element = null;
    
    if(typeof element === 'string') {
        
        element = document.querySelector(element);
    }

    if (isElement(element)) {
        
        this.element = element;
        
    } else {
        
        this.element = document.body;
    }
    
    this.canvas     = document.createElement('canvas');
    this.canvas.id  = 'x-surface';

    this.element.appendChild(this.canvas);

    this.clientBounds = {
        x:      0,
        y:      0,
        width:  0,
        height: 0
    };
    
    this.scale = {
        x: 1,
        y: 1
    };
    
    this.aspectRatio = 0;
    
    this._oncontextmenu = null;
};

GameWindow.prototype = {
    
    constructor: GameWindow,

    initialize: function() {

        if(this._initialized) {
            return;
        }

        this._oncontextmenu = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        this.canvas.addEventListener('contextmenu', this._oncontextmenu, false);
        
        this._initialized = true;
    },
    
    dispose: function() {
        
        if(!this._initialized) {
            return;
        }

        this.canvas.removeEventListener('contextmenu', this._oncontextmenu, false);

        this._initialized = false;
    },
    
    update: function() {

        if(!this._initialized) {
            return;
        }

        this.refreshClientRect();
    },

    refreshClientRect: function() {

        var boundingClientRect = this.canvas.getBoundingClientRect();

        this.clientBounds.x         = boundingClientRect.left;
        this.clientBounds.y         = boundingClientRect.top;
        this.clientBounds.width     = boundingClientRect.width;
        this.clientBounds.height    = boundingClientRect.height;

        this.scale.x = boundingClientRect.width / this.canvas.width;
        this.scale.y = boundingClientRect.height / this.canvas.height;

        this.aspectRatio = boundingClientRect.width / boundingClientRect.height;
    }
}

module.exports = GameWindow;

},{}],8:[function(require,module,exports){
'use strict'

var Device = {

    ua: {
        mobile: false
    },

    isPortrait: function() {
        return (!Device.ua.mobile || window.innerHeight > window.innerWidth)
    }

};

// Initialize
(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))Device.ua.mobile = true})(navigator.userAgent||navigator.vendor||window.opera);

module.exports = Device;

},{}],9:[function(require,module,exports){
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

},{"./class":1,"./content/content-manager":2,"./content/spritefont-loader":3,"./content/texture2d-loader":4,"./core/game-loop":5,"./core/game-window":7,"./graphics/graphics-device":15,"./input/keyboard":25,"./input/pointer":27}],10:[function(require,module,exports){
var Blend = require('./blend');


var BlendState = {

    OPAQUE:                 [Blend.ONE, Blend.ZERO],
    ADDITIVE:               [Blend.SRC_ALPHA, Blend.ONE],
    ALPHA_BLEND:            [Blend.ONE, Blend.ONE_MINUS_SRC_ALPHA],
    NON_PREMULTIPLED:       [Blend.SRC_ALPHA, Blend.ONE_MINUS_SRC_ALPHA]
};

module.exports = BlendState;
},{"./blend":11}],11:[function(require,module,exports){
var Blend = {
    ZERO                           : 0,
    ONE                            : 1,
    SRC_COLOR                      : 0x0300,
    ONE_MINUS_SRC_COLOR            : 0x0301,
    SRC_ALPHA                      : 0x0302,
    ONE_MINUS_SRC_ALPHA            : 0x0303,
    DST_ALPHA                      : 0x0304,
    ONE_MINUS_DST_ALPHA            : 0x0305,
    DST_COLOR                      : 0x0306,
    ONE_MINUS_DST_COLOR            : 0x0307,
    SRC_ALPHA_SATURATE             : 0x0308
};

module.exports = Blend;
},{}],12:[function(require,module,exports){
var BufferUsage = {
    NONE: 0,
    WRITE_ONLY: 1
};

module.exports = BufferUsage;
},{}],13:[function(require,module,exports){
var VertexBuffer    = require('./vertex-buffer');
var Texture2D       = require('./texture2d');

/*
    Helper
    ------------------------------------------------------------------------
 */

function arraysEqual(a, b) {
    var i = a.length;

    if (i != b.length) return false;

    while (i--) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

/*
    Uniforms
 ------------------------------------------------------------------------
 */

var setFloat = function(value) {

    if(this.value === value) return;

    this.value = value;

    var gl = this.effect.graphicsDevice.gl;
    gl.uniform1f(this.location, this.value);

};

var setFloatVec = function(value) {

    if(this.value && arraysEqual(this.value, value))  return;

    this.value = value;

    var len = value.length;
    var gl = this.effect.graphicsDevice.gl;

    switch(len) {
        case 2: gl.uniform2fv(this.location, value); break;
        case 3: gl.uniform3fv(this.location, value); break;
        case 4: gl.uniform4fv(this.location, value); break;
    }

};

var setFloatMat = function(value) {

    if(this.value && arraysEqual(this.value, value))  return;

    this.value = value;

    var len = value.length;
    var gl = this.effect.graphicsDevice.gl;

    switch(len) {
        case 4: gl.uniformMatrix2fv(this.location, false, value); break;
        case 9: gl.uniformMatrix3fv(this.location, false, value); break;
        case 16: gl.uniformMatrix4fv(this.location, false, value); break;
    }

};

var setInt = function(value) {

    if(this.value === value) return;

    this.value = value;

    var gl = this.effect.graphicsDevice.gl;
    gl.uniform1i(this.location, this.value);

};

var setIntVec = function(value) {

    if(this.value && arraysEqual(this.value, value))  return;

    this.value = value;

    var len = value.length;
    var gl = this.effect.graphicsDevice.gl;

    switch(len) {
        case 2: gl.uniform2iv(this.location, value); break;
        case 3: gl.uniform3iv(this.location, value); break;
        case 4: gl.uniform4iv(this.location, value); break;
    }

};

var setTexture = function(value) {

    if(!(value instanceof Texture2D)) {
        throw new Error('[EffectParameter::setTexture] Texture2D parameter type required');
    }

    if(this.value === value) return;
    this.value = value;

    var gl = this.effect.graphicsDevice.gl;

    gl.uniform1i(this.location, this.sampler);
    this.value.bind(this.sampler);

};

/*
    Attributes
 ------------------------------------------------------------------------
 */

var setVertexBuffer = function(value) {

    if(!(value instanceof VertexBuffer)) {
        throw new Error('[EffectParameter::setVertexBuffer] VertexBuffer parameter type required');
    }

    if(this.value === value) return;
    this.value = value;

    var gl = this.effect.graphicsDevice.gl;

    gl.enableVertexAttribArray(this.location);
    gl.bindBuffer(gl.ARRAY_BUFFER, value.buffer);
    gl.vertexAttribPointer(this.location, value.chunkSize, gl.FLOAT, false, 0, 0);

    this.value = value;

};

var EffectParameter = function(effect, name, info, type) {

    this.effect     = effect;
    this.name       = name;
    this.location   = info.location;
    this.type       = type;
    this.value      = null;

    /**
     * Texture sampler
     * @type {number}
     */
    this.sampler = -1;

    /**
     * Value setter depends on parameter type
     * @type {null}
     */
    this.setValue = null;

    var gl = effect.graphicsDevice.gl;

    if(type === EffectParameter.TYPE_UNIFORM) {         // Uniform

        switch(info.type) {

            case gl.INT:
            case gl.BOOL:
                this.setValue = setInt;
                break;

            case gl.INT_VEC2:
            case gl.INT_VEC3:
            case gl.INT_VEC4:
            case gl.BOOL_VEC2:
            case gl.BOOL_VEC3:
            case gl.BOOL_VEC4:
                this.setValue = setIntVec;
                break;

            case gl.FLOAT_VEC2:
            case gl.FLOAT_VEC3:
            case gl.FLOAT_VEC4:
                this.setValue = setFloatVec;
                break;

            case gl.FLOAT_MAT2:
            case gl.FLOAT_MAT3:
            case gl.FLOAT_MAT4:
                this.setValue = setFloatMat;
                break;

            case gl.SAMPLER_2D:
                this.setValue = setTexture;
                this.effect.samplers.push(this.name);
                this.sampler = this.effect.samplers.length - 1;
                break;

            case gl.FLOAT:
            default:
                this.setValue = setFloat;
                break;
        }

    } else {                                        // Attribute

            this.setValue = setVertexBuffer;

    }

};

EffectParameter.prototype = {

    constructor: EffectParameter

};

EffectParameter.TYPE_UNIFORM    = 0;
EffectParameter.TYPE_ATTRIBUTE  = 1;

module.exports = EffectParameter;
},{"./texture2d":21,"./vertex-buffer":22}],14:[function(require,module,exports){
var Class               = require('../class');
var EffectParameter     = require('./effect-parameter');

var Effect = Class.extend({
    
    constructor: function(graphicsDevice, vertexShaderCode, fragmentShaderCode) {

        // create shader
        
        this.graphicsDevice = graphicsDevice;

        var gl = graphicsDevice.gl;

        if(!fragmentShader) {
            fragmentShaderCode  = '#define FRAGMENT\n' + vertexShaderCode;
            vertexShaderCode    = '#define VERTEX\n' + vertexShaderCode;
        }

        var vertexShader = graphicsDevice.createShader(vertexShaderCode, gl.VERTEX_SHADER);
        var fragmentShader = graphicsDevice.createShader(fragmentShaderCode, gl.FRAGMENT_SHADER);

        this.program = graphicsDevice.createProgram(vertexShader, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        
        // init parameters
        
        this._attributes    = graphicsDevice.getAttributes(this.program);
        this._uniforms      = graphicsDevice.getUniforms(this.program);
        this.parameters     = {};
        this.samplers       = [];
        
        for (var key in this._uniforms) {

            if(this._uniforms.hasOwnProperty(key)) {

                var uniform = this._uniforms[key];
                this.parameters[key] = new EffectParameter(this, key, uniform, EffectParameter.TYPE_UNIFORM);
            }

        }

        for (var key in this._attributes) {

            if(this._attributes.hasOwnProperty(key)) {

                var attribute = this._attributes[key];
                this.parameters[key] = new EffectParameter(this, key, attribute, EffectParameter.TYPE_ATTRIBUTE);
            }

        }

    },

    getAttributeLocation: function(name) {
        return this._attributes[name].location;
    },

    destroy: function() {

        if (this.graphicsDevice.gl && this.program) {
            var gl = this.graphicsDevice.gl;
            gl.deleteProgram(this.program);
        }
    },
    
    apply: function() {

        this.graphicsDevice.useEffect(this);
    },

    reset: function() {

        for (var key in this.parameters) {

            if(this.parameters.hasOwnProperty(key)) {

                var parameter = this.parameters[key];
                parameter.value = null;
            }

        }
    }
});

module.exports = Effect;
},{"../class":1,"./effect-parameter":13}],15:[function(require,module,exports){
var BlendState = require('./blend-state');

var GraphicsDevice = function(game) {

    this._initialized = false;

    this.game           = game;
    this.canvas         = game.window.canvas;
    this.gl             = null;
    
    this._textures          = [];
    this._effect            = null;
    this._renderTarget      = null;
    this._blendState        = null;

    Object.defineProperty(this, 'backBufferWidth', {

        get: function() {

            return this.canvas.width;
        },

        set: function(value) {

            this.canvas.width = value;

            if(this._initialized) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        }

    });

    Object.defineProperty(this, 'backBufferHeight', {

        get: function() {

            return this.canvas.height;
        },

        set: function(value) {

            this.canvas.height = value;

            if(this._initialized) {
                this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            }
        }

    });

    Object.defineProperty(this, 'blendState', {

        get: function() {

            return this._blendState;
        },

        set: function(value) {

            if(!value || (this._blendState[0] === value[0] && this._blendState[1] === value[1])) {
                return;
            }

            var gl = this.gl;

            if(value[0] === BlendState.OPAQUE[0] && value[1] === BlendState.OPAQUE[1]) {
                gl.disable(gl.BLEND);
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.enable(gl.BLEND);
                gl.disable(gl.DEPTH_TEST);
            }

            this._blendState = value;
            gl.blendFunc(value[0], value[1]);

        }

    });
};

GraphicsDevice.prototype = {
    
    constructor: GraphicsDevice,

    initialize: function() {

        if(this._initialized) {
            return;
        }

        var options = {
            alpha: false,
            preserveDrawingBuffer: false,
            stencil: true,
            antialias: false
        };
        
        try {

            this.gl = this.canvas.getContext('webgl', options) || this.canvas.getContext('experimental-webgl', options);

        } catch(e) {}

        if (!this.gl) {

            console.error('Unable to initialize Webgl. Your browser may not support it.');
            this.gl = null;

        }

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this._blendState = BlendState.OPAQUE;

        this._initialized = true;
    },

    clear: function(color) {

        var gl = this.gl;

        gl.clearColor(color[0], color[1], color[2], color[3]);
        gl.clear(gl.COLOR_BUFFER_BIT);
    },

    createShader: function(src, type) {

        var gl = this.gl;

        var shader = gl.createShader(type);
        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

            var message = '[GraphicsDevice::createShader] An error occurred compiling ' + ((type === gl.VERTEX_SHADER) ? 'vertex' : 'fragment') + ' shader: ';
            message += gl.getShaderInfoLog(shader);

            console.error(message);

            return null;
        }

        return shader;
    },

    createProgram: function(vertexShader, fragmentShader) {

        var gl = this.gl;

        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

            console.error('[GraphicsDevice::createProgram] Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));

            gl.deleteProgram(program);
            return null;

        }

        return program;

    },

    getAttributes: function(program) {

        var gl = this.gl;

        var results = {};

        var len = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        for (var i = 0; i < len; i++) {

            var info = gl.getActiveAttrib(program, i);

            results[info.name] = {
                type: info.type,
                location: gl.getAttribLocation(program, info.name)
            };

        }

        return results;
    },

    getUniforms: function(program) {

        var gl = this.gl;

        var results = {};

        var len = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        for (var i = 0; i < len; i++) {

            var info = gl.getActiveUniform(program, i);

            results[info.name] = {
                type: info.type,
                location: gl.getUniformLocation(program, info.name)
            };

        }

        return results;
    },

    createTexture: function() {

        var gl = this.gl;

        var texture = gl.createTexture();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture

    },

    drawUserPrimitives: function(primitiveType, primitivesCount, offset) {

        var gl = this.gl;
        gl.drawArrays(primitiveType || gl.TRIANGLES, 0, primitivesCount);

    },

    drawUserIndexedPrimitives: function(primitiveType, indexbuffer, primitivesCount, offset) {

        var gl = this.gl;
        gl.drawElements(primitiveType || gl.TRIANGLES, primitivesCount || indexbuffer.indexCount, gl.UNSIGNED_SHORT, offset || 0);

    },

    useEffect: function(effect) {

        var gl = this.gl;

        if(this._effect === effect) {
            return;
        }

        if(effect != void 0) {

            this._effect = effect;
            this._effect.reset();
            gl.useProgram(this._effect.program);

        } else {

            this._effect = null;
            gl.useProgram(null);

        }
    },

    setRenderTarget: function(renderTarget) {

        var gl = this.gl;

        if(this._renderTarget === renderTarget) {
            return;
        }

        if(renderTarget != void 0) {

            this._renderTarget = renderTarget;
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.framebuffer);


        } else {

            this._renderTarget = null;
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        }

    }

};

module.exports = GraphicsDevice;

},{"./blend-state":10}],16:[function(require,module,exports){
var IndexBuffer = function(graphicsDevice, usage) {

    var gl = graphicsDevice.gl;

    this.graphicsDevice = graphicsDevice;
    this.buffer         = gl.createBuffer();
    this.usage          = usage || gl.STATIC_DRAW;
    this.data           = null;

    Object.defineProperty(this, 'indexCount', {

        get: function() {
            return this.data ? this.data.length : 0;
        }

    });

};

IndexBuffer.prototype = {

    constructor: IndexBuffer,

    setData: function(data) {

        var gl = this.graphicsDevice.gl;

        this.data = data;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.data, this.usage);

    },

    getData: function() {

        return this.data;
    }
};

module.exports = IndexBuffer;
},{}],17:[function(require,module,exports){
var PrimitiveType = {
    POINTS                         : 0x0000,
    LINES                          : 0x0001,
    LINE_LOOP                      : 0x0002,
    LINE_STRIP                     : 0x0003,
    TRIANGLES                      : 0x0004,
    TRIANGLE_STRIP                 : 0x0005,
    TRIANGLE_FAN                   : 0x0006
};

module.exports = PrimitiveType;
},{}],18:[function(require,module,exports){
var Texture2D = require('./texture2d');

var RenderTarget2D = Texture2D.extend({

    constructor: function(graphicsDevice, width, height) {

        this.super(graphicsDevice, width, height);

        var gl = graphicsDevice.gl;

        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        this.setData(null);

        this.renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

});

module.exports = RenderTarget2D;
},{"./texture2d":21}],19:[function(require,module,exports){


var VertexBuffer        = require('./vertex-buffer');
var IndexBuffer         = require('./index-buffer');
var Effect              = require('./effect');
var BlendState          = require('./blend-state');

var mat4                = require('../matrix/mat4');
var mat3                = require('../matrix/mat3');
var vec2                = require('../matrix/vec2');

var SpriteEffectCode = "#ifdef VERTEX\r\n\r\nattribute vec3 position;\r\nattribute vec4 color;\r\nattribute vec2 texCoord;\r\n\r\nvarying vec2 _texCoord;\r\nvarying vec4 _color;\r\n\r\nuniform mat4 ViewProjectionMatrix;\r\n\r\nvoid main() {\r\n    gl_Position = ViewProjectionMatrix * vec4(position, 1.0);\r\n    _texCoord = texCoord;\r\n    _color = color;\r\n}\r\n\r\n#endif\r\n\r\n#ifdef FRAGMENT\r\n\r\nprecision mediump float;\r\nvarying vec2 _texCoord;\r\nvarying vec4 _color;\r\nuniform sampler2D Texture;\r\n\r\nvoid main() {\r\n    gl_FragColor = texture2D(Texture, _texCoord) * _color;\r\n}\r\n\r\n#endif";

// helper matrix for transform operations
var tmpMat3 = mat3.create();
var tmpVec2 = vec2.create();

var SpriteBatch = function(graphicsDevice, size) {

    this.graphicsDevice = graphicsDevice;

    this._defaultEffect = new Effect(this.graphicsDevice, SpriteEffectCode);
    this._effect        = null;

    this._size          = size || 512;
    this._count         = 0;

    this._matrix        = mat4.create();
    this._projection    = mat4.create();

    this._vertexBuffer  = new VertexBuffer(this.graphicsDevice, 2);
    this._uvBuffer      = new VertexBuffer(this.graphicsDevice, 2);
    this._colorBuffer   = new VertexBuffer(this.graphicsDevice, 4);
    this._indexBuffer   = new IndexBuffer(this.graphicsDevice);

    this._texture = null;

    this.expand(this._size);
};

SpriteBatch.prototype = {

    constructor: SpriteBatch,

    begin: function(blendState, effect, matrix) {

        this._count = 0;
        this._effect = effect || this._defaultEffect;
        this._effect.apply();

        this._matrix = matrix || mat4.identity(this._matrix);

        this.graphicsDevice.blendState = blendState || BlendState.ALPHA_BLEND;

        mat4.ortho(this._projection, 0, this.graphicsDevice.backBufferWidth, this.graphicsDevice.backBufferHeight, 0, 0, 1);
        mat4.multiply(this._projection, this._matrix, this._projection);
    },

    end: function() {

        this.flush();
        this._effect = null;
    },

    flush: function() {

        if( this._count < 1) {
            return;
        }

        var gl = this.graphicsDevice.gl;

        var parameters = this._effect.parameters;

        if(parameters['position']) parameters['position'].setValue(this._vertexBuffer);
        if(parameters['color']) parameters['color'].setValue(this._colorBuffer);
        if(parameters['texCoord']) parameters['texCoord'].setValue(this._uvBuffer);
        if(parameters['Texture']) parameters['Texture'].setValue(this._texture);
        if(parameters['ViewProjectionMatrix']) parameters['ViewProjectionMatrix'].setValue(this._projection);

        this._vertexBuffer.setData(this._vertices);
        this._uvBuffer.setData(this._uvs);
        this._colorBuffer.setData(this._colors);

        this.graphicsDevice.drawUserIndexedPrimitives(gl.TRIANGLES, this._indexBuffer, this._count * 6);
        this._count = 0;
    },

    expand: function(batchSize) {

        this._size = batchSize;

        this._vertices      = new Float32Array(this._size * 2 * 4);     // 2 components, 4 points (2 triangles)
        this._uvs           = new Float32Array(this._size * 2 * 4);     // 2 components, 4 points (2 triangles)
        this._colors        = new Float32Array(this._size * 4 * 4);     // 4 components, 4 points (2 triangles)
        this._indices       = new Uint16Array(this._size * 6);           // 6 points per rect

        for(var i = 0; i < this._size; i++) {

            var indexNum = i * 6;
            var pointNum = i * 4;

            this._indices[indexNum]        = pointNum;
            this._indices[indexNum + 1]    = pointNum + 1;
            this._indices[indexNum + 2]    = pointNum + 2;
            this._indices[indexNum + 3]    = pointNum + 1;
            this._indices[indexNum + 4]    = pointNum + 3;
            this._indices[indexNum + 5]    = pointNum + 2;
        }

        this._indexBuffer.setData(this._indices);

    },

    /**
     * Adds a sprite to a batch of sprites to be rendered.
     * @param texture
     * @param pos
     * @param source
     * @param origin
     * @param rotation
     * @param scale
     * @param color
     */
    draw: function(texture, pos, source, origin, rotation, scale, color) {

        if(this._texture && this._texture !== texture) {
            this.flush();
        }

        if(this._count + 1 > this._size) {
            this.flush();
            this.expand(this._size * 2);
        }

        this._texture = texture;

        var tw = this._texture.width;
        var th = this._texture.height;
        var idx = this._count;
        var offset = idx * 2 * 4;

        // r, g, b, a
        color = color || [1, 1, 1, 1];

        for(var i = 0; i < 4; i++) {
            this._colors[idx * 16 + (i * 4)]       = color[0];
            this._colors[idx * 16 + (i * 4) + 1]   = color[1];
            this._colors[idx * 16 + (i * 4) + 2]   = color[2];
            this._colors[idx * 16 + (i * 4) + 3]   = color[3];
        }

        // x, y, width, height
        source = source || [0, 0, tw, th];

        var sx1 = source[0];
        var sy1 = source[1];
        var w   = source[2];
        var h   = source[3];
        var sx2 = source[0] + w;
        var sy2 = source[1] + h;

        // UV

        // top left
        this._uvs[offset]      = sx1 / tw;
        this._uvs[offset + 1]  = sy1 / th;

        // top right
        this._uvs[offset + 2]  = sx2 / tw;
        this._uvs[offset + 3]  = sy1 / th;

        // bottom left
        this._uvs[offset + 4]  = sx1 / tw;
        this._uvs[offset + 5]  = sy2 / th;

        // bottom right
        this._uvs[offset + 6]  = sx2 / tw;
        this._uvs[offset + 7]  = sy2 / th;

        // Vertices

        pos = pos || [0, 0];
        origin = origin || [0, 0];
        scale = scale || [1, 1];
        rotation = rotation || 0;

        var x = -origin[0];
        var y = -origin[1];

        // top left
        this._vertices[offset]      = x;
        this._vertices[offset + 1]  = y;

        // top right
        this._vertices[offset + 2]  = x + w;
        this._vertices[offset + 3]  = y;

        // bottom left
        this._vertices[offset + 4]  = x;
        this._vertices[offset + 5]  = y + h;

        // bottom right
        this._vertices[offset + 6]  = x + w;
        this._vertices[offset + 7]  = y + h;

        // Transform matrix

        var m = mat3.fromTranslation(tmpMat3, pos);
        mat3.rotate(m, m, rotation);
        mat3.scale(m, m, scale);

        var vertices = this._vertices;
        var a, b;

        a = vertices[offset];
        b = vertices[offset + 1];
        vertices[offset]     = m[0] * a + m[3] * b + m[6];
        vertices[offset + 1] = m[1] * a + m[4] * b + m[7];

        a = vertices[offset + 2];
        b = vertices[offset + 3];
        vertices[offset + 2] = m[0] * a + m[3] * b + m[6];
        vertices[offset + 3] = m[1] * a + m[4] * b + m[7];

        a = vertices[offset + 4];
        b = vertices[offset + 5];
        vertices[offset + 4] = m[0] * a + m[3] * b + m[6];
        vertices[offset + 5] = m[1] * a + m[4] * b + m[7];

        a = vertices[offset + 6];
        b = vertices[offset + 7];
        vertices[offset + 6] = m[0] * a + m[3] * b + m[6];
        vertices[offset + 7] = m[1] * a + m[4] * b + m[7];

        //// TODO: move it outside (optimise this)
        //vec2.forEach(this._vertices, 2, offset, 4, function(vec) {
        //    vec2.transformMat3(vec, vec, transform);
        //});

        this._count++;
    },

    /**
     * Adds a string to a batch of sprites to be rendered.
     * @param spriteFont
     * @param text
     * @param pos
     * @param origin
     * @param rotation
     * @param scale
     * @param color
     */
    drawString: function(spriteFont, text, pos, origin, rotation, scale, color) {

        if(this._texture && this._texture !== spriteFont.texture) {
            this.flush();
        }

        if(this._count + 1 > this._size) {
            this.flush();
            this.expand(this._size * 2);
        }

        this._texture = spriteFont.texture;

        var tw = this._texture.width;
        var th = this._texture.height;

        pos = pos || [0, 0];
        origin = origin || [0, 0];
        scale = scale || [1, 1];
        rotation = rotation || 0;

        // r, g, b, a
        color = color || [1, 1, 1, 1];

        var x = -origin[0];
        var y = -origin[1];

        var line = 0;
        var prevCharCode = null;

        var lineHeight = spriteFont.lineHeight;

        var startIdx = this._count;
        var startOffset = startIdx * 2 * 4;

        for(var i = 0; i < text.length; i++)
        {
            var charCode = text.charCodeAt(i);

            var charData = spriteFont.glyphs[charCode];
            if(!charData) continue;

            var idx = this._count;
            var offset = idx * 2 * 4;

            if(prevCharCode && charData.kerning[prevCharCode])
            {
                x += charData.kerning[prevCharCode];
            }

            for(var j = 0; j < 4 ; j++) {
                this._colors[idx * 16 + (j * 4)]       = color[0];
                this._colors[idx * 16 + (j * 4) + 1]   = color[1];
                this._colors[idx * 16 + (j * 4) + 2]   = color[2];
                this._colors[idx * 16 + (j * 4) + 3]   = color[3];
            }

            // Add vertices data here
            var source = charData.source;
            var sx1 = source[0];
            var sy1 = source[1];
            var w   = source[2];
            var h   = source[3];
            var sx2 = source[0] + w;
            var sy2 = source[1] + h;

            // UV

            // top left
            this._uvs[offset]      = sx1 / tw;
            this._uvs[offset + 1]  = sy1 / th;

            // top right
            this._uvs[offset + 2]  = sx2 / tw;
            this._uvs[offset + 3]  = sy1 / th;

            // bottom left
            this._uvs[offset + 4]  = sx1 / tw;
            this._uvs[offset + 5]  = sy2 / th;

            // bottom right
            this._uvs[offset + 6]  = sx2 / tw;
            this._uvs[offset + 7]  = sy2 / th;

            // Vertices

            var charOffset = charData.offset;
            var tx = x + charOffset[0];
            var ty = y + charOffset[1];

            // top left
            this._vertices[offset]      = tx;
            this._vertices[offset + 1]  = ty;

            // top right
            this._vertices[offset + 2]  = tx + w;
            this._vertices[offset + 3]  = ty;

            // bottom left
            this._vertices[offset + 4]  = tx;
            this._vertices[offset + 5]  = ty + h;

            // bottom right
            this._vertices[offset + 6]  = tx + w;
            this._vertices[offset + 7]  = ty + h;

            x += charData.xAdvance;
            prevCharCode = charCode;

            this._count++;
        }

        // Transform
        
        var transform = mat3.fromTranslation(tmpMat3, pos);
        mat3.scale(transform, transform, scale)
        mat3.rotate(transform, transform, rotation);

        // TODO: move it outside (optimise this)
        vec2.forEach(this._vertices, 2, startOffset, 4 * text.length, function(vec) {
            vec2.transformMat3(vec, vec, transform);
        });
    }
};

module.exports = SpriteBatch;
},{"../matrix/mat3":31,"../matrix/mat4":32,"../matrix/vec2":34,"./blend-state":10,"./effect":14,"./index-buffer":16,"./vertex-buffer":22}],20:[function(require,module,exports){
var SpriteFont = function(graphicsDevice) {

    this.graphicsDevice = graphicsDevice;
    this.texture        = null;

    this.name           = '';
    this.glyphs         = null;
    this.size           = 0;
    this.lineHeight     = 0;

    Object.defineProperty(this, 'isReady', {
        get: function () {
            return this.texture && this.texture.isReady && this.glyphs;
        }
    });
};

SpriteFont.prototype = {

    constructor: SpriteFont,

    /**
     * Returns the width and height of a string.
     * @param text
     */
    measureString: function(text) {

        var result = [0, 0];

        return result;
    }

};

module.exports = SpriteFont;
},{}],21:[function(require,module,exports){
var Class = require('../class');

Texture2D = Class.extend({

    constructor: function(graphicsDevice, width, height) {

        this.graphicsDevice = graphicsDevice;
        this.texture = graphicsDevice.createTexture();
        this.width = width;
        this.height = height;
        this.data = null; // image, canvas, array

        Object.defineProperty(this, 'isReady', {
            get: function () {
                return this.data != void 0;
            }
        });
    },

    setData: function(data) {

        var gl = this.graphicsDevice.gl;

        this.data = data;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        if(data) {  // normal data
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {    // framebuffer
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }

        if(this.data instanceof Image) {

            this.width = this.data.width;
            this.height = this.data.height;

            // Scale up the texture to the next highest power of two dimensions.
            if (!isPowerOfTwo(this.width) || !isPowerOfTwo(this.height)) {

                var canvas      = document.createElement('canvas');
                canvas.width    = nextHighestPowerOfTwo(this.width);
                canvas.height   = nextHighestPowerOfTwo(this.height);

                var ctx = canvas.getContext('2d');
                ctx.drawImage(this.data, 0, 0, this.width, this.height);

                this.data = canvas;
                this.width = this.data.width;
                this.height = this.data.height;
            }

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.data);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        }

        if (!isPowerOfTwo(this.width) || !isPowerOfTwo(this.height)) {

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);      //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);   //Prevents s-coordinate wrapping (repeating).
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);   //Prevents t-coordinate wrapping (repeating).

        } else {

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.generateMipmap(gl.TEXTURE_2D);

        }

        gl.bindTexture(gl.TEXTURE_2D, null);
    },

    bind: function(channel) {

        var gl = this.graphicsDevice.gl;

        gl.activeTexture(gl.TEXTURE0 + (channel || 0));
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }
});

function isPowerOfTwo(x) {
    return (x & (x - 1)) == 0;
}

function nextHighestPowerOfTwo(x) {
    --x;
    for (var i = 1; i < 32; i <<= 1) {
        x = x | x >> i;
    }
    return x + 1;
}

module.exports = Texture2D;
},{"../class":1}],22:[function(require,module,exports){
var BufferUsage = require('./buffer-usage');

var VertexBuffer = function(graphicsDevice, chunkSize, usage) {

    var gl = graphicsDevice.gl;

    this.graphicsDevice = graphicsDevice;
    this.buffer         = gl.createBuffer();
    this.chunkSize      = chunkSize;
    this.usage          = usage == BufferUsage.WRITE_ONLY ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
    this.stride         = 0;
    this.startIndex     = 0;
    this.data           = null;

    Object.defineProperty(this, 'vertexCount', {

        get: function() {
            return this.data ? this.data.length / this.chunkSize : 0;
        }

    });

};

VertexBuffer.prototype = {

    constructor: VertexBuffer,

    setData: function(data) {

        var gl = this.graphicsDevice.gl;

        this.data = data;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, this.usage);

    },

    getData: function() {

        return this.data;
    }
};

module.exports = VertexBuffer;
},{"./buffer-usage":12}],23:[function(require,module,exports){
var HANDJS = HANDJS || {};

(function () {
    // If the user agent already supports Pointer Events, do nothing
    if (window.PointerEvent)
        return;

    // Polyfilling indexOf for old browsers
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement) {
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }
    //Polyfilling forEach for old browsers
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (method, thisArg) {
            if (!this || !(method instanceof Function))
                throw new TypeError();
            for (var i = 0; i < this.length; i++)
                method.call(thisArg, this[i], i, this);
        }
    }
    // Polyfilling trim for old browsers
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/, '');
        };
    }

    // Installing Hand.js
    var supportedEventsNames = ["pointerdown", "pointerup", "pointermove", "pointerover", "pointerout", "pointercancel", "pointerenter", "pointerleave"];
    var upperCaseEventsNames = ["PointerDown", "PointerUp", "PointerMove", "PointerOver", "PointerOut", "PointerCancel", "PointerEnter", "PointerLeave"];

    var POINTER_TYPE_TOUCH = "touch";
    var POINTER_TYPE_PEN = "pen";
    var POINTER_TYPE_MOUSE = "mouse";

    var previousTargets = {};

    var checkPreventDefault = function (node) {
        while (node && !node.handjs_forcePreventDefault) {
            node = node.parentNode;
        }
        return !!node || window.handjs_forcePreventDefault;
    };

    // Touch events
    var generateTouchClonedEvent = function (sourceEvent, newName, canBubble, target, relatedTarget) {
        // Considering touch events are almost like super mouse events
        var evObj;

        if (document.createEvent) {
            evObj = document.createEvent('MouseEvents');
            evObj.initMouseEvent(newName, canBubble, true, window, 1, sourceEvent.screenX, sourceEvent.screenY,
                sourceEvent.clientX, sourceEvent.clientY, sourceEvent.ctrlKey, sourceEvent.altKey,
                sourceEvent.shiftKey, sourceEvent.metaKey, sourceEvent.button, relatedTarget || sourceEvent.relatedTarget);
        }
        else {
            evObj = document.createEventObject();
            evObj.screenX = sourceEvent.screenX;
            evObj.screenY = sourceEvent.screenY;
            evObj.clientX = sourceEvent.clientX;
            evObj.clientY = sourceEvent.clientY;
            evObj.ctrlKey = sourceEvent.ctrlKey;
            evObj.altKey = sourceEvent.altKey;
            evObj.shiftKey = sourceEvent.shiftKey;
            evObj.metaKey = sourceEvent.metaKey;
            evObj.button = sourceEvent.button;
            evObj.relatedTarget = relatedTarget || sourceEvent.relatedTarget;
        }
        // offsets
        if (evObj.offsetX === undefined) {
            if (sourceEvent.offsetX !== undefined) {

                // For Opera which creates readonly properties
                if (Object && Object.defineProperty !== undefined) {
                    Object.defineProperty(evObj, "offsetX", {
                        writable: true
                    });
                    Object.defineProperty(evObj, "offsetY", {
                        writable: true
                    });
                }

                evObj.offsetX = sourceEvent.offsetX;
                evObj.offsetY = sourceEvent.offsetY;
            } else if (Object && Object.defineProperty !== undefined) {
                Object.defineProperty(evObj, "offsetX", {
                    get: function () {
                        if (this.currentTarget && this.currentTarget.offsetLeft) {
                            return sourceEvent.clientX - this.currentTarget.offsetLeft;
                        }
                        return sourceEvent.clientX;
                    }
                });
                Object.defineProperty(evObj, "offsetY", {
                    get: function () {
                        if (this.currentTarget && this.currentTarget.offsetTop) {
                            return sourceEvent.clientY - this.currentTarget.offsetTop;
                        }
                        return sourceEvent.clientY;
                    }
                });
            }
            else if (sourceEvent.layerX !== undefined) {
                evObj.offsetX = sourceEvent.layerX - sourceEvent.currentTarget.offsetLeft;
                evObj.offsetY = sourceEvent.layerY - sourceEvent.currentTarget.offsetTop;
            }
        }

        // adding missing properties

        if (sourceEvent.isPrimary !== undefined)
            evObj.isPrimary = sourceEvent.isPrimary;
        else
            evObj.isPrimary = true;

        if (sourceEvent.pressure)
            evObj.pressure = sourceEvent.pressure;
        else {
            var button = 0;

            if (sourceEvent.which !== undefined)
                button = sourceEvent.which;
            else if (sourceEvent.button !== undefined) {
                button = sourceEvent.button;
            }
            evObj.pressure = (button == 0) ? 0 : 0.5;
        }


        if (sourceEvent.rotation)
            evObj.rotation = sourceEvent.rotation;
        else
            evObj.rotation = 0;

        // Timestamp
        if (sourceEvent.hwTimestamp)
            evObj.hwTimestamp = sourceEvent.hwTimestamp;
        else
            evObj.hwTimestamp = 0;

        // Tilts
        if (sourceEvent.tiltX)
            evObj.tiltX = sourceEvent.tiltX;
        else
            evObj.tiltX = 0;

        if (sourceEvent.tiltY)
            evObj.tiltY = sourceEvent.tiltY;
        else
            evObj.tiltY = 0;

        // Width and Height
        if (sourceEvent.height)
            evObj.height = sourceEvent.height;
        else
            evObj.height = 0;

        if (sourceEvent.width)
            evObj.width = sourceEvent.width;
        else
            evObj.width = 0;

        // preventDefault
        evObj.preventDefault = function () {
            if (sourceEvent.preventDefault !== undefined)
                sourceEvent.preventDefault();
        };

        // stopPropagation
        if (evObj.stopPropagation !== undefined) {
            var current = evObj.stopPropagation;
            evObj.stopPropagation = function () {
                if (sourceEvent.stopPropagation !== undefined)
                    sourceEvent.stopPropagation();
                current.call(this);
            };
        }

        // Pointer values
        evObj.pointerId = sourceEvent.pointerId;
        evObj.pointerType = sourceEvent.pointerType;

        switch (evObj.pointerType) {// Old spec version check
            case 2:
                evObj.pointerType = POINTER_TYPE_TOUCH;
                break;
            case 3:
                evObj.pointerType = POINTER_TYPE_PEN;
                break;
            case 4:
                evObj.pointerType = POINTER_TYPE_MOUSE;
                break;
        }

        // Fire event
        if (target)
            target.dispatchEvent(evObj);
        else if (sourceEvent.target) {
            sourceEvent.target.dispatchEvent(evObj);
        } else {
            sourceEvent.srcElement.fireEvent("on" + getMouseEquivalentEventName(newName), evObj); // We must fallback to mouse event for very old browsers
        }
    };

    var generateMouseProxy = function (evt, eventName, canBubble, target, relatedTarget) {
        evt.pointerId = 1;
        evt.pointerType = POINTER_TYPE_MOUSE;
        generateTouchClonedEvent(evt, eventName, canBubble, target, relatedTarget);
    };

    var generateTouchEventProxy = function (name, touchPoint, target, eventObject, canBubble, relatedTarget) {
        var touchPointId = touchPoint.identifier + 2; // Just to not override mouse id

        touchPoint.pointerId = touchPointId;
        touchPoint.pointerType = POINTER_TYPE_TOUCH;
        touchPoint.currentTarget = target;

        if (eventObject.preventDefault !== undefined) {
            touchPoint.preventDefault = function () {
                eventObject.preventDefault();
            };
        }

        generateTouchClonedEvent(touchPoint, name, canBubble, target, relatedTarget);
    };

    var checkEventRegistration = function (node, eventName) {
        return node.__handjsGlobalRegisteredEvents && node.__handjsGlobalRegisteredEvents[eventName];
    }
    var findEventRegisteredNode = function (node, eventName) {
        while (node && !checkEventRegistration(node, eventName))
            node = node.parentNode;
        if (node)
            return node;
        else if (checkEventRegistration(window, eventName))
            return window;
    };

    var generateTouchEventProxyIfRegistered = function (eventName, touchPoint, target, eventObject, canBubble, relatedTarget) { // Check if user registered this event
        if (findEventRegisteredNode(target, eventName)) {
            generateTouchEventProxy(eventName, touchPoint, target, eventObject, canBubble, relatedTarget);
        }
    };

    //var handleOtherEvent = function (eventObject, name, useLocalTarget, checkRegistration) {
    //    if (eventObject.preventManipulation)
    //        eventObject.preventManipulation();

    //    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
    //        var touchPoint = eventObject.changedTouches[i];

    //        if (useLocalTarget) {
    //            previousTargets[touchPoint.identifier] = touchPoint.target;
    //        }

    //        if (checkRegistration) {
    //            generateTouchEventProxyIfRegistered(name, touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
    //        } else {
    //            generateTouchEventProxy(name, touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
    //        }
    //    }
    //};

    var getMouseEquivalentEventName = function (eventName) {
        return eventName.toLowerCase().replace("pointer", "mouse");
    };

    var getPrefixEventName = function (prefix, eventName) {
        var upperCaseIndex = supportedEventsNames.indexOf(eventName);
        var newEventName = prefix + upperCaseEventsNames[upperCaseIndex];

        return newEventName;
    };

    var registerOrUnregisterEvent = function (item, name, func, enable) {
        if (item.__handjsRegisteredEvents === undefined) {
            item.__handjsRegisteredEvents = [];
        }

        if (enable) {
            if (item.__handjsRegisteredEvents[name] !== undefined) {
                item.__handjsRegisteredEvents[name]++;
                return;
            }

            item.__handjsRegisteredEvents[name] = 1;
            item.addEventListener(name, func, false);
        } else {

            if (item.__handjsRegisteredEvents.indexOf(name) !== -1) {
                item.__handjsRegisteredEvents[name]--;

                if (item.__handjsRegisteredEvents[name] != 0) {
                    return;
                }
            }
            item.removeEventListener(name, func);
            item.__handjsRegisteredEvents[name] = 0;
        }
    };

    var setTouchAware = function (item, eventName, enable) {
        // Leaving tokens
        if (!item.__handjsGlobalRegisteredEvents) {
            item.__handjsGlobalRegisteredEvents = [];
        }
        if (enable) {
            if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handjsGlobalRegisteredEvents[eventName]++;
                return;
            }
            item.__handjsGlobalRegisteredEvents[eventName] = 1;
        } else {
            if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handjsGlobalRegisteredEvents[eventName]--;
                if (item.__handjsGlobalRegisteredEvents[eventName] < 0) {
                    item.__handjsGlobalRegisteredEvents[eventName] = 0;
                }
            }
        }

        var nameGenerator;
        var eventGenerator;
        if (window.MSPointerEvent) {
            nameGenerator = function (name) { return getPrefixEventName("MS", name); };
            eventGenerator = generateTouchClonedEvent;
        }
        else {
            nameGenerator = getMouseEquivalentEventName;
            eventGenerator = generateMouseProxy;
        }
        switch (eventName) {
            case "pointerenter":
            case "pointerleave":
                var targetEvent = nameGenerator(eventName);
                if (item['on' + targetEvent.toLowerCase()] !== undefined) {
                    registerOrUnregisterEvent(item, targetEvent, function (evt) { eventGenerator(evt, eventName); }, enable);
                }
                break;
        }
    };

    // Intercept addEventListener calls by changing the prototype
    var interceptAddEventListener = function (root) {
        var current = root.prototype ? root.prototype.addEventListener : root.addEventListener;

        var customAddEventListener = function (name, func, capture) {
            // Branch when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) != -1) {
                setTouchAware(this, name, true);
            }

            if (current === undefined) {
                this.attachEvent("on" + getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };

        if (root.prototype) {
            root.prototype.addEventListener = customAddEventListener;
        } else {
            root.addEventListener = customAddEventListener;
        }
    };

    // Intercept removeEventListener calls by changing the prototype
    var interceptRemoveEventListener = function (root) {
        var current = root.prototype ? root.prototype.removeEventListener : root.removeEventListener;

        var customRemoveEventListener = function (name, func, capture) {
            // Release when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) != -1) {
                setTouchAware(this, name, false);
            }

            if (current === undefined) {
                this.detachEvent(getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };
        if (root.prototype) {
            root.prototype.removeEventListener = customRemoveEventListener;
        } else {
            root.removeEventListener = customRemoveEventListener;
        }
    };

    // Hooks
    interceptAddEventListener(window);
    interceptAddEventListener(window.HTMLElement || window.Element);
    interceptAddEventListener(document);
    interceptAddEventListener(HTMLBodyElement);
    interceptAddEventListener(HTMLDivElement);
    interceptAddEventListener(HTMLImageElement);
    interceptAddEventListener(HTMLUListElement);
    interceptAddEventListener(HTMLAnchorElement);
    interceptAddEventListener(HTMLLIElement);
    interceptAddEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptAddEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptAddEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptAddEventListener(SVGElement);
    }

    interceptRemoveEventListener(window);
    interceptRemoveEventListener(window.HTMLElement || window.Element);
    interceptRemoveEventListener(document);
    interceptRemoveEventListener(HTMLBodyElement);
    interceptRemoveEventListener(HTMLDivElement);
    interceptRemoveEventListener(HTMLImageElement);
    interceptRemoveEventListener(HTMLUListElement);
    interceptRemoveEventListener(HTMLAnchorElement);
    interceptRemoveEventListener(HTMLLIElement);
    interceptRemoveEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptRemoveEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptRemoveEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptRemoveEventListener(SVGElement);
    }

    // Prevent mouse event from being dispatched after Touch Events action
    var touching = false;
    var touchTimer = -1;

    function setTouchTimer() {
        touching = true;
        clearTimeout(touchTimer);
        touchTimer = setTimeout(function () {
            touching = false;
        }, 700);
        // 1. Mobile browsers dispatch mouse events 300ms after touchend
        // 2. Chrome for Android dispatch mousedown for long-touch about 650ms
        // Result: Blocking Mouse Events for 700ms.
    }

    function getDomUpperHierarchy(node) {
        var nodes = [];
        if (node) {
            nodes.unshift(node);
            while (node.parentNode) {
                nodes.unshift(node.parentNode);
                node = node.parentNode;
            }
        }
        return nodes;
    }

    function getFirstCommonNode(node1, node2) {
        var parents1 = getDomUpperHierarchy(node1);
        var parents2 = getDomUpperHierarchy(node2);

        var lastmatch = null
        while (parents1.length > 0 && parents1[0] == parents2.shift())
            lastmatch = parents1.shift();
        return lastmatch;
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerEnter(currentTarget, relatedTarget, generateProxy) {
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget);
        var node = currentTarget;
        var nodelist = [];
        while (node && node != commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "pointerenter")) //check if any parent node has pointerenter
                nodelist.push(node);
            node = node.parentNode;
        }
        while (nodelist.length > 0)
            generateProxy(nodelist.pop());
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerLeave(currentTarget, relatedTarget, generateProxy) {
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget);
        var node = currentTarget;
        while (node && node != commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "pointerleave"))//check if any parent node has pointerleave
                generateProxy(node);
            node = node.parentNode;
        }
    }

    // Handling events on window to prevent unwanted super-bubbling
    // All mouse events are affected by touch fallback
    function applySimpleEventTunnels(nameGenerator, eventGenerator) {
        ["pointerdown", "pointermove", "pointerup", "pointerover", "pointerout"].forEach(function (eventName) {
            window.addEventListener(nameGenerator(eventName), function (evt) {
                if (!touching && findEventRegisteredNode(evt.target, eventName))
                    eventGenerator(evt, eventName, true);
            });
        });
        if (window['on' + nameGenerator("pointerenter").toLowerCase()] === undefined)
            window.addEventListener(nameGenerator("pointerover"), function (evt) {
                if (touching)
                    return;
                var foundNode = findEventRegisteredNode(evt.target, "pointerenter");
                if (!foundNode || foundNode === window)
                    return;
                else if (!foundNode.contains(evt.relatedTarget)) {
                    dispatchPointerEnter(foundNode, evt.relatedTarget, function (targetNode) {
                        eventGenerator(evt, "pointerenter", false, targetNode, evt.relatedTarget);
                    });
                }
            });
        if (window['on' + nameGenerator("pointerleave").toLowerCase()] === undefined)
            window.addEventListener(nameGenerator("pointerout"), function (evt) {
                if (touching)
                    return;
                var foundNode = findEventRegisteredNode(evt.target, "pointerleave");
                if (!foundNode || foundNode === window)
                    return;
                else if (!foundNode.contains(evt.relatedTarget)) {
                    dispatchPointerLeave(foundNode, evt.relatedTarget, function (targetNode) {
                        eventGenerator(evt, "pointerleave", false, targetNode, evt.relatedTarget);
                    });
                }
            });
    }

    (function () {
        if (window.MSPointerEvent) {
            //IE 10
            applySimpleEventTunnels(
                function (name) { return getPrefixEventName("MS", name); },
                generateTouchClonedEvent);
        }
        else {
            applySimpleEventTunnels(getMouseEquivalentEventName, generateMouseProxy);

            // Handling move on window to detect pointerleave/out/over
            if (window.ontouchstart !== undefined) {
                window.addEventListener('touchstart', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        previousTargets[touchPoint.identifier] = touchPoint.target;

                        generateTouchEventProxyIfRegistered("pointerover", touchPoint, touchPoint.target, eventObject, true);

                        //pointerenter should not be bubbled
                        dispatchPointerEnter(touchPoint.target, null, function (targetNode) {
                            generateTouchEventProxy("pointerenter", touchPoint, targetNode, eventObject, false);
                        })

                        generateTouchEventProxyIfRegistered("pointerdown", touchPoint, touchPoint.target, eventObject, true);
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchend', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        var currentTarget = previousTargets[touchPoint.identifier];

                        generateTouchEventProxyIfRegistered("pointerup", touchPoint, currentTarget, eventObject, true);
                        generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject, true);

                        //pointerleave should not be bubbled
                        dispatchPointerLeave(currentTarget, null, function (targetNode) {
                            generateTouchEventProxy("pointerleave", touchPoint, targetNode, eventObject, false);
                        })
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchmove', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        var newTarget = document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
                        var currentTarget = previousTargets[touchPoint.identifier];

                        // If force preventDefault
                        if (currentTarget && checkPreventDefault(currentTarget) === true)
                            eventObject.preventDefault();

                        generateTouchEventProxyIfRegistered("pointermove", touchPoint, currentTarget, eventObject, true);

                        if (currentTarget === newTarget) {
                            continue; // We can skip this as the pointer is effectively over the current target
                        }

                        if (currentTarget) {
                            // Raise out
                            generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject, true, newTarget);

                            // Raise leave
                            if (!currentTarget.contains(newTarget)) { // Leave must be called if the new target is not a child of the current
                                dispatchPointerLeave(currentTarget, newTarget, function (targetNode) {
                                    generateTouchEventProxy("pointerleave", touchPoint, targetNode, eventObject, false, newTarget);
                                });
                            }
                        }

                        if (newTarget) {
                            // Raise over
                            generateTouchEventProxyIfRegistered("pointerover", touchPoint, newTarget, eventObject, true, currentTarget);

                            // Raise enter
                            if (!newTarget.contains(currentTarget)) { // Leave must be called if the new target is not the parent of the current
                                dispatchPointerEnter(newTarget, currentTarget, function (targetNode) {
                                    generateTouchEventProxy("pointerenter", touchPoint, targetNode, eventObject, false, currentTarget);
                                })
                            }
                        }
                        previousTargets[touchPoint.identifier] = newTarget;
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchcancel', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];

                        generateTouchEventProxyIfRegistered("pointercancel", touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
                    }
                });
            }
        }
    })();


    // Extension to navigator
    if (navigator.pointerEnabled === undefined) {

        // Indicates if the browser will fire pointer events for pointing input
        navigator.pointerEnabled = true;

        // IE
        if (navigator.msPointerEnabled) {
            navigator.maxTouchPoints = navigator.msMaxTouchPoints;
        }
    }

    // Handling touch-action css rule
    if (document.styleSheets && document.addEventListener) {
        document.addEventListener("DOMContentLoaded", function () {
            if (HANDJS.doNotProcessCSS || document.body.style.touchAction !== undefined) {//Chrome is trying to implement touch-action before Pointer Events listeners
                return;
            }

            var globalRegex = new RegExp(".+?{.*?}", "m");
            var selectorRegex = new RegExp(".+?{", "m");
            var filterStylesheet = function (unfilteredSheet) {
                var filter = globalRegex.exec(unfilteredSheet);
                if (!filter) {
                    return;
                }
                var block = filter[0];
                unfilteredSheet = unfilteredSheet.replace(block, "").trim();
                var selectorText = selectorRegex.exec(block)[0].replace("{", "").trim();

                // Checking if the user wanted to deactivate the default behavior
                if (block.replace(/\s/g, "").indexOf("touch-action:none") != -1) {
                    var elements = document.querySelectorAll(selectorText);

                    for (var elementIndex = 0; elementIndex < elements.length; elementIndex++) {
                        var element = elements[elementIndex];

                        if (element.style.msTouchAction !== undefined) {
                            element.style.msTouchAction = "none";
                        }
                        else {
                            element.handjs_forcePreventDefault = true;
                        }
                    }
                }
                return unfilteredSheet;
            }
            var processStylesheet = function (unfilteredSheet) {
                if (window.setImmediate) {//not blocking UI interaction for a long time
                    if (unfilteredSheet)
                        setImmediate(processStylesheet, filterStylesheet(unfilteredSheet));
                }
                else {
                    while (unfilteredSheet) {
                        unfilteredSheet = filterStylesheet(unfilteredSheet);
                    }
                }
            }; // Looking for touch-action in referenced stylesheets
            try {
                for (var index = 0; index < document.styleSheets.length; index++) {
                    var sheet = document.styleSheets[index];

                    if (sheet.href == undefined) { // it is an inline style
                        continue;
                    }

                    // Loading the original stylesheet
                    var xhr = new XMLHttpRequest();
                    xhr.open("get", sheet.href);
                    xhr.send();

                    var unfilteredSheet = xhr.responseText.replace(/(\n|\r)/g, "");

                    processStylesheet(unfilteredSheet);
                }
            } catch (e) {
                // Silently fail...
            }

            // Looking for touch-action in inline styles
            var styles = document.getElementsByTagName("style");
            for (var index = 0; index < styles.length; index++) {
                var inlineSheet = styles[index];

                var inlineUnfilteredSheet = inlineSheet.innerHTML.replace(/(\n|\r)/g, "").trim();

                processStylesheet(inlineUnfilteredSheet);
            }
        }, false);
    }

})();
},{}],24:[function(require,module,exports){
var State = function() {
        
    this.isConnected = false;
    
    this.buttons = {
        a:          false,
        b:          false,
        x:          false,
        y:          false,
        lt:         false,
        lb:         false,
        rt:         false,
        rb:         false,
        start:      false,
        options:    false
    };
    
    this.dpad = {
        left:       false,
        rigth:      false,
        up:         false,
        down:       false
    };
    
    this.thumbstick = {
        left: {
            x: 0.0,
            y: 0.0
        },
        right: {
            x: 0.0,
            y: 0.0
        }
    };
};

var Gamepad = function() {

    this._initialized = false;
    
    this._onGamepadConnect      = null;
    this._onGamepadDisconnect   = null;
    this._onGamepadPoll         = null;
    this._gamepadPollInterval   = -1;
};

Gamepad.prototype = {
    
    constructor: Gamepad,
    
    initialize: function() {
        
        if(this._initialized || !this.isSupported()) {
            return;
        }
        
        this._initialized = true;
    },
    
    dispose: function() {
        
        if(!this._initialized) {
            return;
        }
        
        this._initialized = false;
    },
    
    processGamepadConnect: function(event) {
        
    },
    
    processGamepadDisconnect: function(event) {
        
    },
    
    processGamepadPoll: function(event) {
        
    },
    
    isSupported: function() {
        return "getGamepads" in navigator;
    }

};

module.exports = new Gamepad();
},{}],25:[function(require,module,exports){
var MAX_KEYS = 256;

var KeyboardState = function () {
    this._keys = new Uint8Array(MAX_KEYS);
};

KeyboardState.prototype = {
    
    constructor: KeyboardState,
    
    isKeyUp: function (key) {
        
        return this._keys[key] == false;
    },
    
    isKeyDown: function (key) {
        
        return this._keys[key] == true;
    }

};

var Keyboard = function () {
    
    this._initialized = false;
    
    this._keys = new Uint8Array(MAX_KEYS);
    this._registered = new Uint8Array(MAX_KEYS);
    
    this._onKeyDown = null;
    this._onKeyUp = null;
};

Keyboard.prototype = {
    
    constructor: Keyboard,
    
    initialize: function () {
        
        if (this._initialized) {
            return;
        }

        var _this = this;
        
        this._onKeyDown = function (event) {
            _this.processKeyDown(event);
        };
        
        this._onKeyUp = function (event) {
            _this.processKeyUp(event);
        };
        
        window.addEventListener('keydown', this._onKeyDown, false);
        window.addEventListener('keyup', this._onKeyUp, false);
        
        this._initialized = true;
    },
    
    dispose: function () {
        
        if (!this._initialized) {
            return;
        }
        
        window.removeEventListener('keydown', this._onKeyDown, false);
        window.removeEventListener('keyup', this._onKeyUp, false);
        
        this._onKeyDown = null;
        this._onKeyUp = null;
        
        this._initialized = false;
        
    },
    
    processKeyDown: function (event) {
        
        if (!this._registered[event.keyCode]) {
            return;
        }
        
        this._keys[event.keyCode] = true;
        event.preventDefault();
    },
    
    processKeyUp: function (event) {
        
        if (!this._registered[event.keyCode]) {
            return;
        }
        
        event.preventDefault();
        this._keys[event.keyCode] = false;
    },
    
    addKey: function (key) {
        
        this._registered[key] = true;
    },
    
    removeKey: function (key) {
        
        this._registered[key] = false;
    },
    
    getState: function () {
        
        var state = new KeyboardState();
        state._keys.set(this._keys); 
        return state;
    }
};

module.exports = new Keyboard();

},{}],26:[function(require,module,exports){
var Keys = {};

Keys.A = 65;
Keys.B = 66;
Keys.C = 67;
Keys.D = 68;
Keys.E = 69;
Keys.F = 70;
Keys.G = 71;
Keys.H = 72;
Keys.I = 73;
Keys.J = 74;
Keys.K = 75;
Keys.L = 76;
Keys.M = 77;
Keys.N = 78;
Keys.O = 79;
Keys.P = 80;
Keys.Q = 81;
Keys.R = 82;
Keys.S = 83;
Keys.T = 84;
Keys.U = 85;
Keys.V = 86;
Keys.W = 87;
Keys.X = 88;
Keys.Y = 89;
Keys.Z = 90;
Keys.ZERO = 48;
Keys.ONE = 49;
Keys.TWO = 50;
Keys.THREE = 51;
Keys.FOUR = 52;
Keys.FIVE = 53;
Keys.SIX = 54;
Keys.SEVEN =55;
Keys.EIGHT = 56;
Keys.NINE = 57;
Keys.NUMPAD_0 = 96;
Keys.NUMPAD_1 = 97;
Keys.NUMPAD_2 = 98;
Keys.NUMPAD_3 = 99;
Keys.NUMPAD_4 = 100;
Keys.NUMPAD_5 = 101;
Keys.NUMPAD_6 = 102;
Keys.NUMPAD_7 = 103;
Keys.NUMPAD_8 = 104;
Keys.NUMPAD_9 = 105;
Keys.NUMPAD_MULTIPLY = 106;
Keys.NUMPAD_ADD = 107;
Keys.NUMPAD_ENTER = 108;
Keys.NUMPAD_SUBTRACT = 109;
Keys.NUMPAD_DECIMAL = 110;
Keys.NUMPAD_DIVIDE = 111;
Keys.F1 = 112;
Keys.F2 = 113;
Keys.F3 = 114;
Keys.F4 = 115;
Keys.F5 = 116;
Keys.F6 = 117;
Keys.F7 = 118;
Keys.F8 = 119;
Keys.F9 = 120;
Keys.F10 = 121;
Keys.F11 = 122;
Keys.F12 = 123;
Keys.F13 = 124;
Keys.F14 = 125;
Keys.F15 = 126;
Keys.COLON = 186;
Keys.EQUALS = 187;
Keys.UNDERSCORE = 189;
Keys.QUESTION_MARK = 191;
Keys.TILDE = 192;
Keys.OPEN_BRACKET = 219;
Keys.BACKWARD_SLASH = 220;
Keys.CLOSEL_BRACKET = 221;
Keys.QUOTES = 222;
Keys.BACKSPACE = 8;
Keys.TAB = 9;
Keys.CLEAR = 12;
Keys.ENTER = 13;
Keys.SHIFT = 16;
Keys.CONTROL = 17;
Keys.ALT = 18;
Keys.CAPS_LOCK = 20;
Keys.ESC = 27;
Keys.SPACE = 32;
Keys.PAGE_UP = 33;
Keys.PAGE_DOWN = 34;
Keys.END = 35;
Keys.HOME = 36;
Keys.LEFT = 37;
Keys.UP = 38;
Keys.RIGHT = 39;
Keys.DOWN = 40;
Keys.INSERT = 45;
Keys.DELETE = 46;
Keys.HELP = 47;
Keys.NUM_LOCK = 144;

module.exports = Keys;
},{}],27:[function(require,module,exports){
// shim pointer lib
require('../hand');

var MAX_POINTERS = 10;

var PointerState = function(id, x, y, state, type) {
    
    this.id     = id;
    this.x      = x;
    this.y      = y;
    this.state  = state;
    this.type   = type;
};

var Pointer = function() {

    this._initialized = false;
    this.window = null;

    this.items              = new Array(MAX_POINTERS);
    this.itemsCount         = 0;
    this.maxActivePointers  = 1;
    
    for (var i = 0; i < this.items.length; i++) {
        this.items[i] = new PointerState(0, 0, 0, Pointer.STATE_UP, Pointer.TYPE_TOUCH);
    }

    this._onPointerUp   = null;
    this._onPointerDown = null;
    this._onPointerMove = null;

    // consts

    this.TYPE_TOUCH = 'touch';
    this.TYPE_MOUSE = 'mouse';
    this.TYPE_PEN   = 'pen';
    this.STATE_UP   = 0;
    this.STATE_DOWN = 1;
};

Pointer.prototype = {

    constructor: Pointer,

    initialize: function(gameWindow) {
        
        if(this._initialized) {
            return;
        }
        
        this.window = gameWindow;
        
        var _this = this;
        
        this._onPointerUp = function(event) {
            _this.processPointerUp(event);
        };
        
        this._onPointerDown = function(event) {
            _this.processPointerDown(event);
        };
                
        this._onPointerMove = function(event) {
            _this.processPointerMove(event);
        };

        this.window.canvas.addEventListener('pointerdown', this._onPointerDown, false);
        this.window.canvas.addEventListener('pointermove', this._onPointerMove, false);
        this.window.canvas.addEventListener('pointerup', this._onPointerUp, false);
        this.window.canvas.addEventListener('pointerout', this._onPointerUp, false);


        this._initialized = false;
    },
    
    destroy: function() {
                
        if(!this._initialized) {
            return;
        }
        
        this.window.canvas.removeEventListener('pointerdown', this._onPointerDown, false);
        this.window.canvas.removeEventListener('pointermove', this._onPointerMove, false);
        this.window.canvas.removeEventListener('pointerup', this._onPointerUp, false);
        this.window.canvas.removeEventListener('pointerout', this._onPointerUp, false);

        this._onPointerUp = null;
        this._onPointerDown = null;
        this._onPointerMove = null;
        
        this._initialized = false;
    },
    
    processPointerUp: function(event) {
        
        var item = this.findItemById(event.pointerId);

        if(!item) {
            return;
        }

        item.state = this.STATE_UP;

        // remove only if touch (there is no move event with touch after pointer up)
        if(item.type === this.TYPE_TOUCH) {

            var index = this.items.indexOf(item);
            if(this.itemsCount - 1 !== index) {

                this.items[index] = this.items[this.itemsCount - 1];
                this.items[this.itemsCount - 1] = item;
            }

            this.itemsCount--;
        }
    },
    
    processPointerDown: function(event) {
        
        var item = this.findItemById(event.pointerId);

        if(!item) {
            
            if(this.itemsCount === this.maxActivePointers) {
                return;
            }
            
            this.itemsCount++;
            item = this.items[this.itemsCount - 1];
        }

        var window = this.window;

        item.id     = event.pointerId;
        item.x      = (event.clientX - window.clientBounds.x) / window.scale.x;
        item.y      = (event.clientY - window.clientBounds.y) / window.scale.y;
        item.state  = this.STATE_DOWN;
        item.type   = event.pointerType;
    },
    
    processPointerMove: function(event) {
        
        var item = this.findItemById(event.pointerId);
        
        if(!item) {
            
            if(this.itemsCount === this.maxActivePointers) {
                return;
            }
            
            this.itemsCount++;
            item = this.items[this.itemsCount - 1];
        }
        
        var window = this.window;
        
        item.id     = event.pointerId;
        item.x      = (event.clientX - window.clientBounds.x) / window.scale.x;
        item.y      = (event.clientY - window.clientBounds.y) / window.scale.y;
        item.type   = event.pointerType;
    },
    
    findItemById: function(id) {

        for(var i = 0; i < this.itemsCount; i++) {

            if(this.items[i].id === id) {
                return this.items[i];
            }
        }
    }
};

module.exports = new Pointer();

},{"../hand":23}],28:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

if(!GLMAT_RANDOM) {
    var GLMAT_RANDOM = Math.random;
}

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

/**
 * Sets the type of array used when creating new vectors and matrices
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}

if(typeof(exports) !== 'undefined') {
    exports.glMatrix = glMatrix;
    exports.GLMAT_ARRAY_TYPE = GLMAT_ARRAY_TYPE;
}

var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}

},{}],29:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE = require('./common').GLMAT_ARRAY_TYPE;

/**
 * @class 2x2 Matrix
 * @name mat2
 */
var mat2 = {};

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    return out;
};

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.rotate(dest, dest, rad);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.fromRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2.identity(dest);
 *     mat2.scale(dest, dest, vec);
 *
 * @param {mat2} out mat2 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2} out
 */
mat2.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    return out;
}

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

/**
 * Returns Frobenius norm of a mat2
 *
 * @param {mat2} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2)))
};

/**
 * Returns L, D and U matrices (Lower triangular, Diagonal and Upper triangular) by factorizing the input matrix
 * @param {mat2} L the lower triangular matrix 
 * @param {mat2} D the diagonal matrix 
 * @param {mat2} U the upper triangular matrix 
 * @param {mat2} a the input matrix to factorize
 */

mat2.LDU = function (L, D, U, a) { 
    L[2] = a[2]/a[0]; 
    U[0] = a[0]; 
    U[1] = a[1]; 
    U[3] = a[3] - L[2] * U[1]; 
    return [L, D, U];       
}; 

if(typeof(exports) !== 'undefined') {
    module.exports = mat2;
}
},{"./common":28}],30:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE = require('./common').GLMAT_ARRAY_TYPE;

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, c, tx,
 *  b, d, ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, c, tx,
 *  b, d, ty,
 *  0, 0, 1]
 * </pre>
 * The last row is ignored so the array is shorter and operations are faster.
 */
var mat2d = {};

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5];
    out[0] = a0 * b0 + a2 * b1;
    out[1] = a1 * b0 + a3 * b1;
    out[2] = a0 * b2 + a2 * b3;
    out[3] = a1 * b2 + a3 * b3;
    out[4] = a0 * b4 + a2 * b5 + a4;
    out[5] = a1 * b4 + a3 * b5 + a5;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;

/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a2 * s;
    out[1] = a1 *  c + a3 * s;
    out[2] = a0 * -s + a2 * c;
    out[3] = a1 * -s + a3 * c;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {vec2} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5],
        v0 = v[0], v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
};

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.rotate(dest, dest, rad);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.fromRotation = function(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);
    out[0] = c;
    out[1] = s;
    out[2] = -s;
    out[3] = c;
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.scale(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat2d} out
 */
mat2d.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = v[1];
    out[4] = 0;
    out[5] = 0;
    return out;
}

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat2d.identity(dest);
 *     mat2d.translate(dest, dest, vec);
 *
 * @param {mat2d} out mat2d receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat2d} out
 */
mat2d.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = v[0];
    out[5] = v[1];
    return out;
}

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

/**
 * Returns Frobenius norm of a mat2d
 *
 * @param {mat2d} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat2d.frob = function (a) { 
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + 1))
}; 

if(typeof(exports) !== 'undefined') {
    module.exports = mat2d;
}

},{"./common":28}],31:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE = require('./common').GLMAT_ARRAY_TYPE;

/**
 * @class 3x3 Matrix
 * @name mat3
 */
var mat3 = {};

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.translate(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Translation vector
 * @returns {mat3} out
 */
mat3.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = v[0];
    out[7] = v[1];
    out[8] = 1;
    return out;
}

/**
 * Creates a matrix from a given angle
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.rotate(dest, dest, rad);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.fromRotation = function(out, rad) {
    var s = Math.sin(rad), c = Math.cos(rad);

    out[0] = c;
    out[1] = s;
    out[2] = 0;

    out[3] = -s;
    out[4] = c;
    out[5] = 0;

    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat3.identity(dest);
 *     mat3.scale(dest, dest, vec);
 *
 * @param {mat3} out mat3 receiving operation result
 * @param {vec2} v Scaling vector
 * @returns {mat3} out
 */
mat3.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;

    out[3] = 0;
    out[4] = v[1];
    out[5] = 0;

    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
}

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat3.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
};


if(typeof(exports) !== 'undefined') {
    module.exports = mat3;
}

},{"./common":28}],32:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE = require('./common').GLMAT_ARRAY_TYPE;

/**
 * @class 4x4 Matrix
 * @name mat4
 */
var mat4 = {};

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Creates a matrix from a vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromTranslation = function(out, v) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a vector scaling
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.scale(dest, dest, vec);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {vec3} v Scaling vector
 * @returns {mat4} out
 */
mat4.fromScaling = function(out, v) {
    out[0] = v[0];
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = v[1];
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = v[2];
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a given angle around a given axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotate(dest, dest, rad, axis);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.fromRotation = function(out, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t;
    
    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;
    
    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;
    
    // Perform rotation-specific matrix multiplication
    out[0] = x * x * t + c;
    out[1] = y * x * t + z * s;
    out[2] = z * x * t - y * s;
    out[3] = 0;
    out[4] = x * y * t - z * s;
    out[5] = y * y * t + c;
    out[6] = z * y * t + x * s;
    out[7] = 0;
    out[8] = x * z * t + y * s;
    out[9] = y * z * t - x * s;
    out[10] = z * z * t + c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the X axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateX(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromXRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);
    
    // Perform axis-specific matrix multiplication
    out[0]  = 1;
    out[1]  = 0;
    out[2]  = 0;
    out[3]  = 0;
    out[4] = 0;
    out[5] = c;
    out[6] = s;
    out[7] = 0;
    out[8] = 0;
    out[9] = -s;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the Y axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateY(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromYRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);
    
    // Perform axis-specific matrix multiplication
    out[0]  = c;
    out[1]  = 0;
    out[2]  = -s;
    out[3]  = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = s;
    out[9] = 0;
    out[10] = c;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from the given angle around the Z axis
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.rotateZ(dest, dest, rad);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.fromZRotation = function(out, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad);
    
    // Perform axis-specific matrix multiplication
    out[0]  = c;
    out[1]  = s;
    out[2]  = 0;
    out[3]  = 0;
    out[4] = -s;
    out[5] = c;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;

    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;

    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given field of view.
 * This is primarily useful for generating projection matrices to be used
 * with the still experiemental WebVR API.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fov Object containing the following values: upDegrees, downDegrees, leftDegrees, rightDegrees
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspectiveFromFieldOfView = function (out, fov, near, far) {
    var upTan = Math.tan(fov.upDegrees * Math.PI/180.0),
        downTan = Math.tan(fov.downDegrees * Math.PI/180.0),
        leftTan = Math.tan(fov.leftDegrees * Math.PI/180.0),
        rightTan = Math.tan(fov.rightDegrees * Math.PI/180.0),
        xScale = 2.0 / (leftTan + rightTan),
        yScale = 2.0 / (upTan + downTan);

    out[0] = xScale;
    out[1] = 0.0;
    out[2] = 0.0;
    out[3] = 0.0;
    out[4] = 0.0;
    out[5] = yScale;
    out[6] = 0.0;
    out[7] = 0.0;
    out[8] = -((leftTan - rightTan) * xScale * 0.5);
    out[9] = ((upTan - downTan) * yScale * 0.5);
    out[10] = far / (near - far);
    out[11] = -1.0;
    out[12] = 0.0;
    out[13] = 0.0;
    out[14] = (far * near) / (near - far);
    out[15] = 0.0;
    return out;
}

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
        Math.abs(eyey - centery) < GLMAT_EPSILON &&
        Math.abs(eyez - centerz) < GLMAT_EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

/**
 * Returns Frobenius norm of a mat4
 *
 * @param {mat4} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat4.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2) + Math.pow(a[9], 2) + Math.pow(a[10], 2) + Math.pow(a[11], 2) + Math.pow(a[12], 2) + Math.pow(a[13], 2) + Math.pow(a[14], 2) + Math.pow(a[15], 2) ))
};


if(typeof(exports) !== 'undefined') {
    module.exports = mat4;
}

},{"./common":28}],33:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE  = require('./common').GLMAT_ARRAY_TYPE;
var vec3              = require('./vec3');
var vec4              = require('./vec4');
var mat3              = require('./mat3');

/**
 * @class Quaternion
 * @name quat
 */
var quat = {};

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {vec3} a the initial vector
 * @param {vec3} b the destination vector
 * @returns {quat} out
 */
quat.rotationTo = (function() {
    var tmpvec3 = vec3.create();
    var xUnitVec3 = vec3.fromValues(1,0,0);
    var yUnitVec3 = vec3.fromValues(0,1,0);

    return function(out, a, b) {
        var dot = vec3.dot(a, b);
        if (dot < -0.999999) {
            vec3.cross(tmpvec3, xUnitVec3, a);
            if (vec3.length(tmpvec3) < 0.000001)
                vec3.cross(tmpvec3, yUnitVec3, a);
            vec3.normalize(tmpvec3, tmpvec3);
            quat.setAxisAngle(out, tmpvec3, Math.PI);
            return out;
        } else if (dot > 0.999999) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        } else {
            vec3.cross(tmpvec3, a, b);
            out[0] = tmpvec3[0];
            out[1] = tmpvec3[1];
            out[2] = tmpvec3[2];
            out[3] = 1 + dot;
            return quat.normalize(out, out);
        }
    };
})();

/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {vec3} view  the vector representing the viewing direction
 * @param {vec3} right the vector representing the local "right" direction
 * @param {vec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */
quat.setAxes = (function() {
    var matr = mat3.create();

    return function(out, view, right, up) {
        matr[0] = right[0];
        matr[3] = right[1];
        matr[6] = right[2];

        matr[1] = up[0];
        matr[4] = up[1];
        matr[7] = up[2];

        matr[2] = -view[0];
        matr[5] = -view[1];
        matr[8] = -view[2];

        return quat.normalize(out, quat.fromMat3(out, matr));
    };
})();

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle about the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle about the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var        omega, cosom, sinom, scale0, scale1;

    // calc cosine
    cosom = ax * bx + ay * by + az * bz + aw * bw;
    // adjust signs (if necessary)
    if ( cosom < 0.0 ) {
        cosom = -cosom;
        bx = - bx;
        by = - by;
        bz = - bz;
        bw = - bw;
    }
    // calculate coefficients
    if ( (1.0 - cosom) > 0.000001 ) {
        // standard case (slerp)
        omega  = Math.acos(cosom);
        sinom  = Math.sin(omega);
        scale0 = Math.sin((1.0 - t) * omega) / sinom;
        scale1 = Math.sin(t * omega) / sinom;
    } else {        
        // "from" and "to" quaternions are very close 
        //  ... so we can do a linear interpolation
        scale0 = 1.0 - t;
        scale1 = t;
    }
    // calculate final values
    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    
    return out;
};

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = function(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if ( fTrace > 0.0 ) {
        // |w| > 1/2, may as well choose w > 1/2
        fRoot = Math.sqrt(fTrace + 1.0);  // 2w
        out[3] = 0.5 * fRoot;
        fRoot = 0.5/fRoot;  // 1/(4w)
        out[0] = (m[5]-m[7])*fRoot;
        out[1] = (m[6]-m[2])*fRoot;
        out[2] = (m[1]-m[3])*fRoot;
    } else {
        // |w| <= 1/2
        var i = 0;
        if ( m[4] > m[0] )
          i = 1;
        if ( m[8] > m[i*3+i] )
          i = 2;
        var j = (i+1)%3;
        var k = (i+2)%3;
        
        fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
        out[i] = 0.5 * fRoot;
        fRoot = 0.5 / fRoot;
        out[3] = (m[j*3+k] - m[k*3+j]) * fRoot;
        out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
        out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
    }
    
    return out;
};

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    module.exports = quat;
}

},{"./common":28,"./mat3":31,"./vec3":35,"./vec4":36}],34:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE = require('./common').GLMAT_ARRAY_TYPE;

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */
var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Returns the inverse of the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to invert
 * @returns {vec2} out
 */
vec2.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

if(typeof(exports) !== 'undefined') {
    module.exports = vec2;
}

},{"./common":28}],35:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE = require('./common').GLMAT_ARRAY_TYPE;

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */
var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Adds two vec3's after scaling the second operand by a scalar value
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec3} out
 */
vec3.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Returns the inverse of the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to invert
 * @returns {vec3} out
 */
vec3.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec3} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec3} out
 */
vec3.random = function (out, scale) {
    scale = scale || 1.0;

    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    var z = (GLMAT_RANDOM() * 2.0) - 1.0;
    var zScale = Math.sqrt(1.0-z*z) * scale;

    out[0] = Math.cos(r) * zScale;
    out[1] = Math.sin(r) * zScale;
    out[2] = z * scale;
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2],
        w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
};

/**
 * Transforms the vec3 with a mat3.
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m the 3x3 matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat3 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = x * m[0] + y * m[3] + z * m[6];
    out[1] = x * m[1] + y * m[4] + z * m[7];
    out[2] = x * m[2] + y * m[5] + z * m[8];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Rotate a 3D vector around the x-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateX = function(out, a, b, c){
   var p = [], r=[];
	  //Translate point to the origin
	  p[0] = a[0] - b[0];
	  p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];

	  //perform rotation
	  r[0] = p[0];
	  r[1] = p[1]*Math.cos(c) - p[2]*Math.sin(c);
	  r[2] = p[1]*Math.sin(c) + p[2]*Math.cos(c);

	  //translate to correct position
	  out[0] = r[0] + b[0];
	  out[1] = r[1] + b[1];
	  out[2] = r[2] + b[2];

  	return out;
};

/**
 * Rotate a 3D vector around the y-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateY = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[2]*Math.sin(c) + p[0]*Math.cos(c);
  	r[1] = p[1];
  	r[2] = p[2]*Math.cos(c) - p[0]*Math.sin(c);
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {vec3} b The origin of the rotation
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
vec3.rotateZ = function(out, a, b, c){
  	var p = [], r=[];
  	//Translate point to the origin
  	p[0] = a[0] - b[0];
  	p[1] = a[1] - b[1];
  	p[2] = a[2] - b[2];
  
  	//perform rotation
  	r[0] = p[0]*Math.cos(c) - p[1]*Math.sin(c);
  	r[1] = p[0]*Math.sin(c) + p[1]*Math.cos(c);
  	r[2] = p[2];
  
  	//translate to correct position
  	out[0] = r[0] + b[0];
  	out[1] = r[1] + b[1];
  	out[2] = r[2] + b[2];
  
  	return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

if(typeof(exports) !== 'undefined') {
    module.exports = vec3;
}

},{"./common":28}],36:[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var GLMAT_ARRAY_TYPE = require('./common').GLMAT_ARRAY_TYPE;

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */
var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Adds two vec4's after scaling the second operand by a scalar value
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec4} out
 */
vec4.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    out[2] = a[2] + (b[2] * scale);
    out[3] = a[3] + (b[3] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Returns the inverse of the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to invert
 * @returns {vec4} out
 */
vec4.inverse = function(out, a) {
  out[0] = 1.0 / a[0];
  out[1] = 1.0 / a[1];
  out[2] = 1.0 / a[2];
  out[3] = 1.0 / a[3];
  return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec4} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec4} out
 */
vec4.random = function (out, scale) {
    scale = scale || 1.0;

    //TODO: This is a pretty awful way of doing this. Find something better.
    out[0] = GLMAT_RANDOM();
    out[1] = GLMAT_RANDOM();
    out[2] = GLMAT_RANDOM();
    out[3] = GLMAT_RANDOM();
    vec4.normalize(out, out);
    vec4.scale(out, out, scale);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    out[3] = a[3];
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    module.exports = vec4;
}

},{"./common":28}],37:[function(require,module,exports){
// xna.js api

module.exports = {

  Class:            require('./class'),
  Device:           require('./device'),
  Game:             require('./game'),
  
  mat2:             require('./matrix/mat2'),
  mat2d:            require('./matrix/mat2d'),
  mat3:             require('./matrix/mat3'),
  mat4:             require('./matrix/mat4'),
  quat:             require('./matrix/quat'),
  vec2:             require('./matrix/vec2'),
  vec3:             require('./matrix/vec3'),
  vec4:             require('./matrix/vec4'),
  
  Gamepad:          require('./input/gamepad'),
  Keyboard:         require('./input/keyboard'),
  Keys:             require('./input/keys'),
  Pointer:          require('./input/pointer'),
  
  Blend:            require('./graphics/blend'),
  BlendState:       require('./graphics/blend-state'),
  BufferUsage:      require('./graphics/buffer-usage'),
  Effect:           require('./graphics/effect'),
  EffectParameter:  require('./graphics/effect-parameter'),
  GraphicsDevice:   require('./graphics/graphics-device'),
  IndexBuffer:      require('./graphics/index-buffer'),
  VertexBuffer:     require('./graphics/index-buffer'),
  PrimitiveType:    require('./graphics/primitive-type'),
  Texture2D:        require('./graphics/texture2d'),
  RenderTarget2D:   require('./graphics/render-target2d'),
  SpriteBatch:      require('./graphics/sprite-batch'),
  SpriteFont:       require('./graphics/sprite-font'),
  
  ContentManager:   require('./content/content-manager')
  
};
},{"./class":1,"./content/content-manager":2,"./device":8,"./game":9,"./graphics/blend":11,"./graphics/blend-state":10,"./graphics/buffer-usage":12,"./graphics/effect":14,"./graphics/effect-parameter":13,"./graphics/graphics-device":15,"./graphics/index-buffer":16,"./graphics/primitive-type":17,"./graphics/render-target2d":18,"./graphics/sprite-batch":19,"./graphics/sprite-font":20,"./graphics/texture2d":21,"./input/gamepad":24,"./input/keyboard":25,"./input/keys":26,"./input/pointer":27,"./matrix/mat2":29,"./matrix/mat2d":30,"./matrix/mat3":31,"./matrix/mat4":32,"./matrix/quat":33,"./matrix/vec2":34,"./matrix/vec3":35,"./matrix/vec4":36}]},{},[37])(37)
});