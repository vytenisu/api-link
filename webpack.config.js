const webpack = require('webpack')
const LicenseWebpackPlugin = require('license-webpack-plugin')
  .LicenseWebpackPlugin
const NpmDtsPlugin = require('npm-dts-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

const exportedConfig = {
  entry: __dirname + '/index.ts',
  devtool: 'source-map',
  optimization: {
    minimize: true,
  },
  mode: 'production',
  target: 'node',
  externals: [
    nodeExternals({
      whitelist: [
        'param-case',
        'tslib',
        'dot-case',
        'no-case',
        'lower-case',
        'node-fetch',
      ],
    }),
  ],
  plugins: [new LicenseWebpackPlugin(), new NpmDtsPlugin()],
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
  },
  output: {
    path: __dirname + '/dist',
    filename: 'node.js',
    sourceMapFilename: 'node.js.map',
    libraryTarget: 'umd',
    library: 'ApiLink',
    globalObject: 'global',
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
