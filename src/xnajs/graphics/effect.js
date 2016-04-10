var Class               = require('../class');
var EffectParameter     = require('./effect-parameter');

var Effect = Class.extend({
    
    create: function(graphicsDevice, vertexShaderCode, fragmentShaderCode) {

        // create shader
        
        this.graphicsDevice = graphicsDevice;

        var gl = graphicsDevice.gl;

        if(!fragmentShader) {
            fragmentShaderCode  = '#define FRAGMENT\n' + vertexShaderCode;
            vertexShaderCode    = '#define VERTEX\n' + vertexShaderCode;
        }

        var vertexShader = graphicsDevice.createShader(vertexShaderCode, gl.VERTEX_SHADER);
        var fragmentShader = graphicsDevice.createShader(fragmentShaderCode, gl.FRAGMENT_SHADER);

        this.program = graphicsDevice.createProgram(vertexShader, fragmentShader);

        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        // init parameters

        this._attributes    = graphicsDevice.getAttributes(this.program);
        this._uniforms      = graphicsDevice.getUniforms(this.program);
        this.parameters     = {};
        this.samplers       = [];

        for (var key in this._uniforms) {

            if(this._uniforms.hasOwnProperty(key)) {

                var uniform = this._uniforms[key];
                this.parameters[key] = new EffectParameter(this, key, uniform, EffectParameter.TYPE_UNIFORM);
            }

        }

        for (var key in this._attributes) {

            if(this._attributes.hasOwnProperty(key)) {

                var attribute = this._attributes[key];
                this.parameters[key] = new EffectParameter(this, key, attribute, EffectParameter.TYPE_ATTRIBUTE);
            }

        }

    },

    getAttributeLocation: function(name) {
        return this._attributes[name].location;
    },

    destroy: function() {

        if (this.graphicsDevice.gl && this.program) {
            var gl = this.graphicsDevice.gl;
            gl.deleteProgram(this.program);
        }
    },
    
    apply: function() {

        this.graphicsDevice.useEffect(this);
    },

    reset: function() {

        for (var key in this.parameters) {

            if(this.parameters.hasOwnProperty(key)) {

                var parameter = this.parameters[key];
                parameter.value = null;
            }

        }
    }
});

module.exports = Effect;