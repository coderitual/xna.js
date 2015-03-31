'use strict'

var Device = {

    ua: {
        mobile: /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())
    },

    isPortrait: function() {
        return (!Device.ua.mobile || window.innerHeight > window.innerWidth)
    }

};

module.exports = Device;
