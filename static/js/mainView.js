define(function (require) {
    var Backbone = require('backbone'),
        $        = require('jquery');

    return Backbone.View.extend({

        el: 'body',

        // events: {
        //     'click .'
        // },

        initialize: function (options) {
            var data = this.$el.data();

            if (data) {
                window.history.pushState('bla', 'bla', data.user.url);
            }
        }

    });
});