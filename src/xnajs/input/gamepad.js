var State = function() {
        
    this.isConnected = false;
    
    this.buttons = {
        a:          false,
        b:          false,
        x:          false,
        y:          false,
        lt:         false,
        lb:         false,
        rt:         false,
        rb:         false,
        start:      false,
        options:    false
    };
    
    this.dpad = {
        left:       false,
        rigth:      false,
        up:         false,
        down:       false
    };
    
    this.thumbstick = {
        left: {
            x: 0.0,
            y: 0.0
        },
        right: {
            x: 0.0,
            y: 0.0
        }
    };
};

var Gamepad = function() {

    this._initialized = false;
    
    this._onGamepadConnect      = null;
    this._onGamepadDisconnect   = null;
    this._onGamepadPoll         = null;
    this._gamepadPollInterval   = -1;
};

Gamepad.prototype = {
    
    constructor: Gamepad,
    
    initialize: function() {
        
        if(this._initialized || !this.isSupported()) {
            return;
        }
        
        this._initialized = true;
    },
    
    dispose: function() {
        
        if(!this._initialized) {
            return;
        }
        
        this._initialized = false;
    },
    
    processGamepadConnect: function(event) {
        
    },
    
    processGamepadDisconnect: function(event) {
        
    },
    
    processGamepadPoll: function(event) {
        
    },
    
    isSupported: function() {
        return "getGamepads" in navigator;
    }

};

module.exports = new Gamepad();