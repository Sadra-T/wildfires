// src/index.js

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint: GET /wildfires/
app.get('/wildfires/', (req, res) => {
  const dataFilePath = path.join(__dirname, '..', 'data.json');
  
  fs.readFile(dataFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading data file:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    try {
      const jsonData = JSON.parse(data);
      return res.status(200).json(jsonData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return res.status(500).json({ error: 'Data format error' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// src/index.js

const cron = require('node-cron');
const { fetchAndCompareFireData } = require('./fetchFires');

// Example: run once a day at 00:00 (midnight)
cron.schedule('0 0 * * *', () => {
  console.log('Running daily fire data fetch...');
  fetchAndCompareFireData();
});

// Alternatively, just call the function directly for testing:
fetchAndCompareFireData();
