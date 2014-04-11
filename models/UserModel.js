var bcrypt        = require('bcrypt'),
    autoIncrement = require('mongoose-auto-increment'),
    mongoose      = require('mongoose'),
    SALT_WORK_FACTOR = 10;

module.exports = {
    UserModel: null,

    initialize: function (connection) {
        autoIncrement.initialize(connection);
        this.createUserSchema();
    },

    getUserModel: function () {
        return this.UserModel;
    },

    createUserSchema: function () {
        var UserSchema;

        UserSchema = new mongoose.Schema({
            userId: { type: Number, required: true },
            btcAddress: { type: String, index: { unique: true } },
            password: { type: String, required: true }
        });

        UserSchema.pre('save', function(next) {
            var user = this;

            // only hash the password if it has been modified (or is new)
            if (!user.isModified('password')) return next();

            // generate a salt
            bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
                if (err) return next(err);

                // hash the password using our new salt
                bcrypt.hash(user.password, salt, function(err, hash) {
                    if (err) return next(err);

                    // override the cleartext password with the hashed one
                    user.password = hash;
                    next();
                });
            });
        });

        UserSchema.methods.comparePassword = function(candidatePassword, cb) {
            bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
                if (err) {
                    console.log('errporrrr: ', err);
                    return cb(err);
                }

                cb(null, isMatch);
            });
        };

        UserSchema.statics.getAuthenticated = function(userId, password, cb) {
            this.findOne({ userId: userId }, function(err, user) {
                console.log('user: ', user);
                if (err) {
                    console.log('error1: ', err);
                    return cb(err);
                }

                // make sure the user exists
                if (!user) {
                    console.log('error2: ', 'no user');
                    return cb(true, null);
                }

                // test for a matching password
                user.comparePassword(password, function(err, isMatch) {
                    if (err) {
                        console.log('error3: ', err);
                        return cb(err);
                    }

                    // check if the password was a match
                    if (isMatch) {
                        return cb(false, user);
                    }
                });
            });
        };

        UserSchema.plugin(autoIncrement.plugin, {
            model: 'User',
            field: 'userId',
            startAt: 1000
        });

        this.UserModel = mongoose.model('User', UserSchema);
    }
}