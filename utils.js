var passGen = require('password-generator');

module.exports = {
    generatePassword: function () {
        return passGen(24, false);
    }
};