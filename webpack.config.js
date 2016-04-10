var path = require('path');

module.exports = {

    entry: {
        '01': './src/01/main.js',
        '02': './src/02/main.js'
    },

    output: {
        filename: 'dist/game.[name].js',
        devtoolModuleFilenameTemplate: "/[resource-path]"
    },

    module: {
        loaders: [
            { test: /\.fx$/, loader: 'raw' },           // shader
        ]
    },
    
    resolve: {
      root: path.resolve(__dirname, './src')
    }
};
