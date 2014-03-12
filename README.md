### Overview

Sample data from the Meteor facts package and pass it to a provider like
CloudWatch.

This is an alpha project and currently CloudWatch is the only provider which
you can find in the providers/cloudwatch.js file.

### Use with AWS CloudWatch

**Environment Variables**
```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-west-1"
```

**server/app.js**
```javascript
  FactsReporting.configure({
    provider: 'CloudWatch',

    // every 1 min is the default
    rate: 60 * 1000
  });
```

### Custom Provider

**server/app.js**
```javascript
  FactsReporting.configure({
    provider: function (facts) {
      // do something fancy
    },

    // every 1 min is the default
    rate: 60 * 1000
  });
```

### Developer Notes

* CloudWatch dimensions are currently InstanceId and NameTag.
* You can also see code in providers/cloudwatch.js for pid, process name and
  hostname, but I found this made looking at the metrics in CloudWatch
  cumbersome. Feedback welcome.
* You can control the CloudWatch namespace with a namespace option but the
  default is "Meteor".

### Contributions

This is an alpha project intended to help me figure out some server issues.
Happy to have contributors, feedback, etc! 
