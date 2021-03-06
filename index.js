require('coffee-script/register');

/**
 * Main entrypoint
 *
 * @todo plugin support
 */
module.exports = function SSBuild (config) {

  this.config = config;

  // TODO: pass in config to webpack and karma? necessary?
  this.webpack = function () {
    return require('./webpack.config.js');
  };

  this.karma = function () {
    return require('./karma.config.js');
  };

  this.protractor = function () {
    return require('./protractor.config.js');
  };

  this.gulp = function (gulp) {
    var taskPlugins = require('require-dir')('./build/tasks');
    for (var key in taskPlugins) {
      taskPlugins[key](gulp, config);
    }
  }
};
