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
