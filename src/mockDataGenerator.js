// mockDataGenerator.js
const generateMockWildfire = () => {
  // Random coordinates for USA and Canada
  const locations = [
    {
      region: "California",
      lat: 34.0522 + (Math.random() - 0.5) * 2,
      lng: -118.2437 + (Math.random() - 0.5) * 2,
    },
    {
      region: "Oregon",
      lat: 44.0522 + (Math.random() - 0.5) * 2,
      lng: -120.2437 + (Math.random() - 0.5) * 2,
    },
    {
      region: "British Columbia",
      lat: 49.2827 + (Math.random() - 0.5) * 2,
      lng: -123.1207 + (Math.random() - 0.5) * 2,
    },
  ];

  const randomLocation =
    locations[Math.floor(Math.random() * locations.length)];

  return {
    latitude: randomLocation.lat,
    longitude: randomLocation.lng,
    bright_ti4: 290 + Math.random() * 77, // Random temperature between 290K and 367K
    region: randomLocation.region,
    timestamp: new Date().toISOString(),
    intensity: Math.floor(Math.random() * 100),
    id: Date.now().toString(),
  };
};

module.exports = { generateMockWildfire };
