function isElement(o){
  return typeof HTMLElement === "object" ? o instanceof HTMLElement : 
         o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string";
}

var GameWindow = function(element) {
    
    this._initialized = false;
    
    this.element = null;
    
    if(typeof element === 'string') {
        
        element = document.querySelector(element);
    }

    if (isElement(element)) {
        
        this.element = element;
        
    } else {
        
        this.element = document.body;
    }
    
    this.canvas     = document.createElement('canvas');
    this.canvas.id  = 'x-surface';

    this.element.appendChild(this.canvas);

    this.clientBounds = {
        x:      0,
        y:      0,
        width:  0,
        height: 0
    };
    
    this.scale = {
        x: 1,
        y: 1
    };
    
    this.aspectRatio = 0;
    
    this._oncontextmenu = null;
};

GameWindow.prototype = {
    
    constructor: GameWindow,

    initialize: function() {

        if(this._initialized) {
            return;
        }

        this._oncontextmenu = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        this.canvas.addEventListener('contextmenu', this._oncontextmenu, false);
        
        this._initialized = true;
    },
    
    dispose: function() {
        
        if(!this._initialized) {
            return;
        }

        this.canvas.removeEventListener('contextmenu', this._oncontextmenu, false);

        this._initialized = false;
    },
    
    update: function() {

        if(!this._initialized) {
            return;
        }

        this.refreshClientRect();
    },

    refreshClientRect: function() {

        var boundingClientRect = this.canvas.getBoundingClientRect();

        this.clientBounds.x         = boundingClientRect.left;
        this.clientBounds.y         = boundingClientRect.top;
        this.clientBounds.width     = boundingClientRect.width;
        this.clientBounds.height    = boundingClientRect.height;

        this.scale.x = boundingClientRect.width / this.canvas.width;
        this.scale.y = boundingClientRect.height / this.canvas.height;

        this.aspectRatio = boundingClientRect.width / boundingClientRect.height;
    }
}

module.exports = GameWindow;
