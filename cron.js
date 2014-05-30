var CronJob = require('cron').CronJob,
    db      = require('./db');

module.exports = {

    dayInSeconds: 86400000,

    initialize: function () {
        var self = this,
            job;

        job = new CronJob('* * * * * *', function () {
            db.removeDeadUsers();
        }, null, true);
    }
};