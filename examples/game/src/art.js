var SpriteSheet = require('./sprite-sheet');

var Art = {

    load: function(content) {

        this.fontTiny   = content.load['SpriteFont']('fonts/neuropol_tiny.fnt');
        this.fontSmall  = content.load['SpriteFont']('fonts/neuropol_small.fnt');
        this.font       = content.load['SpriteFont']('fonts/neuropol.fnt');

        this.ship       = new SpriteSheet(content.load['Texture2D']('textures/ship-white.png'), [0, 0, 26, 30]);
        this.enemy      = new SpriteSheet(content.load['Texture2D']('textures/ship.png'), [0, 0, 26, 30]);
        this.bullet     = new SpriteSheet(content.load['Texture2D']('textures/flare2.png'), [0, 0, 32, 32]);
        this.powerup    = new SpriteSheet(content.load['Texture2D']('textures/glow7.png'), [0, 0, 64, 64]);
        this.background = new SpriteSheet(content.load['Texture2D']('textures/grid.jpg'), null, [0, 0]);
    }
};

module.exports = Art;