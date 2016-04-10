var Player          = require('./player');
var vec2            = require('xnajs/matrix/vec2');

var Powerup = function(x, y, shots, speed) {

    this.pos = [x, y];
    this.vel = [0, 0];
    this.angle = 0;

    this.radius = 32;
    this.color = [1, 1, 1, 1];
    this.scale = [1, 1];
    this.shots = shots || 10;
    this.speed = speed || 100;

    this.isExpired = false;
    this.isActive = true;
};

Powerup.prototype = {

    constructor: Powerup,

    update: function(dt) {

    }
};

module.exports = Powerup;