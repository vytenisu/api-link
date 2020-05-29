const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

const exportedConfig = {
  entry: __dirname + '/index.browser.ts',
  devtool: 'inline-source-map',
  mode: 'development',
  externals: [
    nodeExternals({
      whitelist: ['param-case', 'tslib', 'dot-case', 'no-case', 'lower-case'],
    }),
  ],
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
  },
  output: {
    path: __dirname + '/dist',
    filename: 'index.js',
    sourceMapFilename: 'index.js.map',
    libraryTarget: 'umd',
    library: 'ApiLink',
  },
  resolveLoader: {
    modules: [__dirname + '/node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: __dirname + '/tsconfig.json',
            },
          },
        ],
      },
    ],
  },
}

module.exports = exportedConfig
