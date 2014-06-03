var mongoose = require('mongoose');

module.exports = {
    JackpotValueModel: null,

    initialize: function (connection) {
        this.createJackpotSchema();
    },

    getModel: function () {
        return this.JackpotValueModel;
    },

    createJackpotSchema: function () {
        var JackpotSchema = new mongoose.Schema({
            accumulatedAmount: { type: Number, default: 0 }
        });

        this.JackpotValueModel = mongoose.model('JackpotValue', JackpotSchema);
    }
};