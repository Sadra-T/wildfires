const fs = require('fs');
const path = require('path');
const axios = require('axios');
const csv = require('csvtojson');

/**
 * Fetch and compare NASA FIRMS data.
 *  1) Fetch CSV from NASA for today's date.
 *  2) Convert to JSON, extracting lat, long, bright_ti4.
 *  3) Save to a file named `fires_YYYY-MM-DD.json`.
 *  4) Compare with yesterday's file to find added/removed items.
 */
async function fetchAndCompareFireData() {
  try {
    // 1) Determine today's date in "YYYY-MM-DD" format
    const todayStr = new Date().toISOString().split('T')[0];

    // 2) Construct the NASA FIRMS CSV URL (MODIS_NRT world data)
    //    Replace the token "bd91f1ecea..." with your NASA API token if needed.
    const NASA_FIRMS_CSV_URL = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/bd91f1ecea0341e4fc5fb608ce522582/MODIS_NRT/world/1/${todayStr}`;

    // 3) Fetch the CSV data
    const response = await axios.get(NASA_FIRMS_CSV_URL);
    const csvData = response.data; // This is the raw CSV string

    // 4) Convert CSV to JSON (array of objects)
    //    Extract only the fields we need: lat, long, bright_ti4
    const allFieldsJson = await csv().fromString(csvData);
    const newData = allFieldsJson.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
      bright_ti4: item.brightness,
    }));

    // 5) Create a filename for today's data
    //    e.g., "fires_2025-01-18.json"
    const todayFilename = `fires_${todayStr}.json`;
    const todayFilePath = path.join(__dirname, todayFilename);

    // 6) Save today's data to a JSON file
    fs.writeFileSync(todayFilePath, JSON.stringify(newData, null, 2), 'utf-8');
    console.log(`\n[fetchFires] Saved today's data to ${todayFilename}`);

    // 7) Figure out yesterday's date string
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000); // subtract 24h
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayFilename = `fires_${yesterdayStr}.json`;
    const yesterdayFilePath = path.join(__dirname, yesterdayFilename);

    // 8) Compare today's data with yesterday's data (if it exists)
    if (fs.existsSync(yesterdayFilePath)) {
      const oldDataString = fs.readFileSync(yesterdayFilePath, 'utf-8');
      const oldData = JSON.parse(oldDataString);

      // We'll define a "key" to identify each object
      const makeKey = (obj) => `${obj.lat},${obj.long},${obj.bright_ti4}`;

      const oldKeys = new Set(oldData.map(makeKey));
      const newKeys = new Set(newData.map(makeKey));

      // 8a) Find newly added objects
      const added = newData.filter((obj) => !oldKeys.has(makeKey(obj)));

      // 8b) Find objects removed compared to yesterday
      const removed = oldData.filter((obj) => !newKeys.has(makeKey(obj)));

      console.log('[fetchFires] Added objects:', added.length, 'entries');
      console.log('[fetchFires] Removed objects:', removed.length, 'entries');

      // You can do more with these arrays (e.g., store in a DB, write to separate files, etc.)
    } else {
      console.log(`[fetchFires] No file found for yesterday (${yesterdayStr}). Skipping comparison.`);
    }
  } catch (error) {
    console.error('[fetchFires] Error:', error.message);
  }
}

module.exports = { fetchAndCompareFireData };
