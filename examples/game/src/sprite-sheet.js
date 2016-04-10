var SpriteSheet = function(texture, rect, origin) {
    this.texture    = texture;
    this.rectangle  = rect;
    this.origin     = origin || [rect[2] / 2, rect[3] / 2];
};

module.exports = SpriteSheet;