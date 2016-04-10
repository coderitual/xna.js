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
