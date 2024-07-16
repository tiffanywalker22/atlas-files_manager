const redisClient = require('../utils/redis');

describe('RedisClient', () => {
    beforeAll(() => {
        redisClient.client.flushall();
    });

    afterAll(() => {
        redisClient.client.quit();
    });

    test('should return true if Redis is connected', () => {
        expect(redisClient.isAlive()).toBe(true);
    });

    test('should set and get a key-value pair', async () => {
        await redisClient.set('test_key', 'test_value', 10);
        const value = await redisClient.get('test_key');
        expect(value).toBe('test_value');
    });

    test('should delete a key', async () => {
        await redisClient.set('test_key', 'test_value', 10);
        await redisClient.del('test_key');
        const value = await redisClient.get('test_key');
        expect(value).toBeNull();
    });
});
