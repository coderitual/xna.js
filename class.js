var e = !1;
var i = /\bsuper\b/;

var Class = function() {};

Class.extend = function(t) {
    function s() {
        e || (this.create && this.create.apply(this, arguments))
    }
    var n = this.prototype;
    e = true;
    var o = new this();
    e = false;
    for (var h in t) {
        var r = Object.getOwnPropertyDescriptor(t, h);
        r.get || r.set ? Object.defineProperty(o, h, r) : o[h] = "function" == typeof t[h] && "function" == typeof n[h] && i.test(t[h]) ? function(t, e) {
            return function() {
                var u = this.super;
                this.super = n[t], this._fn = e;
                var c = this._fn.apply(this, arguments);
                return this.super = u, c;
            }
        }(h, t[h]) : t[h]
    }
    
    s.prototype = o;
    s.prototype.constructor = o.constructor;
    s.extend = this.extend;
    return s;
}; 

module.exports = Class 
