var mongoose = require('mongoose');

module.exports = {
    JackpotWinnerModel: null,

    initialize: function (connection) {
        this.createWinnerSchema();
    },

    getUserModel: function () {
        return this.UserModel;
    },

    createWinnerSchema: function () {
        var WinnerSchema;

        WinnerSchema = new mongoose.Schema({
            userId: { type: Number, required: true },
            when: { type: Date, default: Date.now },
            amount: { type: Number, default: 0 }
        });

        this.WinnerSchema = mongoose.model('JackpotWinner', WinnerSchema);
    }
};