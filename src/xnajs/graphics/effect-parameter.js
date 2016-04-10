var VertexBuffer    = require('./vertex-buffer');
var Texture2D       = require('./texture2d');

/*
    Helper
    ------------------------------------------------------------------------
 */

function arraysEqual(a, b) {
    var i = a.length;

    if (i != b.length) return false;

    while (i--) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

/*
    Uniforms
 ------------------------------------------------------------------------
 */

var setFloat = function(value) {

    if(this.value === value) return;

    this.value = value;

    var gl = this.effect.graphicsDevice.gl;
    gl.uniform1f(this.location, this.value);

};

var setFloatVec = function(value) {

    if(this.value && arraysEqual(this.value, value))  return;

    this.value = value;

    var len = value.length;
    var gl = this.effect.graphicsDevice.gl;

    switch(len) {
        case 2: gl.uniform2fv(this.location, value); break;
        case 3: gl.uniform3fv(this.location, value); break;
        case 4: gl.uniform4fv(this.location, value); break;
    }

};

var setFloatMat = function(value) {

    if(this.value && arraysEqual(this.value, value))  return;

    this.value = value;

    var len = value.length;
    var gl = this.effect.graphicsDevice.gl;

    switch(len) {
        case 4: gl.uniformMatrix2fv(this.location, false, value); break;
        case 9: gl.uniformMatrix3fv(this.location, false, value); break;
        case 16: gl.uniformMatrix4fv(this.location, false, value); break;
    }

};

var setInt = function(value) {

    if(this.value === value) return;

    this.value = value;

    var gl = this.effect.graphicsDevice.gl;
    gl.uniform1i(this.location, this.value);

};

var setIntVec = function(value) {

    if(this.value && arraysEqual(this.value, value))  return;

    this.value = value;

    var len = value.length;
    var gl = this.effect.graphicsDevice.gl;

    switch(len) {
        case 2: gl.uniform2iv(this.location, value); break;
        case 3: gl.uniform3iv(this.location, value); break;
        case 4: gl.uniform4iv(this.location, value); break;
    }

};

var setTexture = function(value) {

    if(!(value instanceof Texture2D)) {
        throw new Error('[EffectParameter::setTexture] Texture2D parameter type required');
    }

    if(this.value === value) return;
    this.value = value;

    var gl = this.effect.graphicsDevice.gl;

    gl.uniform1i(this.location, this.sampler);
    this.value.bind(this.sampler);

};

/*
    Attributes
 ------------------------------------------------------------------------
 */

var setVertexBuffer = function(value) {

    if(!(value instanceof VertexBuffer)) {
        throw new Error('[EffectParameter::setVertexBuffer] VertexBuffer parameter type required');
    }

    if(this.value === value) return;
    this.value = value;

    var gl = this.effect.graphicsDevice.gl;

    gl.enableVertexAttribArray(this.location);
    gl.bindBuffer(gl.ARRAY_BUFFER, value.buffer);
    gl.vertexAttribPointer(this.location, value.chunkSize, gl.FLOAT, false, 0, 0);

    this.value = value;

};

var EffectParameter = function(effect, name, info, type) {

    this.effect     = effect;
    this.name       = name;
    this.location   = info.location;
    this.type       = type;
    this.value      = null;

    /**
     * Texture sampler
     * @type {number}
     */
    this.sampler = -1;

    /**
     * Value setter depends on parameter type
     * @type {null}
     */
    this.setValue = null;

    var gl = effect.graphicsDevice.gl;

    if(type === EffectParameter.TYPE_UNIFORM) {         // Uniform

        switch(info.type) {

            case gl.INT:
            case gl.BOOL:
                this.setValue = setInt;
                break;

            case gl.INT_VEC2:
            case gl.INT_VEC3:
            case gl.INT_VEC4:
            case gl.BOOL_VEC2:
            case gl.BOOL_VEC3:
            case gl.BOOL_VEC4:
                this.setValue = setIntVec;
                break;

            case gl.FLOAT_VEC2:
            case gl.FLOAT_VEC3:
            case gl.FLOAT_VEC4:
                this.setValue = setFloatVec;
                break;

            case gl.FLOAT_MAT2:
            case gl.FLOAT_MAT3:
            case gl.FLOAT_MAT4:
                this.setValue = setFloatMat;
                break;

            case gl.SAMPLER_2D:
                this.setValue = setTexture;
                this.effect.samplers.push(this.name);
                this.sampler = this.effect.samplers.length - 1;
                break;

            case gl.FLOAT:
            default:
                this.setValue = setFloat;
                break;
        }

    } else {                                        // Attribute

            this.setValue = setVertexBuffer;

    }

};

EffectParameter.prototype = {

    constructor: EffectParameter

};

EffectParameter.TYPE_UNIFORM    = 0;
EffectParameter.TYPE_ATTRIBUTE  = 1;

module.exports = EffectParameter;