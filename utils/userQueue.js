const Queue = require('bull');

const userQueue = new Queue('userQueue', {
    redis: {
        host: '127.0.0.1',
        port: 6379,
    }
});

module.exports = userQueue;
