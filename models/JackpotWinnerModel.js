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
            userId: { type: Number, required: true },
            when: { type: Date, default: Date.now },
            amount: { type: Number, default: 0 }
        });

        this.JackpotWinnerModel = mongoose.model('JackpotWinner', WinnerSchema);
    }
};