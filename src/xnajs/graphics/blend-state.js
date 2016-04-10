var Blend = require('./blend');


var BlendState = {

    OPAQUE:                 [Blend.ONE, Blend.ZERO],
    ADDITIVE:               [Blend.SRC_ALPHA, Blend.ONE],
    ALPHA_BLEND:            [Blend.ONE, Blend.ONE_MINUS_SRC_ALPHA],
    NON_PREMULTIPLED:       [Blend.SRC_ALPHA, Blend.ONE_MINUS_SRC_ALPHA]
};

module.exports = BlendState;