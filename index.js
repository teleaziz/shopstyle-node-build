require('steve8708-typescript-register');
require('coffee-script/register');

/**
 * Main entrypoint
 *
 * @todo plugin support
 */
module.exports = function SSBuild (config) {

  // TODO: load plugins
  // TODO: pass config into each
  this.gulp = require('./gulpfile.js');

  // TODO: pass in webpack and karma? necessary?
  this.webpack = require('./webpack.config.js');
  this.karma = require('./karma.config.js');
  this.protractor = require('./protractor.config.js');

  this.gulp = function (gulp) {
    var taskPlugins = require('require-dir')('./build/tasks');
    for (var key in taskPlugins) {
      taskPlugins[key](gulp, config);
    }
  }
};
