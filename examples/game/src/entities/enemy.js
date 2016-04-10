var Player = require('./player');
var vec2 = require('xnajs/matrix/vec2');

// temp vector
var tv = vec2.create();

var Enemy = function(x, y, speed) {

    this.pos = [x, y];
    this.vel = [0, 0];
    this.angle = 0;
    this.speed = speed || 30;

    this.radius = 10;
    this.color = [0.5, 0.5, 0.5, 0.5];
    this.scale = [1, 1];

    this.isExpired = false;
    this.isActive = false;
    this.activationTime = 1.5;
};

Enemy.prototype = {

    constructor: Enemy,

    update: function(dt) {

        if(this.activationTime > 0) {
            this.activationTime -= dt;
            return;
        } else {
            this.color = [1, 1, 1, 1];
            this.isActive = true;
        }

        // follow player
        vec2.subtract(tv, Player.pos, this.pos);
        vec2.normalize(tv, tv);
        vec2.scaleAndAdd(this.vel, this.vel, tv, this.speed);

        // update pos
        this.pos[0] += this.vel[0] * dt;
        this.pos[1] += this.vel[1] * dt;

        // slow down
        vec2.scale(this.vel, this.vel, 0.5);
    },

    handleCollision: function(other) {

        vec2.subtract(tv, this.pos, other.pos);
        vec2.add(this.vel, this.vel, tv);
    }
};

module.exports = Enemy;