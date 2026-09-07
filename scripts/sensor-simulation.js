const http = require('http');

const sensors = [
  { id: 'SN-MIX-01', type: 'temperature' },
  { id: 'SN-BOOTH-01', type: 'combined' },
  { id: 'SN-OVEN-01', type: 'temperature' },
];

const API_URL = 'http://localhost:3000/api/telemetry';

console.log('🚀 Starting real-time industrial telemetry simulation...');
console.log('Press Ctrl+C to stop.\n');

setInterval(() => {
  const sensor = sensors[Math.floor(Math.random() * sensors.length)];
  
  // Base realistic values
  let temp = 22.5 + (Math.random() * 2 - 1); // 21.5 - 23.5
  let rh = 50.0 + (Math.random() * 4 - 2);   // 48.0 - 52.0

  // 10% chance to simulate an anomaly (spike or drop)
  if (Math.random() > 0.9) {
    if (Math.random() > 0.5) {
      temp += (Math.random() * 15); // Spike up to 38.5
      console.log(`⚠️ Anomaly detected on ${sensor.id}: Temperature Spike`);
    } else {
      rh -= (Math.random() * 20); // Drop down to 30.0
      console.log(`⚠️ Anomaly detected on ${sensor.id}: Humidity Drop`);
    }
  }

  const payload = JSON.stringify({
    sensor_id: sensor.id,
    temperature_celsius: Math.round(temp * 10) / 10,
    humidity_percent: Math.round(rh * 2) / 2,
    user_id: 'automated-sensor'
  });

  const req = http.request(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  }, (res) => {
    if (res.statusCode === 201) {
      console.log(`📡 [${new Date().toISOString()}] Data transmitted from ${sensor.id} -> T: ${Math.round(temp * 10) / 10}°C, RH: ${Math.round(rh * 2) / 2}%`);
    } else {
      console.error(`❌ Failed to transmit data from ${sensor.id}. Status Code: ${res.statusCode}`);
    }
  });

  req.on('error', (e) => {
    console.error(`❌ Connection Error: Is the Next.js server running on port 3000?`);
  });

  req.write(payload);
  req.end();
}, 2500);
