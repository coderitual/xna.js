// shim pointer lib
require('../hand');

var MAX_POINTERS = 10;

var PointerState = function(id, x, y, state, type) {
    
    this.id     = id;
    this.x      = x;
    this.y      = y;
    this.state  = state;
    this.type   = type;
};

var Pointer = function() {

    this._initialized = false;
    this.window = null;

    this.items              = new Array(MAX_POINTERS);
    this.itemsCount         = 0;
    this.maxActivePointers  = 1;
    
    for (var i = 0; i < this.items.length; i++) {
        this.items[i] = new PointerState(0, 0, 0, Pointer.STATE_UP, Pointer.TYPE_TOUCH);
    }

    this._onPointerUp   = null;
    this._onPointerDown = null;
    this._onPointerMove = null;

    // consts

    this.TYPE_TOUCH = 'touch';
    this.TYPE_MOUSE = 'mouse';
    this.TYPE_PEN   = 'pen';
    this.STATE_UP   = 0;
    this.STATE_DOWN = 1;
};

Pointer.prototype = {

    constructor: Pointer,

    initialize: function(gameWindow) {
        
        if(this._initialized) {
            return;
        }
        
        this.window = gameWindow;
        
        var _this = this;
        
        this._onPointerUp = function(event) {
            _this.processPointerUp(event);
        };
        
        this._onPointerDown = function(event) {
            _this.processPointerDown(event);
        };
                
        this._onPointerMove = function(event) {
            _this.processPointerMove(event);
        };

        this.window.canvas.addEventListener('pointerdown', this._onPointerDown, false);
        this.window.canvas.addEventListener('pointermove', this._onPointerMove, false);
        this.window.canvas.addEventListener('pointerup', this._onPointerUp, false);
        this.window.canvas.addEventListener('pointerout', this._onPointerUp, false);


        this._initialized = false;
    },
    
    destroy: function() {
                
        if(!this._initialized) {
            return;
        }
        
        this.window.canvas.removeEventListener('pointerdown', this._onPointerDown, false);
        this.window.canvas.removeEventListener('pointermove', this._onPointerMove, false);
        this.window.canvas.removeEventListener('pointerup', this._onPointerUp, false);
        this.window.canvas.removeEventListener('pointerout', this._onPointerUp, false);

        this._onPointerUp = null;
        this._onPointerDown = null;
        this._onPointerMove = null;
        
        this._initialized = false;
    },
    
    processPointerUp: function(event) {
        
        var item = this.findItemById(event.pointerId);

        if(!item) {
            return;
        }

        item.state = this.STATE_UP;

        // remove only if touch (there is no move event with touch after pointer up)
        if(item.type === this.TYPE_TOUCH) {

            var index = this.items.indexOf(item);
            if(this.itemsCount - 1 !== index) {

                this.items[index] = this.items[this.itemsCount - 1];
                this.items[this.itemsCount - 1] = item;
            }

            this.itemsCount--;
        }
    },
    
    processPointerDown: function(event) {
        
        var item = this.findItemById(event.pointerId);

        if(!item) {
            
            if(this.itemsCount === this.maxActivePointers) {
                return;
            }
            
            this.itemsCount++;
            item = this.items[this.itemsCount - 1];
        }

        var window = this.window;

        item.id     = event.pointerId;
        item.x      = (event.clientX - window.clientBounds.x) / window.scale.x;
        item.y      = (event.clientY - window.clientBounds.y) / window.scale.y;
        item.state  = this.STATE_DOWN;
        item.type   = event.pointerType;
    },
    
    processPointerMove: function(event) {
        
        var item = this.findItemById(event.pointerId);
        
        if(!item) {
            
            if(this.itemsCount === this.maxActivePointers) {
                return;
            }
            
            this.itemsCount++;
            item = this.items[this.itemsCount - 1];
        }
        
        var window = this.window;
        
        item.id     = event.pointerId;
        item.x      = (event.clientX - window.clientBounds.x) / window.scale.x;
        item.y      = (event.clientY - window.clientBounds.y) / window.scale.y;
        item.type   = event.pointerType;
    },
    
    findItemById: function(id) {

        for(var i = 0; i < this.itemsCount; i++) {

            if(this.items[i].id === id) {
                return this.items[i];
            }
        }
    }
};

module.exports = new Pointer();
