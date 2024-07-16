const dbClient = require('../utils/db');

describe('DBClient', () => {
    test('should return true if MongoDB is connected', () => {
        expect(dbClient.isAlive()).toBe(true);
    });

    test('should count number of users', async () => {
        const nbUsers = await dbClient.nbUsers();
        expect(nbUsers).toBeGreaterThanOrEqual(0);
    });

    test('should count number of files', async () => {
        const nbFiles = await dbClient.nbFiles();
        expect(nbFiles).toBeGreaterThanOrEqual(0);
    });
});
