var VertexBuffer        = require('./vertex-buffer');
var IndexBuffer         = require('./index-buffer');
var Effect              = require('./effect');
var BlendState          = require('./blend-state');

var SpriteEffectCode    = require('./shaders/sprite-effect.fx');

var mat4                = require('../matrix/mat4');
var mat3                = require('../matrix/mat3');
var vec2                = require('../matrix/vec2');

// helper matrix for transform operations
var tmpMat3 = mat3.create();

var SpriteBatch = function(graphicsDevice, size) {

    this.graphicsDevice = graphicsDevice;

    this._effect        = new Effect(this.graphicsDevice, SpriteEffectCode);
    this._currentEffect = null;
    this._blendState    = null;

    this._size          = size || 512;
    this._count         = 0;

    this._matrix        = mat4.create();
    this._matrix[0]     = 2 / this.graphicsDevice.backBufferWidth;
    this._matrix[5]     = -2 / this.graphicsDevice.backBufferHeight;
    this._matrix[12]    = -1;
    this._matrix[13]    = 1;

    this._vertexBuffer  = new VertexBuffer(this.graphicsDevice, 2);
    this._uvBuffer      = new VertexBuffer(this.graphicsDevice, 2);
    this._colorBuffer   = new VertexBuffer(this.graphicsDevice, 4);
    this._indexBuffer   = new IndexBuffer(this.graphicsDevice);

    this._texture = null;

    this.expand(this._size);
};

SpriteBatch.prototype = {

    constructor: SpriteBatch,

    begin: function(blendState, effect) {

        this._count = 0;
        this._currentEffect = effect || this._effect;
        this._currentEffect.apply();

        this._blendState = this.graphicsDevice.blendState;
        this.graphicsDevice.blendState = blendState || BlendState.ALPHA_BLEND;
    },

    end: function() {

        this.flush();

        this.graphicsDevice.blendState = this._blendState;
        this._currentEffect = null;
        this._blendState    = null;
    },

    flush: function() {

        if( this._count < 1) {
            return;
        }

        var gl = this.graphicsDevice.gl;

        var parameters = this._currentEffect.parameters;

        if(parameters['position']) parameters['position'].setValue(this._vertexBuffer);
        if(parameters['color']) parameters['color'].setValue(this._colorBuffer);
        if(parameters['texCoord']) parameters['texCoord'].setValue(this._uvBuffer);
        if(parameters['Texture']) parameters['Texture'].setValue(this._texture);
        if(parameters['ModelViewMatrix']) parameters['ModelViewMatrix'].setValue(this._matrix);

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

        // Transform

        var transform = mat3.identity(tmpMat3);
        mat3.translate(transform, transform, pos);
        mat3.scale(transform, transform, scale)
        mat3.rotate(transform, transform, rotation);

        // TODO: move it outside (optimise this)
        vec2.forEach(this._vertices, 2, offset, 4, function(vec) {
            vec2.transformMat3(vec, vec, transform);
        });

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

        var transform = mat3.identity(tmpMat3);
        mat3.translate(transform, transform, pos);
        mat3.scale(transform, transform, scale)
        mat3.rotate(transform, transform, rotation);

        // TODO: move it outside (optimise this)
        vec2.forEach(this._vertices, 2, startOffset, 4 * text.length, function(vec) {
            vec2.transformMat3(vec, vec, transform);
        });
    }
};

module.exports = SpriteBatch;