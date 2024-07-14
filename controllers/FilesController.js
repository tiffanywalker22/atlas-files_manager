const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const mime = require('mime-types');

class FilesController {
    async postUpload(req, res) {
        const { name, type, parentId = '0', isPublic = false, data } = req.body;
        const token = req.headers['x-token'];

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        const validTypes = ['folder', 'file', 'image'];
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({ error: 'Missing or invalid type' });
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        try {
            const key = `auth_${token}`;
            const userId = await redisClient.get(key);

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            if (parentId !== '0') {
                const parentFile = await dbClient.files.findOne({ _id: dbClient.ObjectId(parentId) });

                if (!parentFile) {
                    return res.status(400).json({ error: 'Parent not found' });
                }

                if (parentFile.type !== 'folder') {
                    return res.status(400).json({ error: 'Parent is not a folder' });
                }
            }

            const fileDocument = {
                userId: dbClient.ObjectId(userId),
                name,
                type,
                parentId: parentId !== '0' ? dbClient.ObjectId(parentId) : 0,
                isPublic,
            };

            if (type !== 'folder') {
                const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
                const filePath = path.join(folderPath, `${uuidv4()}`);

                await fs.writeFile(filePath, Buffer.from(data, 'base64'));

                fileDocument.localPath = filePath;
            }

            const result = await dbClient.files.insertOne(fileDocument);

            return res.status(201).json({
                id: result.insertedId,
                userId: fileDocument.userId,
                name: fileDocument.name,
                type: fileDocument.type,
                parentId: parentId !== '0' ? parentId : 0,
                isPublic: fileDocument.isPublic,
                localPath: fileDocument.localPath,
            });
        } catch (err) {
            console.error('Error uploading file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getShow(req, res) {
        const fileId = req.params.id;
        const token = req.headers['x-token'];

        try {
            const key = `auth_${token}`;
            const userId = await redisClient.get(key);

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const file = await dbClient.files.findOne({ _id: dbClient.ObjectId(fileId), userId: dbClient.ObjectId(userId) });

            if (!file) {
                return res.status(404).json({ error: 'File not found' });
            }

            return res.json(file);
        } catch (err) {
            console.error('Error retrieving file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getIndex(req, res) {
        const token = req.headers['x-token'];
        const parentId = req.query.parentId || '0';
        const page = parseInt(req.query.page, 10) || 0;
        const pageSize = 20;

        try {
            const key = `auth_${token}`;
            const userId = await redisClient.get(key);

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const pipeline = [
                { $match: { userId: dbClient.ObjectId(userId), parentId: dbClient.ObjectId(parentId) } },
                { $skip: page * pageSize },
                { $limit: pageSize }
            ];

            const files = await dbClient.files.aggregate(pipeline).toArray();

            return res.json(files);
        } catch (err) {
            console.error('Error retrieving files:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async putPublish(req, res) {
        const fileId = req.params.id;
        const token = req.headers['x-token'];

        try {
            const key = `auth_${token}`;
            const userId = await redisClient.get(key);

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const file = await dbClient.files.findOneAndUpdate(
                { _id: dbClient.ObjectId(fileId), userId: dbClient.ObjectId(userId) },
                { $set: { isPublic: true } },
                { returnOriginal: false }
            );

            if (!file.value) {
                return res.status(404).json({ error: 'File not found' });
            }

            return res.status(200).json(file.value);
        } catch (err) {
            console.error('Error publishing file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async putUnpublish(req, res) {
        const fileId = req.params.id;
        const token = req.headers['x-token'];

        try {
            const key = `auth_${token}`;
            const userId = await redisClient.get(key);

            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const file = await dbClient.files.findOneAndUpdate(
                { _id: dbClient.ObjectId(fileId), userId: dbClient.ObjectId(userId) },
                { $set: { isPublic: false } },
                { returnOriginal: false }
            );

            if (!file.value) {
                return res.status(404).json({ error: 'File not found' });
            }

            return res.status(200).json(file.value);
        } catch (err) {
            console.error('Error unpublishing file:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    async getFile(req, res) {
        const fileId = req.params.id;
        const token = req.headers['x-token'] || null;

        try {
            const file = await dbClient.files.findOne({ _id: dbClient.ObjectId(fileId) });

            if (!file) {
                return res.status(404).json({ error: 'Not found' });
            }

            const key = token ? `auth_${token}` : null;
            const userId = token ? await redisClient.get(key) : null;

            if (file.isPublic === false && (!userId || userId.toString() !== file.userId.toString())) {
                return res.status(404).json({ error: 'Not found' });
            }

            if (file.type === 'folder') {
                return res.status(400).json({ error: "A folder doesn't have content" });
            }

            if (!file.localPath || !(await fs.access(file.localPath).then(() => true).catch(() => false))) {
                return res.status(404).json({ error: 'Not found' });
            }

            const fileContent = await fs.readFile(file.localPath);
            const mimeType = mime.lookup(file.name) || 'application/octet-stream';

            res.setHeader('Content-Type', mimeType);
            return res.send(fileContent);
        } catch (err) {
            console.error('Error getting file content:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = new FilesController();
