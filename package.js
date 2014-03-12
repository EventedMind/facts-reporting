Package.describe({
  summary: 'Pluggable reporting for Meteor facts data'
});

Npm.depends({
  'aws-sdk': '2.0.0-rc11'
});

Package.on_use(function (api) {
  api.use('facts');
  api.use('ejson');
  api.use('underscore');
  api.use('mongo-livedata');
  api.use('http');
  api.use('logging');

  // reporting
  api.add_files('facts_reporting.js', 'server');

  // providers
  api.add_files('providers/cloudwatch.js', 'server');

  //exports
  api.export('FactsReporting', 'server');
});
