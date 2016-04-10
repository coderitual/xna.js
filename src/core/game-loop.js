// shim layer with setTimeout fallback
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ) { window.setTimeout(callback, 1000 / 60); };
})();

// shim performance timer
window.performance = window.performance || {};
performance.now = (function() {
    return performance.now      ||
        performance.mozNow    ||
        performance.msNow     ||
        performance.oNow      ||
        performance.webkitNow ||
        function() { return new Date().getTime(); };
})();

var GameTime = require('./game-time');

var GameLoop = function(game) {
    
    this.game           = game;
    this.maxElapsedTime = 500;
    
    this._gameTime                  = new GameTime();
    this._accumulatedElapsedTime    = 0;
    this._previousTicks             = 0;
    
    var _this = this;
    this._onframe = function() {
        _this.tick();
    }
};

GameLoop.prototype = {
    
    constructor: GameLoop,
    
    tick: function() {
        
        requestAnimFrame(this._onframe);
        
        var game = this.game;
        var targetElapsedTime = game.targetElapsedTime;
        var isFixedTimeStep = game.isFixedTimeStep;
            
        var currentTicks = performance.now();
        this._accumulatedElapsedTime += (currentTicks - this._previousTicks);
        this._previousTicks = currentTicks;
        
        if (this._accumulatedElapsedTime > this.maxElapsedTime) {
            this._accumulatedElapsedTime = this.maxElapsedTime;
        }

        game._tick();
        
        if(isFixedTimeStep) {
            
            this._gameTime.elapsedGameTime = targetElapsedTime;
            
            while (this._accumulatedElapsedTime >= targetElapsedTime) {
                
                this._gameTime.totalGameTime += targetElapsedTime;
                this._accumulatedElapsedTime -= targetElapsedTime;
                
                game.update(this._gameTime);
            }
            
        } else {
            
            this._gameTime.elapsedGameTime = this._accumulatedElapsedTime;
            this._gameTime.totalGameTime += this._accumulatedElapsedTime;
            this._accumulatedElapsedTime = 0;
            
            game.update(this._gameTime);
        }
        
        this._gameTime.alpha = this._accumulatedElapsedTime / targetElapsedTime;
        game.draw(this._gameTime);
    },
    
    run: function() {
        
        this._gameTime.totalGameTime    = 0;
        this._gameTime.elapsedGameTime  = 0;
        this._gameTime.alpha            = 0;
        
        this._accumulatedElapsedTime    = 0;
        this._previousTicks             = 0;
        
        this.tick();
    }
    
}

module.exports = GameLoop