var MAX_KEYS = 256;

var KeyboardState = function() {
    this._keys          = new Uint8Array(MAX_KEYS);
};

KeyboardState.prototype = {

    constructor: KeyboardState,

    isKeyUp: function(key) {

        return this._keys[key] == false;
    },

    isKeyDown: function(key) {

        return this._keys[key] == true;
    }

};

var Keyboard = function() {
    
    this._initialized = false;

    this._keys          = new Uint8Array(MAX_KEYS);
    this._registered    = new Uint8Array(MAX_KEYS);
    
    this._onKeyDown     = null;
    this._onKeyUp       = null;
};

Keyboard.prototype = {
    
    constructor: Keyboard,
    
    initialize: function() {
        
        if(this._initialized) {
            return;
        }
        
        var _this = this;

        this._onKeyDown = function(event) {
            _this.processKeyDown(event);
        };

        this._onKeyUp = function(event) {
            _this.processKeyUp(event);
        };

        window.addEventListener('keydown', this._onKeyDown, false);
        window.addEventListener('keyup', this._onKeyUp, false);
        
        this._initialized = true;
    },

    dispose: function() {
        
        if(!this._initialized) {
            return;
        }
        
        window.removeEventListener('keydown', this._onKeyDown, false);
        window.removeEventListener('keyup', this._onKeyUp, false);
        
        this._onKeyDown = null;
        this._onKeyUp = null;
        
        this._initialized = false;
        
    },
    
    processKeyDown: function(event) {
        
        if(!this._registered[event.keyCode]) {
            return;
        }
        
        this._keys[event.keyCode] = true;
        event.preventDefault();
    },
    
    processKeyUp: function(event) {
        
        if(!this._registered[event.keyCode]) {
            return;
        }
        
        event.preventDefault();
        this._keys[event.keyCode] = false;
    },
    
    addKey: function(key) {

        this._registered[key] = true;
    },
    
    removeKey: function(key) {

        this._registered[key] = false;
    },

    getState: function() {

        var state = new KeyboardState();
        var keys = this._keys;

        for(var i = 0; i < MAX_KEYS; i++) {
            state._keys[i] = keys[i];
        }

        return state;
    }
};

module.exports = new Keyboard();
