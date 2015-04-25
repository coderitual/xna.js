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