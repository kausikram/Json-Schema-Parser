// Karma configuration
// Generated on Mon Jun 03 2013 12:55:42 GMT+0530 (IST)


// base path, that will be used to resolve files and exclude
basePath = '';


// frameworks to use
frameworks = ['jasmine'];


// list of files / patterns to load in the browser
files = [
    'lib/jquery.js',
    'dynoform/jquery.dynoform.js',
    'json_schema_parser.js',
    'test_reporter.js'
];

preprocessors = {
  'json_schema_parser.js': 'coverage'
};

// list of files to exclude
exclude = [

];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
reporters = ['dots', "junit", 'coverage'];

junitReporter = {
  outputFile: 'test-results.xml'
};

coverageReporter = {
  type : 'cobertura',
  //type : 'html',
  dir : 'coverage/'
};

// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = false;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = ['PhantomJS'];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = true;


// plugins to load
plugins = [
  'karma-jasmine',
  'karma-phantomjs-launcher',
  'karma-junit-reporter',
  'karma-coverage'
];
