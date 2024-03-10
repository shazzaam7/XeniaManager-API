// Libraries
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
const githubToken = process.env.GITHUB_TOKEN;
const patchesFilePath = path.join(__dirname, 'patches.json');

// Functions

// Functions for game patches
/**
 * Fetches patches data from Github API
 * @param {*} req 
 * @returns Patches.JSON
 */
async function fetchPatchesData(req) {
    try {
        const response = await axios.get('https://api.github.com/repos/xenia-canary/game-patches/contents/patches', {
            headers: {
                Authorization: req.githubToken
            }
        });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch data from GitHub API:', error);
        throw error;
    }
}

/**
 * Function to save patches data to a local JSON file
 * @param {*} data JSON file
 */
function savePatchesDataToFile(data) {
    try {
        fs.writeFileSync(patchesFilePath, JSON.stringify(data, null, 2));
        console.log('Patches data saved to file:', patchesFilePath);
    } catch (error) {
        console.error('Failed to save patches data to file:', error);
        throw error;
    }
}

/**
 * Function to load patches data from the local JSON file
 * @returns Returns patches.json
 */
function loadPatchesDataFromFile() {
    try {
        const data = fs.readFileSync(patchesFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load patches data from file:', error);
        throw error;
    }
}

// ExpressJS

app.use((req, res, next) => {
    const providedKey = req.headers['x-api-key'];
    if (providedKey === apiKey) {
        req.headers.authorization = `token ${githubToken}`;
        next(); // Continue if the API key is correct
    } else {
        res.status(401).json({ error: 'Host your own API.' }); // Unauthorized error if API key is incorrect
    };
});

app.get('/patches', async (req, res) => {
    try {
        let patchesData;
        if (fs.existsSync(patchesFilePath)) {
            console.log("Patches are already cached onto the API. Serving them.");
            patchesData = loadPatchesDataFromFile();
        } else {
            patchesData = await fetchPatchesData(req); // Pass the req object
            savePatchesDataToFile(patchesData);
        }
        res.json(patchesData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch patches data' });
    }
});


// Cron job to update patches data daily
cron.schedule('0 0 * * *', async () => {
    console.log('Updating patches data...');
    try {
        const patchesData = await fetchPatchesData();
        savePatchesDataToFile(patchesData);
        console.log('Patches data updated successfully.');
    } catch (error) {
        console.error('Failed to update patches data:', error);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
