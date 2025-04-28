const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
// WebpackManifestPlugin is now in common.js, no need to import or configure here

module.exports = merge(common, {
  mode: 'production',
  // devtool: 'source-map', // Optional: for production debugging
  // plugins array removed - ManifestPlugin is in common.js
  output: {
    filename: '[name].[contenthash].bundle.js', // Use contenthash for JS caching
    publicPath: '/', // Use root path for assets
    // Use contenthash for asset caching in production
    assetModuleFilename: 'assets/[contenthash][ext][query]'
  },
  // Add optimization options if needed
  // optimization: {
  //   minimize: true,
  // },
});