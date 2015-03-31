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