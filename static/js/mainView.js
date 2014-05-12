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

            this.$betTypeNode = this.$el.find('.bet-type');
            this.$stepRows = this.$el.find('.step-row');

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

            this.resetGame();
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
                this.gameOver(data);
            }
        },

        step: function (e) {
            if (this.data.gameState) {
                var stepped = $(e.target).index();
                this.socket.emit('steppedOn', { stepped: stepped, url: this.data.url });
            }
        },

        displaySteppedOn: function (step, stepped) {
            var $stepRow = $(this.$stepRows)[step - 1],
                $stepTile = $($stepRow).find('.step-tile')[stepped];

            $($stepTile).addClass('stepped');
        },

        displayBombTile: function (bombTile, step) {
            var $stepRow = $(this.$stepRows)[step - 1],
                $bombTile = $($stepRow).find('.step-tile')[bombTile];

            $($bombTile).addClass('bomb');
        },

        displayAllBombTiles: function (bombTiles) {
            var self = this,
                $stepRow,
                $bombTile;

            $.each(bombTiles, function (idx, bomb) {
                $stepRow = self.$stepRows[idx];

                if (!$($stepRow).find('.bomb').length || !$($stepRow).find('.kaboomb').length) {
                    $bombTile = $($stepRow).find('.step-tile')[bomb];

                    $($bombTile).addClass('bomb');
                }
            });
        },

        gameOver: function (data) {
            $(this.$stepRows).removeClass('available');
            $(this.$stepRows).find('.take-reward.take-it').removeClass('take-it');
            
            this.toggleBetTypeClass();
            this.displayKaboomTile(data.stepped, data.bombStep);
            this.displayAllBombTiles(data.bombTiles);
            
            this.data.gameState = false;
        },

        resetGame: function () {
            $(this.$stepRows).find('.bomb').removeClass('bomb');
            $(this.$stepRows).find('.kaboom').removeClass('kaboom');
            $(this.$stepRows).find('.stepped').removeClass('stepped');
        },

        displayKaboomTile: function(stepped, bombStep) {
            var $stepRow = $(this.$stepRows)[bombStep],
                $stepTile = $($stepRow).find('.step-tile')[stepped];
            
            $($stepTile).addClass('kaboom');
        },

        toggleBetTypeClass: function () {
            $(this.$betTypeNode).toggleClass('available');
        },

        highLightCashoutTile: function (step) {
            var $reward = this.$el.find('.take-reward.take-it'),
                $stepRow = this.$el.find('.step-row')[step - 1];

            if($reward) {
                $($reward).removeClass('take-it');
            }
            
            $($stepRow).find('.take-reward').addClass('take-it');
        },

        highlightStepTiles: function (step) {
            $(this.$stepRows).removeClass('available');

            var $stepRow = $(this.$stepRows)[step];
            $($stepRow).addClass('available');
        },

        updateBetValue: function (betValue) {
            var $betValueNode = this.$el.find('.bet-value');
            $($betValueNode).text(betValue);
        }
    });
});