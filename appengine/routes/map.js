const express = require('express');
const router = express.Router();
const { getCustomers } = require('../services/firestore');

const fetch = require('node-fetch');

// Endpoint: /map/locations
router.get('/locations', async (req, res) => {
  try {
    const customers = await getCustomers();

    const locations = customers
      .filter(c => c.location?.latitude && c.location?.longitude)
      .map(c => ({
        type: 'customer',
        customer_id: c.customer_id,
        name: c.name,
        lat: c.location.latitude,
        lng: c.location.longitude
      }));

    // Add WH marker
    const hqLat = parseFloat(process.env.HQ_LAT);
    const hqLng = parseFloat(process.env.HQ_LNG);

    if (!isNaN(hqLat) && !isNaN(hqLng)) {
      locations.push({
        type: 'hq',
        name: 'SmartStock Warehouse',
        lat: hqLat,
        lng: hqLng
      });
    }

    res.json(locations);
  } catch (error) {
    console.error('Error fetching customer locations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint: /map/apikey
router.get('/apikey', (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  res.json({ apiKey });
});

router.get('/geocode', async (req, res) => {
  const address = req.query.address;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  console.log('[Geocode] Address:', address);
  console.log('[Geocode] API Key:', apiKey ? '✔️ loaded' : '❌ missing');

  if (!address) {
    return res.status(400).json({ error: 'Missing address parameter' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    console.log('[Geocode] Requesting:', url);

    const response = await fetch(url);
    const data = await response.json();

    console.log('[Geocode] Response:', data);

    if (data.status === 'OK') {
      const location = data.results[0].geometry.location;
      res.json({ latitude: location.lat, longitude: location.lng });
    } else {
      res.status(500).json({ error: `Geocoding failed: ${data.status}` });
    }
  } catch (err) {
    console.error('[Geocode] Fetch error:', err);
    res.status(500).json({ error: 'Geocoding request failed' });
  }
});

module.exports = router;
