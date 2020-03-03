import path from 'path';
import { WebpackOptions } from 'webpack/declarations/WebpackOptions';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const config: WebpackOptions = {
  entry: './src/index.ts',
  mode: 'production',
  target: 'web',
  devtool: 'source-map',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'build'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      title: 'Query language',
    }),
  ],
  stats: {
    all: false,
    assets: true,
    excludeAssets: /\.d\.ts/,
    warnings: true,
  },
};

export default config;
