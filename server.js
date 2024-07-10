const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

const routes = require('./routes');

app.use(express.json());

app.use('/', routes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
