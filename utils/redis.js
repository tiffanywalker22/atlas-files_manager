const Redis = require('redis');
const { promisify } = require('util')

class RedisClient {
    constructor() {
        this.client = Redis.createClient();
        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });
    }
    isAlive() {
        return this.client.connected;
    }

    async get(key) {
        const get_Key = promisify(this.client.get).bind(this.client);
        return (get_Key(key));
    }


    async set(key, value, durationInSeconds) {
        const set_Key = promisify(this.client.set).bind(this.client);
        return (set_Key(key, value,'EX', durationInSeconds));
    }

    async del(key) {
        const del_Key = promisify(this.client.del).bind(this.client);
        return (del_Key(key));
    }
}
const redisClient = new RedisClient();
module.exports = redisClient;
