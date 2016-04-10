var FpsMeter = function() {
    this._elapsed       = 0;
    this._counter       = 0;
    this._fps           = 0;
    
    Object.defineProperty(this, 'fps', {
      get: function() {
        return this._fps;
      }
    });
};

FpsMeter.prototype = {

    constructor: FpsMeter,

    update: function(gameTime) {

        this._counter++;
        this._elapsed += gameTime.elapsedGameTime;

        if(this._elapsed >= 1000) {
            this._fps = this._counter;
            this._elapsed = 0;
            this._counter = 0;
        }
    }
}

module.exports = FpsMeter;