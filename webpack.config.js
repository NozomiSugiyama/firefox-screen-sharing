const { DefinePlugin } = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.ts'],
  },
  module: {
    rules: [
        {
           test: /\.ts$/,
           loader: 'ts-loader',
           options: {
               configFile: require.resolve(`./tsconfig${process.env.NODE_ENV === 'production' ? '.prod' : ''}.json`)
           },
        }
      ]
  },
  plugins: [
    new DefinePlugin(
      Object.entries(process.env)
        .map(x => ({ [`process.env.${x[0]}`]: JSON.stringify(x[1]) }))
        .reduce((x, y) => Object.assign(x, y), {}),
    ),
  ],
};
