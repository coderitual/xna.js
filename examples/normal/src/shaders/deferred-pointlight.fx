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

varying vec2 _texCoord;
varying vec4 _color;

uniform float screenWidth;
uniform float screenHeight;
uniform vec4 ambientColor;

uniform float lightStrength;
uniform float lightDecay;
uniform vec3 lightPosition;
uniform vec4 lightColor;
uniform float lightRadius;
uniform float specularStrength;

uniform vec3 coneDirection;
uniform float coneAngle;
uniform float coneDecay;

uniform sampler2D NormalMap;
uniform sampler2D ColorMap;

void main() {
    vec4 colorMap = texture2D(ColorMap, _texCoord);
    vec3 normal = (2.0 * texture2D(NormalMap, _texCoord).rgb) - 1.0;

    vec3 pixelPosition;
    pixelPosition.x = screenWidth * _texCoord.x;
    pixelPosition.y = screenHeight - screenHeight * _texCoord.y;
    pixelPosition.z = 0.0;

    vec3 lightDirection = lightPosition - pixelPosition;
    vec3 lightDirNorm = normalize(lightDirection);
    vec3 halfVec = vec3(0, 0, 1);

    float amount = max(dot(normal, lightDirNorm), 0.0);
    float coneAttenuation = clamp(1.0 - length(lightDirection) / lightDecay, 0.0, 1.0);

    vec3 reflect = normalize(2.0 * amount * normal - lightDirNorm);
    float specular = min(pow(clamp(dot(reflect, halfVec), 0.0, 1.0), 10.0), amount);

    gl_FragColor = colorMap * coneAttenuation * lightColor * lightStrength + (specular * coneAttenuation * specularStrength);
}

#endif