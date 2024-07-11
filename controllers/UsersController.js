const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const crypto = require('crypto');

class UsersController {
    async postNew(req, res) {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }
        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        const existingUser = await dbClient.users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Already exist' });
        }

        try {
            const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

            const result = await dbClient.users.insertOne({
                email,
                password: hashedPassword,
            });

            return res.status(201).json({
                id: result.insertedId,
                email,
            });
        } catch (err) {
            console.error('Error creating user:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    async getMe(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const key = `auth_${token}`;
        const userId = await redisClient.get(key);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await dbClient.users.findOne({ _id: dbClient.ObjectId(userId) });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        return res.status(200).json({
            id: user._id,
            email: user.email,
        });
    }
}

module.exports = new UsersController();
