const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const isProduction = process.env.NODE_ENV == 'production';

const config = {
  entry: {
    game: '/src/ts/Game.ts',
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'js/[name].bundle.js',
    publicPath: './',
    assetModuleFilename: (pathData) => {
      const filepath = path.dirname(pathData.filename).split("/").slice(1).join("/");
      return `${filepath}/[name].[hash][ext][query]`;
    },
    clean: true,
  },
  devtool: "source-map",
  devServer: {
    open: true,
    host: 'localhost',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      scriptLoading: 'module',
      hash: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.css$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
        exclude: [/favicon\.svg$/i],
      },
      {
        test: /favicon\.svg$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '...'],
    alias: {
      "@assets": '/src/assets',
      "@css": '/src/css/',
      "@lib": '/src/ts/lib',
    },
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
    config.plugins.push(new MiniCssExtractPlugin({
      filename: 'css/game.bundle.css',
    }));
  } else {
    config.mode = 'development';
  }
  return config;
};