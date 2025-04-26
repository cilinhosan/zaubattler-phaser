const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: [ // Serve from both dist and assets
        { directory: path.resolve(__dirname, 'dist') },
        // Serve original assets folder directly in dev mode
        { directory: path.resolve(__dirname, 'assets'), publicPath: '/assets' },
    ],
    hot: true,
  },
  output: {
    filename: '[name].bundle.js', // Simple name for dev
    publicPath: '/', // Use root public path for dev server
  },
});