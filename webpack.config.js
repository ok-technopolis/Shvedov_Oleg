const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: './src/js/app.js',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, './public/dist/js')
  }
};
