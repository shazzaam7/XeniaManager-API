// Libraries
const express = require('express');
const axios = require('axios');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
const githubToken = process.env.GITHUB_TOKEN;

// ExpressJS
app.use((req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    if (providedKey === apiKey) {
        req.headers.authorization = `token ${githubToken}`;
        next();
    } else {
        res.status(401).json({ error: 'Host your own API.' });
    };
});

app.get('/patches', async (req, res) => {
    try {
        const response = await axios.get('https://api.github.com/repos/xenia-canary/game-patches/contents/patches', {
            headers: {
                Authorization: req.githubToken
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch patches data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
