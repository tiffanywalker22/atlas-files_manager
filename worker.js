const fileQueue = require('../utils/fileQueue');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const dbClient = require('../utils/db');

fileQueue.process(async (job) => {
    const { userId, fileId } = job.data;

    if (!fileId) {
        throw new Error('Missing fileId');
    }

    if (!userId) {
        throw new Error('Missing userId');
    }

    const file = await dbClient.files.findOne({ _id: dbClient.ObjectId(fileId), userId: dbClient.ObjectId(userId) });

    if (!file) {
        throw new Error('File not found');
    }

    const sizes = [100, 250, 500];
    const filePath = file.localPath;

    for (const size of sizes) {
        const options = { width: size };
        const thumbnail = await imageThumbnail(filePath, options);
        const thumbnailPath = `${filePath}_${size}`;
        await fs.writeFile(thumbnailPath, thumbnail);
    }
});
