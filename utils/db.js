const { MongoClient } = require('mongodb');

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}`;

        this.client = new MongoClient(url, { useUnifiedTopology: true });
        this.client.connect();
        this.database = this.client.db(database);
    }

    isAlive() {
        this.client.isConnected();
    }

    async nbUsers() {
        return this.database.collection('users').countDocuments();
    }

    async nbFiles() {
        return this.database.collection('files').countDocuments();
    }
}

const dbClient = new DBClient();
module.exports = dbClient;
