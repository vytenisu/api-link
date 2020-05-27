const webpack = require('webpack')
const LicenseWebpackPlugin = require('license-webpack-plugin')
  .LicenseWebpackPlugin

const exportedConfig = {
  entry: __dirname + '/index.ts',
  devtool: 'inline-source-map',
  plugins: [new LicenseWebpackPlugin()],
  mode: 'development',
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
