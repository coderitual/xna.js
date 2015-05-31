#ifdef VERTEX

attribute vec3 position;
attribute vec4 color;
attribute vec2 texCoord;

varying vec2 _texCoord;
varying vec4 _color;

uniform mat4 ViewProjectionMatrix;

void main() {
    gl_Position = ViewProjectionMatrix * vec4(position, 1.0);
    _texCoord = texCoord;
    _color = color;
}

#endif

#ifdef FRAGMENT

precision mediump float;
varying vec2 _texCoord;
varying vec4 _color;
uniform sampler2D Texture;

void main() {
    gl_FragColor = texture2D(Texture, _texCoord) * _color;
}

#endif