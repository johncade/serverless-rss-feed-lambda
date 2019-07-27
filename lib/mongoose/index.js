const mongoose = require('mongoose');

mongoose.Promise = Promise;

module.exports = function () {
    /* istanbul ignore if */
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve();
    } else {
        console.log('connecting to ', process.env.MONGO_STRING )
        return mongoose.connect(
            process.env.MONGO_STRING,
            {
                useNewUrlParser: true,
                useCreateIndex: true,
                useFindAndModify: false
            },
        );
    }
};