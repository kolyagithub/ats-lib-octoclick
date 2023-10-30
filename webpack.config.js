const Dotenv = require('dotenv-webpack');
var webpack = require('webpack'),
  path = require('path'),
  // , TerserPlugin = require("terser-webpack-plugin")
  env = process.env.WEBPACK_ENV;
console.log(env);
var libraryName = 'ats-lib-octoclick',
  outputFile = '',
  plugins = [];
// configure output for proper build type
if (env === 'build') {
  // plugins.push(new TerserPlugin());
  outputFile = 'index' + '.min.js';
} else {
  outputFile = 'index' + '.js';
}

module.exports = {
  plugins: [new Dotenv()],
  entry: path.join(__dirname, 'src', 'index.ts'),
  output: {
    path: path.join(__dirname, 'lib'),
    filename: outputFile,
    library: {
      name: libraryName,
      type: 'umd'
    },
    // library: libraryName,
    // libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: `(typeof self !== 'undefined' ? self : this)`
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
        // exclude: /(node_modules)/
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel',
        exclude: /(node_modules)/
      }
    ]
  },
  externals: [
    'qs',
    'axios',
    '@atsorganization/ats-lib-ntwk-common',
    '@atsorganization/ats-lib-logger',
    '@atsorganization/ats-lib-redis'
  ],
  resolve: {
    modules: [path.resolve('./src')],
    extensions: ['.js', '.ts']
  }
};
