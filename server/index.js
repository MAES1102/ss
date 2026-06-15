'use strict';
require('dotenv').config();

const https   = require('https');
const http    = require('http');
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const { DEMO_USER, generateToken, authenticateToken, verifyPassword } = require('./auth');
const { publicKey, signData, verifySignature, encryptData, decryptData } = require('./cryptoUtils');

const app  = express();
const PORT = 3000;

const usedNonces = new Set();

app.use(cors({
  origin:         true,
  methods:        ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username !== DEMO_USER.username || !(await verifyPassword(password))) {
    console.log('[login] ERROR: Invalid credentials.');
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = generateToken(username);
  console.log(`[login] SUCCESS: User "${username}" authenticated. JWT issued.`);
  res.json({ token });
});

app.get('/public-key', (req, res) => {
  res.json({ publicKey });
});

app.post('/sign-data', authenticateToken, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Missing data field.' });
  const signature = signData(data);
  res.json({ signature });
});

app.post('/encrypt-data', authenticateToken, (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'Missing data field.' });
  const encrypted = encryptData(data);
  res.json(encrypted);
});

app.post('/send-insecure', (req, res) => {
  const data = req.body;
  console.log('\n[INSECURE] Received payload (no authentication, no integrity verification):');
  console.log('  Payload:', JSON.stringify(data));
  console.log('[INSECURE] Payload accepted without validation — integrity controls absent.\n');

  res.json({
    status:   'accepted',
    warning:  'No integrity verification was performed. Payload accepted as received.',
    note:     'This endpoint exists to demonstrate the absence of integrity controls.',
    received: data,
  });
});

app.post('/send-secure', authenticateToken, (req, res) => {
  const { encryptedPayload, signature } = req.body;

  if (!encryptedPayload || !signature) {
    return res.status(400).json({ error: 'Missing encryptedPayload or signature.' });
  }

  let decryptedData;
  try {
    decryptedData = decryptData(encryptedPayload);
    console.log('\n[SECURE] AES-256-GCM decryption successful.');
    console.log('  Decrypted payload:', JSON.stringify(decryptedData));
  } catch (err) {
    console.log('[SECURE] ERROR: Decryption failed — ciphertext may be tampered.');
    return res.status(400).json({ error: 'Decryption failed. Data may be corrupted.' });
  }

  const isValid = verifySignature(decryptedData, signature);

  if (!isValid) {
    console.log('[SECURE] RSA-2048 signature verification FAILED — payload integrity cannot be confirmed.\n');
    return res.status(400).json({
      status:  'rejected',
      error:   'Signature verification failed. The payload may have been modified in transit.',
    });
  }

  const { nonce } = decryptedData;
  if (!nonce) {
    console.log('[SECURE] ERROR: Missing nonce — replay protection requires a nonce field.');
    return res.status(400).json({
      status: 'rejected',
      error:  'Missing nonce. Secure payloads must include a one-time nonce.',
    });
  }
  if (usedNonces.has(nonce)) {
    console.log('[SECURE] Nonce already recorded — replay attempt detected. Nonce:', nonce, '\n');
    return res.status(400).json({
      status: 'rejected',
      error:  'Nonce has already been used. This request was identified as a replay attempt.',
    });
  }
  usedNonces.add(nonce);
  console.log('[SECURE] Nonce verified and recorded (replay protection active).');

  console.log('[SECURE] All verification layers passed: JWT, AES-256-GCM, RSA-2048, nonce.');
  console.log(`  Request accepted for authenticated user: ${req.user.username}\n`);

  res.json({
    status:   'accepted',
    message:  'Payload integrity and authenticity verified. All security layers passed.',
    received: decryptedData,
  });
});

let tlsOptions;
try {
  tlsOptions = {
    key:  fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
  };
} catch {
  console.error('\n[startup] FATAL: TLS certificate files not found in server/.');
  console.error('  Generate them with:');
  console.error('  openssl req -x509 -newkey rsa:2048 -keyout server/key.pem -out server/cert.pem -days 365 -nodes -subj "/CN=localhost"\n');
  process.exit(1);
}

http.createServer(app).listen(3001, '127.0.0.1', () => {
  console.log('[ngrok] HTTP listener active on http://127.0.0.1:3001');
});

https.createServer(tlsOptions, app).listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Fake Data Prevention Demo — Server Running     ║');
  console.log(`║   https://localhost:${PORT}                         ║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║   TLS ENABLED — self-signed certificate          ║');
  console.log('║   On first visit: Advanced → Proceed to localhost║');
  console.log('╚══════════════════════════════════════════════════╝\n');
});
