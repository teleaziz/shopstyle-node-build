// TODO: pull from configs
module.exports = {
  framework: 'mocha',
  specs: './client/**/*.e2e.ts',
  baseUrl: 'http://localhost:3000/',
  mochaOpts: {
    reporter: "spec",
    slow: 3000
  }
};
