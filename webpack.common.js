const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin'); // Import ManifestPlugin
const CopyPlugin = require('copy-webpack-plugin'); // Import CopyPlugin

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
        // generator.filename removed - will be set in dev/prod configs
      },
      { // Add rule for audio files
        test: /\.(mp3|ogg|wav)$/i,
        type: 'asset/resource',
        // generator.filename removed - will be set in dev/prod configs
      },
    ],
  },
  plugins: [
        new HtmlWebpackPlugin({
          title: 'Zaubattler',
          favicon: 'assets/elzette_illustration_face_icon.png' // Add this line
        }),
        // Add ManifestPlugin here
        new WebpackManifestPlugin({
            fileName: 'assets/asset-manifest.json', // Fixed manifest filename
            publicPath: '/', // Use root path as default, dev/prod configs might override output.publicPath
            // No need for basePath or map usually
            filter: (file) => !file.name.endsWith('.map'), // Exclude source maps from manifest
            // Generate manifest based on emitted assets (works for both dev and prod)
            generate: (seed, files, entrypoints) => {
                const manifestFiles = files.reduce((manifest, file) => {
                    // Use file.chunk?.name to potentially group by entry point if needed later
                    // Use file.path for the final hashed path
                    // Use file.name as the key (should be the source path relative to context)
                    // Normalize keys: remove potential leading './' and use forward slashes
                    const name = file.name.replace(/^\.\//, '').replace(/\\/g, '/');
                    manifest[name] = file.path;
                    return manifest;
                }, seed);
                return manifestFiles;
            }
        }),
        // Add CopyPlugin to copy the _headers file
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'public', '_headers'), // Absolute path to source
                    to: path.resolve(__dirname, 'dist'), // Absolute path to destination root
                    // Alternatively, using relative paths (relative to context, which is project root by default):
                    // from: 'public/_headers',
                    // to: '.', // '.' means the root of the output directory ('dist')
                },
            ],
        }),
      ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Clean the dist folder before each build
    // publicPath will be set in dev/prod configs
  },
};