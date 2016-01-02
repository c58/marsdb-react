'use strict';

module.exports = {
  src: 'lib/**/*',
  dist: 'dist',
  build: 'build',

  browser: {
    bundleName: 'marsdb.react.js',
    bundleMinName: 'marsdb.react.min.js',
    entry: 'index.js',
    entryTests: 'browser_tests.js',
  }
};
