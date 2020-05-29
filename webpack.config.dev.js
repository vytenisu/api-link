const webpack = require('webpack')
const LicenseWebpackPlugin = require('license-webpack-plugin')
  .LicenseWebpackPlugin
const nodeExternals = require('webpack-node-externals')

const exportedConfig = {
  entry: __dirname + '/index.ts',
  devtool: 'inline-source-map',
  plugins: [new LicenseWebpackPlugin()],
  mode: 'development',
  target: 'node',
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
    filename: 'node.js',
    sourceMapFilename: 'node.js.map',
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
