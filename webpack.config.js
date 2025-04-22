const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  mode: 'development',
  entry: {
      app: './src/index.js',
  },
  devtool: 'inline-source-map',
  devServer: {
    static: { directory: path.resolve(__dirname, 'dist') },
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
