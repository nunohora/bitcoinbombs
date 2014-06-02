define(function (require) {
    'use strict';

    var Backbone    = require('backbone'),
        modal       = require('modal'),
        _           = require('underscore'),
        $           = require('jquery'),
        depositTpl  = require('text!templates/deposit.tpl'),
        withdrawTpl = require('text!templates/withdraw.tpl'),
        noFundsTpl  = require('text!templates/notEnoughFunds.tpl');

    return Backbone.View.extend({

        el: 'body',

        events: {
            'click .bet-type.available .bet' : 'newGame',
            'click .available .step-tile'    : 'step',
            'click a.deposit'                : 'onDepositClick',
            'click a.withdraw'               : 'onWithdrawClick',
            'click a.refresh'                : 'onRefreshClick',
            'click .take-reward.take-it'     : 'onTakeRewardClick',
            'click .withdraw-btn button'     : 'onWithdrawButtonClick'
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

        socketEmit: function (event, data) {
            this.socket.emit(event, JSON.stringify(data));
        },

        bindSocketEvents: function () {
            this.socket.on('newGameResponse', $.proxy(this.onNewGameResponse, this));
            this.socket.on('steppedOnResponse', $.proxy(this.onSteppedOnResponse, this));
            this.socket.on('refreshBalanceResponse', $.proxy(this.updateBalance, this));
            this.socket.on('onDepositModalClickResponse', $.proxy(this.showDepositModal, this));
            this.socket.on('onTakeRewardClickResponse', $.proxy(this.onTakeRewardResponse, this));
            this.socket.on('onwithdrawBalanceResponse', $.proxy(this.onTakeRewardResponse, this));
        },

        onDepositClick: function (e) {
            e.preventDefault();
            this.socketEmit('onDepositModalClick', { url: this.data.url });
        },

        showDepositModal: function (data) {
            this.data.btcAddress = data.btcAddress;

            var tpl = _.template(depositTpl, {
                btcAddress: this.data.btcAddress
            });

            this.showModal(tpl);
        },

        onWithdrawClick: function (e) {
            e.preventDefault();

            var tpl =_.template(withdrawTpl, {
                balance: this.data.balance
            });

            this.showModal(tpl);
        },

        onWithdrawButtonClick: function () {
            var $modal = $('#simplemodal-data'),
                address = $modal.find('.with-address').val(),
                amount = $modal.find('.with-amount').val();

            this.socketEmit('withdrawBalance', { url: this.data.url, address: address, amount: amount });
        },

        onRefreshClick: function (e) {
            e.preventDefault();

            this.refreshBalance();
        },

        onTakeRewardClick: function () {
            if (this.data.gameState) {
                this.socketEmit('takeReward', { url: this.data.url });
            }
        },

        onTakeRewardResponse: function (data) {
            $(this.$stepRows).removeClass('available');
            $(this.$stepRows).find('.take-reward.take-it').removeClass('take-it');

            this.toggleBetTypeClass();
            this.updateBalance(data);

            this.data.gameState = false;
        },

        onwithdrawBalanceResponse: function (data) {
            var $modal = $('#simplemodal-data'),
                $button = $modal.find('.withdraw-btn');

            $button.html('<span>Success!!</span>');

            $modal.find('span.modal-balance').val(data.balance);
            this.updateBalance(data);
        },

        updateBalance: function (data) {
            this.data.balance = data.balance;
            $('.balance').text(data.balance);
        },

        refreshBalance: _.debounce(function () {
            this.socketEmit('refreshBalance', { url: this.data.url });
        }, 1000),

        showModal: function (template) {
            $.modal(template);
        },

        newGame: function (e) {
            var betValue = $(e.target).attr('value');

            if (this.data.balance >= betValue) {
                this.resetGame();

                if (!this.data.gameState) {
                    this.socketEmit('newGame', { betValue: betValue, url: this.data.url });
                }
            }
            else {
                alert('Not enough balance');
            }
        },

        onNewGameResponse: function (data) {
            if (!data.error) {
                this.data.gameState = true;
                this.toggleBetTypeClass();
                this.highlightStepTiles(data.nextStep);
                this.updateBetValue(data.betValue);
                this.updateBalance(data);
            }
            else {
                if (data.error === 'notenoughbalance') {
                    alert('Not enough balance');
                }
                else if (data.error === 'gamestarted') {
                    alert('You are already playing a game');
                }
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
                this.socketEmit('steppedOn', { stepped: stepped, url: this.data.url });
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

            this.data.betValue = betValue;
        }
    });
});