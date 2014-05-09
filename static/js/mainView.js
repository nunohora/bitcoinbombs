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
            this.socket.on('steppedOnResponse', $.proxy(this.onSteppedOnResponse, this));
        },

        newGame: function (e) {
            var betValue = $(e.target).attr('value');

            if (!this.data.gameState) {
                this.socket.emit('newGame', { betValue: betValue, url: this.data.url });
            }
        },

        onNewGameResponse: function (data) {
            if (!data.error) {
                this.data.gameState = true;
                this.toggleBetTypeClass();
                this.highlightStepTiles(data.nextStep);
                this.updateBetValue(data.betValue);
            }
            else {
                alert('You are already playing a game');
            }
        },

        onSteppedOnResponse: function (data) {
            if (data.status !== 'gameOver') {
                this.displaySteppedOn(data.nextStep, data.stepped);
                this.highlightStepTiles(data.nextStep);
                this.displayBombTile(data.bombTile, data.nextStep);
                this.highLightCashoutTile(data.nextStep);
            }
            else {
                this.gameOver(data.bombTiles);
            }
        },

        displaySteppedOn: function (step, stepped) {
            var $stepRow = this.$el.find('.step-row')[step - 1],
                $stepTile = $($stepRow).find('.step-tile')[stepped];

            $($stepTile).addClass('stepped');
        },

        displayBombTile: function (bombTile, step) {
            var $stepRow = this.$el.find('.step-row')[step - 1],
                $bombTile = $($stepRow).find('.step-tile')[bombTile];

            $($bombTile).addClass('bomb');
        },

        displayAllBombTiles: function (bombTiles) {
            var $stepRows = this.$el.find('.step-row'),
                $stepRow,
                $bombTile;

            $.each(bombTiles, function (idx, bomb) {
                $stepRow = $stepRows[idx];

                if (!$($stepRow).find('.bomb').length || !$($stepRow).find('.kaboomb').length) {
                    $bombTile = $($stepRow).find('.step-tile')[bomb];

                    console.log($bombTile);
                    $($bombTile).addClass('bomb');
                }
            });
        },

        gameOver: function (bombTiles) {
            this.data.gameState = false;
            this.displayAllBombTiles(bombTiles);
            alert('Game Over');
        },

        step: function (e) {
            if (this.data.gameState) {
                var stepped = $(e.target).index();
                this.socket.emit('steppedOn', { stepped: stepped, url: this.data.url });
            }
        },

        toggleBetTypeClass: function () {
            var $betType = this.$el.find('.bet-type');
            $($betType).toggleClass('available');
        },

        highLightCashoutTile: function (step) {
            var $reward = this.$el.find('.take-reward.take-it'),
                $stepRow = this.$el.find('.step-row')[step];

            if($reward) {
                $($reward).removeClass('take-it');
            }
            
            $($stepRow).find('.take-reward').addClass('take-it');
        },

        highlightStepTiles: function (step) {
            this.$el.find('.step-row.available').removeClass('available');

            var $stepRow = this.$el.find('.step-row')[step];
            $($stepRow).addClass('available');
        },

        updateBetValue: function (betValue) {
            var $betValueNode = this.$el.find('.bet-value');
            $($betValueNode).text(betValue);
        }
    });
});