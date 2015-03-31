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
