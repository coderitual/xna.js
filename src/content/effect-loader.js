var Effect = require('../graphics/effect');

var onLoad = function(contentManager, assetName, effect, request) {

    return function() {

        if (request.readyState !== 4 || request.status !== 200) {
            return;
        }

        var response = request.response;



        // finished
        contentManager.onAssetLoaded(assetName);
    }
};

var EffectLoader = function(contentManager) {

    return function(assetName) {
        var effect = contentManager.getAsset(assetName);

        if(!effect) {

            effect = new Effect(contentManager.graphicsDevice);
            contentManager.addAsset(this, assetName, effect, true);

            var request = new XMLHttpRequest();
            request.addEventListener('readystatechange', onLoad(contentManager, assetName, effect, request));
            request.open('GET', contentManager.rootDirectory + '/' + assetName);
            request.overrideMimeType('text/plain');
            request.send(null);
        }

        return effect;
    };
};

module.exports = EffectLoader;