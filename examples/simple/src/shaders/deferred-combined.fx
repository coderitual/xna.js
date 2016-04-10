#ifdef VERTEX

attribute vec3 position;
attribute vec4 color;
attribute vec2 texCoord;

varying vec2 _texCoord;
varying vec4 _color;

uniform mat4 ModelViewMatrix;

void main() {
    gl_Position = ModelViewMatrix * vec4(position, 1.0);
    _texCoord = texCoord;
    _color = color;
}

#endif

#ifdef FRAGMENT

precision highp float;

uniform float ambient;
uniform vec4 ambientColor;
uniform float lightAmbient;

varying vec2 _texCoord;
varying vec4 _color;
uniform sampler2D NormalMap;
uniform sampler2D ColorMap;
uniform sampler2D ShadingMap;

void main() {

    vec2 coord = vec2(_texCoord.x, 1.0 - _texCoord.y);

    vec4 color2 = texture2D(ColorMap, coord);
    vec4 shading = texture2D(ShadingMap, _texCoord);
    float normal = length(texture2D(NormalMap, coord).rgb);

    if (normal > 0.0)
    {
        vec4 finalColor = color2 * ambientColor * ambient;
        finalColor += (shading * color2) * lightAmbient;

        gl_FragColor = finalColor;
    }
    else
    {
        gl_FragColor = vec4(0, 0, 0, 0);
    }
}

#endif