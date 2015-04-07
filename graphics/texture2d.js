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