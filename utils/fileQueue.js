const Bull = require('bull');

const fileQueue = new Bull('fileQueue');

fileQueue.process('fileQueue', (job, done) => {
    console.log('Processing job:', job.data);
    done();
});

module.exports = fileQueue;
