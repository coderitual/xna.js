var Pointer = require('xnajs/input/pointer');

var pointerOldState =  Pointer.items[0].state;
var tap = false;

var Input = {

    tap: function() {
        return tap;
    },

    update: function() {

        if (Pointer.itemsCount > 0) {

            var pointer = Pointer.items[0];

            tap = false;

            if (pointer.state != pointerOldState && pointer.state == Pointer.STATE_DOWN) {
                tap = true;
            }
        }

        pointerOldState =  Pointer.items[0].state;
    }
};

module.exports = Input;

