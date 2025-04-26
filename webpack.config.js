const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: {
      app: './src/index.js',
  },
  devtool: 'inline-source-map',
  devServer: {
    static: [ // Serve from both dist and assets
        { directory: path.resolve(__dirname, 'dist') },
        { directory: path.resolve(__dirname, 'assets'), publicPath: '/assets' }, // Serve assets under /assets path
    ],
    hot: true,
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
        new HtmlWebpackPlugin({
          title: 'Zaubattler', // Updated title
        }),
      ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'auto', // Use 'auto' publicPath
    clean: true, // Use built-in clean option
  },
};
