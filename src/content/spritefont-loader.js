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