const express = require("express");
const cors = require("cors");
const { generateMockWildfire } = require("./mockDataGenerator");
const SolaceClient = require("../config/solace");
require("dotenv").config();

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

// Simulate different types of events
const simulateEvents = () => {
  // 1. New Wildfire Detection
  setInterval(() => {
    const newWildfire = generateMockWildfire();
    wildfireData.push(newWildfire);
    solaceClient.publish("wildfires/new", newWildfire);
    console.log("New wildfire detected:", newWildfire.region);
  }, 5000);

  // 2. Temperature Updates
  setInterval(() => {
    if (wildfireData.length > 0) {
      const index = Math.floor(Math.random() * wildfireData.length);
      wildfireData[index].bright_ti4 += (Math.random() - 0.5) * 10;
      solaceClient.publish("wildfires/temperature-update", wildfireData[index]);
      console.log("Temperature update:", wildfireData[index].region);
    }
  }, 3000);

  // 3. Containment Updates
  setInterval(() => {
    if (wildfireData.length > 0) {
      const index = Math.floor(Math.random() * wildfireData.length);
      const containmentStatus = {
        id: wildfireData[index].id,
        region: wildfireData[index].region,
        containment: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
      };
      solaceClient.publish("wildfires/containment", containmentStatus);
      console.log("Containment update:", containmentStatus.region);
    }
  }, 7000);
};

// API Endpoints
app.get("/wildfires", (req, res) => {
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
