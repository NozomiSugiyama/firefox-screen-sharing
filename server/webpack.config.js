const { DefinePlugin } = require('webpack');
const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  externals: [nodeExternals()],
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js'],
  },
  module: {
    rules: [
        {
           test: /\.ts$/,
           loader: 'ts-loader',
           options: {
               configFile: require.resolve(`./tsconfig.json`)
           },
        }
    ]
  },
  externals: {
      uws: "uws"
  },
};
