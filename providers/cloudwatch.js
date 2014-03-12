var Fiber = Npm.require('fibers');
var Future = Npm.require('fibers/future');
var AWS = Npm.require('aws-sdk');
var os = Npm.require('os');

CloudWatchReporter = function () {};

CloudWatchReporter.prototype = {
  report: function (facts) {
    this.putMetricData(facts);
  },

  dimensions: function () {
    /*
    var dimensions = [{
      Name: 'InstanceId',
      Value: String(this.instanceId())
    }, {
      Name: 'NameTag',
      Value: String(this.instanceNameTag())
    }, {
      Name: 'Pid',
      Value: String(this.pid())
    }, {
      Name: 'Process',
      Value: String(this.ptitle())
    }, {
      Name: 'HostName',
      Value: String(this.hostname())
    }];
    */

   // keep it simple for now
    var dimensions = [{
      Name: 'InstanceId',
      Value: String(this.instanceId())
    }, {
      Name: 'NameTag',
      Value: String(this.instanceNameTag())
    }];

    return dimensions;
  },

  // facts =>
  //  {
  //    "mongo-livedata.metric1": 1,
  //    "mongo-livedata.metric2": 2
  //    ...
  //  }
  putMetricData: function (facts) {
    var timestamp = new Date;
    var unit = 'Count';

    var metricData = [];
    var dimensions = this.dimensions();
    
    facts = FactsReporting.flattenFacts(facts);

    _.each(facts, function (value, key) {
      metricData.push({
        MetricName: key,
        Value: String(value),
        Dimensions: dimensions,
        Timestamp: timestamp,
        Unit: unit
      });
    });

    if (metricData.length == 0)
      return;

    var params = {
      Namespace: this.namespace(),
      MetricData: metricData
    };

    var future = new Future;
    var cloudwatch = new AWS.CloudWatch;

    cloudwatch.putMetricData(params, function (err, res) {
      if (err) {
        Log.error('CloudWatch Error: ' + String(err));
      } else {
        Log.info('CloudWatch metrics successfully reported');
      }

      future.return();
    });
    
    return future.wait();
  },

  namespace: function () {
    return FactsReporting.options.namespace || 'Meteor';
  },

  instanceId: function () {
    var url = 'http://169.254.169.254/latest/meta-data/instance-id';

    try {
      return HTTP.get(url).content;
    } catch (e) {
      Log.error('Error getting instanceId: ' + String(e));
      return null;
    }
  },

  instanceTags: function () {
    var ec2 = new AWS.EC2;
    var future = new Future;
    ec2.describeTags({
      Filters: [{
        Name: 'resource-id',
        Values: [this.instanceId()]
      }]
    }, function (err, data) {
      if (err)
        future.throw(err);
      else {
        future.return(data.Tags);
      }
    });
    return future.wait();
  },

  instanceTagValue: function (key) {
    var tags = this.instanceTags();
    var tag = _.findWhere(tags, {Key: key});
    return tag && tag.Value;
  },

  instanceNameTag: function () {
    return this.instanceTagValue('Name');
  },

  pid: function () {
    return process.pid;
  },

  ptitle: function () {
    return process.title;
  },

  hostname: function () {
    return os.hostname();
  }
};

FactsReporting.providers.CloudWatch = CloudWatchReporter;
