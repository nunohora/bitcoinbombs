define(function (require) {
    var Backbone = require('backbone'),
        $        = require('jquery');

    return Backbone.View.extend({

        el: 'body',

        events: {
            'click .bet-type.available .bet' : 'newGame',
            'click .available .step-tile'    : 'step'
        },

        initialize: function (options) {
            this.socket = options.socket;
            this.data = this.$el.data().user;

            if (this.data.url) {
                window.history.pushState('bla', 'bla', this.data.url);
            }

            this.bindSocketEvents();
        },

        bindSocketEvents: function () {
            this.socket.on('newGameResponse', $.proxy(this.onNewGameResponse, this));
        },

        newGame: function (e) {
            var betValue = $(e.target).attr('value');

            if (!this.data.gameState) {
                this.socket.emit('newGame', { betValue: betValue, url: this.data.url });
            }
        },

        onNewGameResponse: function (data) {
            if (!data.error) {
                this.toggleBetTypeClass();
                this.highlightStepTiles(data.nextStep);
                this.updateBetValue(data.betValue);
            }
            else {
                alert('You are already playing a game');
            }
        },

        step: function (e) {
            var stepped = $(e.target).index() + 1;
            this.socket.emit('steppedOn', { stepped: stepped, url: this.data.url });
        },

        toggleBetTypeClass: function () {
            var $betType = this.$el.find('.bet-type');
            $($betType).toggleClass('available');
        },

        highlightStepTiles: function (step) {
            var $stepRow = this.$el.find('.step-row')[step - 1];
            $($stepRow).addClass('available');
        },

        updateBetValue: function (betValue) {
            var $betValueNode = this.$el.find('.bet-value');
            $($betValueNode).text(betValue);
        }
    });
});