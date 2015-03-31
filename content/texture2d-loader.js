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