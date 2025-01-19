const express = require("express");
const cors = require("cors");
const { generateMockWildfire } = require("./mockDataGenerator");
const SolaceClient = require("../config/solace");
require("dotenv").config({ path: "./src/.env" });
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Store current wildfire data
let wildfireData = [];

// Initialize Solace client
const solaceClient = new SolaceClient({
  hostUrl: process.env.SOLACE_HOST_URL,
  vpnName: process.env.SOLACE_VPN_NAME,
  userName: process.env.SOLACE_USERNAME,
  password: process.env.SOLACE_PASSWORD,
});

const todayStr = new Date().toISOString().split("T")[0];
const todayFilename = `fires_${todayStr}.json`;
const todayFilePath = path.join(__dirname, todayFilename);
if (fs.existsSync(todayFilePath)) {
  const todayDataString = fs.readFileSync(todayFilePath, "utf-8");
  wildfireData = JSON.parse(todayDataString);
} else {
  console.error(`File not found: ${todayFilePath}`);
  wildfireData = []; // or handle the error as needed
}


// Simulate different types of events
const simulateEvents = () => {
  setInterval(async () => {
    const fetchedData = await fetchAndCompareFireData();

    if (fetchedData) {
      const { added: newWildfire, removed: removedWildfire } =
        await fetchAndCompareFireData();

      if (newWildfire && newWildfire.length > 0) {
        wildfireData.push(...newWildfire);
        solaceClient.publish("wildfires/new", JSON.stringify(newWildfire));
      }

      if (removedWildfire && removedWildfire.length > 0) {
        wildfireData.push(...removedWildfire);
        solaceClient.publish(
          "wildfires/removed",
          JSON.stringify(removedWildfire)
        );
      }
    }
  }, 5000);
};

// API Endpoints
app.get("/wildfires", async (req, res) => {
  const NASA_FIRMS_CSV_URL = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/bd91f1ecea0341e4fc5fb608ce522582/MODIS_NRT/world/1/${todayStr}`;

  const response = await axios.get(NASA_FIRMS_CSV_URL);
  const csvData = response.data; // This is the raw CSV string

  const allFieldsJson = await csv().fromString(csvData);
  newData = allFieldsJson.map((item) => ({
    latitude: item.latitude,
    longitude: item.longitude,
    bright_ti4: item.brightness,
  }));

  fs.writeFileSync(todayFilePath, JSON.stringify(newData, null, 2), "utf-8");
  console.log(`\n[fetchFires] Saved today's data to ${todayFilename}`);
  res.json(wildfireData);
});

// Initialize server and connect to Solace
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await solaceClient.connect();
    console.log("Connected to Solace, starting simulation");
    simulateEvents();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received");
  solaceClient.disconnect();
  process.exit(0);
});

// src/index.js

const cron = require("node-cron");
const { fetchAndCompareFireData } = require("./fetchFires");

// Example: run once a day at 00:00 (midnight)
cron.schedule("0 0 * * *", () => {
  console.log("Running daily fire data fetch...");
  fetchAndCompareFireData();
});

// Alternatively, just call the function directly for testing:
fetchAndCompareFireData();
