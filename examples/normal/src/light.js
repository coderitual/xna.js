var Class = require('xnajs/class');

var Light = Class.extend({

    create: function() {

        this.position   = [0, 0, 0];
        this.color      = [0, 0, 0, 0];
        this.power      = 0;
        this.isEnabled  = true;
        this.lightDecay = 0;


    }

});

module.exports = Light;