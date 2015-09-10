# TODO: move to typescirpt
# TODO: move to sub plugin
# TODO: make global with slush
_ = require 'lodash'
str = require 'underscore.string'
chalk = require 'chalk'
path = require 'path'
inquirer = require 'inquirer'
runSequence = require 'run-sequence'
fs = require 'fs'
$ = require('gulp-load-plugins')()
expect = require('chai').expect
argv = require('yargs').argv

# TODO: open source this
# TODO: default
# TODO: install command for installing preconfigured templates by others
# TODO: base template options as constructor options
# TODO: skip any prmopt if included by argv (wrap inquirer.prompt)
class Generate
  constructor: (@options) ->
    expect(@options).to.have.property('templatesPath').that.is.a 'string'
    expect(@options).to.have.property('gulp').that.is.an 'object'

    @gulp = @options.gulp

    _.defaults @options,
      taskName: 'generate'

    @templateNames = fs.readdirSync @options.templatesPath

    @createTemplateCommands()
    @createGenerateCommand()

  createGenerateCommand: ->
    @gulp.task @options.taskName, (done) =>
      inquirer.prompt [
        type: 'list'
        name: 'type'
        message: 'What do you want to generate?'
        choices: (@templateNames or []).map (name) ->
          name: name
          value: name
      ], (answers) ->
        runSequence "generate:#{answers.type}", done

  defaultNamePromptConfig: (humanTemplateName) ->
    message: "What do you want to call your #{humanTemplateName.toLowerCase()}?"
    type: 'prompt'
    name: 'name'
    validate: (input) ->
      # Only allow word characters, -, _, spaces
      unless input.trim().match /^[\w\d\s]+$/
        return "Name must contain only a-z, 0-9, -, _, and spaces"
      true

  createTemplateCommands: ->
    for templateName in @templateNames
      @createTemplateCommand templateName

  createTemplateCommand: (templateName) ->
    @gulp.task "#{@options.taskName}:#{templateName}", (done) =>

      # Allows for _config.json, _config.js, _config.coffee, etc
      config = require path.join process.cwd(), @options.templatesPath, templateName, '_config'
      expect(config).to.have.property('outputDir').that.is.a 'string'

      prompts = config.prompts or []
      humanName = str.humanize templateName

      unless config.promptForName is false
        prompts.unshift @defaultNamePromptConfig humanName

      # TODO: handle 'true', 'false' -> true, false for --foo=true, etc
      prompts = prompts.filter (prompt) ->
        return not Boolean argv[prompt.name]

      inquirer.prompt prompts, (answers = {}) =>
        _.extend answers, argv
        { name } = answers

        if name
          _.extend answers,
            camelName: str.camelize name
            dashName: str.dasherize name
            className: str.classify name
            humanName: str.humanize name
            titleName: str.titleize str.humanize name

        outputPath = path.join process.cwd(), config.outputDir
        outputDir = _.template(outputPath) answers

        src = path.join process.cwd(), @options.templatesPath, templateName, '*'

        @gulp
          .src [ src, '!**/_config.*' ]
          .pipe $.template answers
          .pipe $.rename (path) ->
            path.basename = _.template(path.basename) answers
            path
          .pipe $.conflict outputDir
          .pipe @gulp.dest outputDir
          .on 'end', =>
            done()
            console.info "#{answers.titleName} #{templateName} created"
          .resume()

module.exports = (gulp, config) ->
  new Generate
    config: config
    gulp: gulp
    templatesPath: path.join __dirname, '../templates'
