const { MongoClient } = require('mongodb');

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}/${database}`;

        this.client = new MongoClient(url, { useUnifiedTopology: true });
        this.client.connect();
        this.database = this.client.db(database);

        this.users = this.database.collection('users');
        this.files = this.database.collection('files');
    }

    isAlive() {
        return this.client.isConnected();
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
