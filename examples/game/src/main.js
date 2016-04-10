/**
 * @author       Michał Skowronek <skowronkow@gmail.com>
 * @twitter      @coderitual
 * @website      http://www.coderitual.com
 * @copyright    2015 coderitual
 */

'use strict';

var MobileGame = require('./invictus.js');

document.addEventListener('DOMContentLoaded', main, false);

function main() {

    var game = new MobileGame();
    game.run();
}
