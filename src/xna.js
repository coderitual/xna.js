// xna.js api

module.exports = {

  Class:            require('./class'),
  Device:           require('./device'),
  Game:             require('./game'),
  
  mat2:             require('./matrix/mat2'),
  mat2d:            require('./matrix/mat2d'),
  mat3:             require('./matrix/mat3'),
  mat4:             require('./matrix/mat4'),
  quat:             require('./matrix/quat'),
  vec2:             require('./matrix/vec2'),
  vec3:             require('./matrix/vec3'),
  vec4:             require('./matrix/vec4'),
  
  Gamepad:          require('./input/gamepad'),
  Keyboard:         require('./input/keyboard'),
  Keys:             require('./input/keys'),
  Pointer:          require('./input/pointer'),
  
  Blend:            require('./graphics/blend'),
  BlendState:       require('./graphics/blend-state'),
  BufferUsage:      require('./graphics/buffer-usage'),
  Effect:           require('./graphics/effect'),
  EffectParameter:  require('./graphics/effect-parameter'),
  GraphicsDevice:   require('./graphics/graphics-device'),
  IndexBuffer:      require('./graphics/index-buffer'),
  VertexBuffer:     require('./graphics/index-buffer'),
  PrimitiveType:    require('./graphics/primitive-type'),
  Texture2D:        require('./graphics/texture2d'),
  RenderTarget2D:   require('./graphics/render-target2d'),
  SpriteBatch:      require('./graphics/sprite-batch'),
  SpriteFont:       require('./graphics/sprite-font'),
  
  ContentManager:   require('./content/content-manager')
  
};