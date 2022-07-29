module.exports = {
  context: __dirname + '/app',
  entry: {
    'index/' : './entry.js'
  },
  output: {
    path: __dirname + '/public/javascripts',
    filename: '[name]bundle.js'
  },
  mode: 'none',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }]
  },
  target: 'web',
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "path": require.resolve("path-browserify"),
      "zlib": require.resolve("browserify-zlib"),
      "stream": require.resolve("stream-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "url": require.resolve("url/"),
      "querystring": require.resolve("querystring-es3"),
      "timers": require.resolve("timers-browserify"),
      "assert": require.resolve("assert/"),
      "buffer": require.resolve("buffer/"),
      "util": require.resolve("util/"),
      "os": require.resolve("os-browserify/browser")
    }
  }
};