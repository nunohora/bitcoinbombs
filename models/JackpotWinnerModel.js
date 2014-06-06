var mongoose = require('mongoose');

module.exports = {
    JackpotWinnerModel: null,

    initialize: function (connection) {
        this.createWinnerSchema();
    },

    getModel: function () {
        return this.JackpotWinnerModel;
    },

    createWinnerSchema: function () {
        var WinnerSchema = new mongoose.Schema({
            userId: Number,
            when: Date,
            amount: Number
        });

        this.JackpotWinnerModel = mongoose.model('JackpotWinner', WinnerSchema);
    }
};