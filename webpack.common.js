const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
      app: './src/index.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // Consider MiniCssExtractPlugin for production
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
           // Output assets to dist/assets in production, handled by asset/resource
           // For dev server, they are served directly
           filename: 'assets/[hash][ext][query]'
        }
      },
    ],
  },
  plugins: [
        new HtmlWebpackPlugin({
          title: 'Zaubattler',
        }),
      ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Clean the dist folder before each build
  },
};