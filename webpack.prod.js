const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = merge(common, {
  mode: 'production',
  // devtool: 'source-map', // Optional: for production debugging
  plugins: [
    new CopyPlugin({
        patterns: [
            // Copy assets that are NOT directly imported/required by JS/CSS
            // asset/resource handles imported assets automatically
            { from: "./assets", to: "assets", globOptions: { ignore: ["**/.*"] } }, // Copy everything from assets to dist/assets
        ],
    }),
  ],
  output: {
    filename: '[name].[contenthash].bundle.js', // Use contenthash for caching
    publicPath: '/', // Use root path for assets
  },
  // Add optimization options if needed
  // optimization: {
  //   minimize: true,
  // },
});