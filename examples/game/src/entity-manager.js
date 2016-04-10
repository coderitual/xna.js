var vec2        = require('xnajs/matrix/vec2');
var Player      = require('./entities/player');
var GameState   = require('./game-state');

var EntityManager = {

    enemies: [],
    bullets: [],
    powerups: [],

    update: function(dt) {

        var i;

        this.handleCollision();

        for(i = 0; i < this.enemies.length; i++) {
            this.enemies[i].update(dt);
        }

        for(i = 0; i < this.powerups.length; i++) {
            this.powerups[i].update(dt);
        }

        for(i = 0; i < this.bullets.length; i++) {
            this.bullets[i].update(dt);
        }

    },

    handleCollision: function() {

        var i, j;

        // handle collisions between enemies
        for(i = 0; i < this.enemies.length; i++) {

            for(j = i + 1; j < this.enemies.length; j++) {

                if(this.isColliding(this.enemies[i], this.enemies[j])) {
                    this.enemies[i].handleCollision(this.enemies[j]);
                    this.enemies[j].handleCollision(this.enemies[i]);
                }
            }
        }

        // handle collisions between bullets and enemies
        for(i = 0; i < this.enemies.length; i++) {

            for(j = 0; j < this.bullets.length; j++) {

                if(this.isColliding(this.enemies[i], this.bullets[j])) {
                    this.enemies[i].isExpired = true;
                    this.bullets[j].isExpired = true;
                }
            }
        }

        // handle collisions between the player and enemies
        for(i = 0; i < this.enemies.length; i++) {

            if(this.isColliding(this.enemies[i], Player)) {
                this.killPlayer();
            }

        }

        // handle collisions between the player and powerups
        for(i = 0; i < this.powerups.length; i++) {

            if(this.isColliding(this.powerups[i], Player)) {
                this.powerups[i].isExpired = true;
            }
        }

        // handle collisions between bullets and powerups
        for(i = 0; i < this.powerups.length; i++) {

            for(j = 0; j < this.bullets.length; j++) {

                if(this.isColliding(this.powerups[i], this.bullets[j])) {
                    this.powerups[i].isExpired = true;
                    this.bullets[j].isExpired = true;
                }
            }
        }
    },

    isColliding: function(a, b) {

        var radius = a.radius + b.radius;
        return a.isActive && b.isActive && !a.isExpired && !b.isExpired && vec2.squaredDistance(a.pos, b.pos) < radius * radius;
    },

    killPlayer: function() {
        Player.isActive = false;
    }
};

module.exports = EntityManager;