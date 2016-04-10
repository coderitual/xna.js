var Player = require('./player');
var vec2 = require('xnajs/matrix/vec2');

// temp vector
var tv = vec2.create();

var Bullet = function(x, y, angle, speed) {

    this.pos = [x, y];
    this.angle = angle || 0;
    this.speed = speed || 30;

    this.radius = 10;
    this.color = [1, 1, 1, 1];
    this.scale = [1, 1];

    this.isExpired = false;
    this.isActive = true;
    this.liveTime = 0;
};

Bullet.prototype = {

    constructor: Bullet,

    update: function(dt) {

        var dirx = Math.cos(this.angle - Math.PI / 2);
        var diry = Math.sin(this.angle - Math.PI / 2);

        this.pos[0] += dirx * this.speed * dt;
        this.pos[1] += diry * this.speed * dt;

        this.liveTime += dt;
        if(this.liveTime > 1.5) {
            this.isExpired = true;
        }

    }
};

module.exports = Bullet;