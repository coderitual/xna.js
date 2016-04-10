var Player = {

    pos: [0, 0],
    angle: 0,
    av: 0,
    aa: 0.2,
    acc: 10,
    vel: 0,

    radius: 10,
    color: [1, 1, 1, 1],
    scale: [1, 1],

    isActive: true,

    update: function(dt) {

        this.av += this.aa;
        this.av = this.aa >= 0 ? Math.min(this.av, 3) : Math.max(this.av, -3);
        this.angle += this.av * dt;

        var dirx = Math.cos(this.angle - Math.PI / 2);
        var diry = Math.sin(this.angle - Math.PI / 2);

        this.vel += this.acc;
        this.vel = Math.min(this.vel, 150);

        this.pos[0] += dirx * this.vel * dt;
        this.pos[1] += diry * this.vel * dt;

    }
};

module.exports = Player;