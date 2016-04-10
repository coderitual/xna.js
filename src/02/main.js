/**
 * @author       Michał Skowronek (regis3) <skowronkow@gmail.com>
 * @twitter      @coderitual
 * @website      http://www.coderitual.com
 * @copyright    2015 coderitual
 */

'use strict';

var MobileGame = require('./mobile-game.js');

document.addEventListener('DOMContentLoaded', main, false);

function main() {
    var game = new MobileGame('#game');
    game.run();
}
