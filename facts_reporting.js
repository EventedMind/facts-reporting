var DEFAULT_SAMPLING_RATE = 1000 * 60; // every 1 min
var Fiber = Npm.require('fibers');

Log.outputFormat = 'colored-text';

FactsReporting = {
  isRunning: false,

  options: {},

  configure: function (opts) {
    var options = this.options = this.options || {};
    _.extend(options, opts);

    if (opts.provider)
      this.setProvider(opts.provider);

    return this;
  },

  setProvider: function (provider) {
    var fn;
    var inst;

    if (_.isString(provider)) {
      fn = FactsReporting.providers[provider];
    } else if (_.isFunction(provider)) {
      fn = provider;
    } 

    if (!fn) {
      throw new Error('FactsReporting: Unable to setProvider with ' + EJSON.stringify(provider));
    }

    this._provider = fn;
    return this;
  },

  run: function () {
    var self = this;

    if (this.isRunning) {
      Log.warn('<facts-reporting> Already running.');
      return;
    }

    this.isRunning = true;

    Log.warn('<facts-reporting> Running FactsReporting scheduler');
    Fiber(function () {
      self._intervalId = Meteor.setInterval(function () {
        if (!self.isRunning) {
          Log.warn('<facts-reporting> Called FactsReporting is not running');
          return;
        }
        Log.info('<facts-reporting> Reporting facts');
        self._provider(self.facts());
      }, self.samplingRate());
    }).run();
  },

  stop: function () {
    this.isRunning = false;

    if (this._intervalId) {
      Meteor.clearInterval(this._intervalId);
      this._intervalId = null;
    }
  },

  samplingRate: function () {
    var env = process.env;
    return env.FACTS_REPORTING_SAMPLE_RATE ||
      this.options.rate ||
      DEFAULT_SAMPLING_RATE;
  },

  facts: function () {
    if (!Facts._factsByPackage)
      throw new Error("Facts._factsByPackage not defined. Probably because it's on devel branch of Meteor");
    var facts = EJSON.clone(Facts._factsByPackage);
    return facts;
  },


  /**
   * Given:
   *   {
   *     "mongo-livedata": {
   *       fact1: 1,
   *       fact2: 1
   *     }
   *   }
   *
   * Return:
   *   {
   *    'mongo-livedata.fact1': 1,
   *    'mongo-livedata.fact2': 2
   *   }
   *
   */

  flattenFacts: function () {
    var facts = this.facts();
    var result = {};
    _.each(facts, function (facts, packageName) {
      _.each(facts, function (value, name) {
        result[packageName + '.' + name] = value;
      });
    });
    return result;
  },

  _provider: function (facts) {
    Log.warn("facts-reporting warning: looks like you haven't set a provider. Try FactsReporting.configure({provider: 'CloudWatch'})");
  }
};

FactsReporting.providers = {};

Meteor.startup(function () {
  Meteor.defer(function () {
    if (FactsReporting.options.autoRun !== false)
      FactsReporting.run();
    else
      Log.warn('<facts-reporting> autoRun is false so not starting automatically');
  });
});
