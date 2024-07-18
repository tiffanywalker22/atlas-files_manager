const { MongoClient } = require('mongodb');

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 27017;
        const database = process.env.DB_DATABASE || 'files_manager';
        const url = `mongodb://${host}:${port}/${database}`;
        const connection = 'mongodb+srv://test:lotek@newcluster.zl8fpnr.mongodb.net/?retryWrites=true&w=majority&appName=newcluster';

        this.client = new MongoClient(connection, { useUnifiedTopology: true, useNewUrlParser: true });
        this.users = null;
        this.connect();
    }

    async connect() {
        try {
            await this.client.connect();
            this.database = this.client.db('files_manager');
            this.users = this.database.collection('users');
            this.files = this.database.collection('files');
        } catch(error) {
            console.error(error);
        }
    }

    isAlive() {
        try {
        return this.client.isConnected();
        } catch(error) {
            console.error(error);
        }
    }

    async nbUsers() {
        try {
        return this.database.collection('users').countDocuments();
        } catch(error) {
            console.error(error);
        }
    }

    async nbFiles() {
        try {
        return this.database.collection('files').countDocuments();
        } catch(error) {
            console.error(error);
        }

    }
}

const dbClient = new DBClient();
module.exports = dbClient;
