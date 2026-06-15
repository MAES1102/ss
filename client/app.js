const API = window.location.origin;

let jwtToken          = null;
let lastSecureRequest = null;

const logEl  = document.getElementById('log');
const tokenEl = document.getElementById('token-display');

function log(message, type = 'info') {
  const colors = {
    info:    '#a0c4ff',
    success: '#b7e4c7',
    error:   '#ffb3b3',
    warning: '#ffd166',
    title:   '#ffd60a',
    data:    '#cdb4db',
  };
  const line = document.createElement('div');
  line.style.color      = colors[type] || '#e0e0e0';
  line.style.marginBottom = '2px';
  line.textContent      = message;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function logDivider() {
  const line = document.createElement('div');
  line.style.borderTop   = '1px solid #444';
  line.style.margin      = '8px 0';
  logEl.appendChild(line);
}

async function login() {
  log('Authenticating as "demo" via POST /login ...', 'info');
  try {
    const res  = await fetch(`${API}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: 'demo', password: 'password123' }),
    });
    const data = await res.json();

    if (data.token) {
      jwtToken = data.token;
      tokenEl.textContent = `JWT: ${jwtToken.substring(0, 40)}…`;
      tokenEl.style.color = '#b7e4c7';
      log('Authentication successful. JWT issued and stored.', 'success');
      log(`   Token (truncated): ${jwtToken.substring(0, 40)}…`, 'data');
    } else {
      log(`Authentication failed: ${data.error}`, 'error');
    }
  } catch (e) {
    log(`Network error — server unreachable: ${e.message}`, 'error');
  }
  logDivider();
}

async function requestSignature(data) {
  const res = await fetch(`${API}/sign-data`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ data }),
  });
  const json = await res.json();
  return json.signature;
}

async function requestEncryption(data) {
  const res = await fetch(`${API}/encrypt-data`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ data }),
  });
  return res.json();
}

async function sendInsecure() {
  log('━━ SCENARIO 1: Baseline — data transmission without integrity controls ━━', 'title');
  log('Sending: { amount: 100, from: "Alice", to: "Bob" }', 'info');

  const res  = await fetch(`${API}/send-insecure`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ amount: 100, from: 'Alice', to: 'Bob' }),
  });
  const data = await res.json();
  log(`Server response: ${data.status.toUpperCase()} — no validation was performed.`, 'success');
  log(`   Observation: "${data.warning}"`, 'warning');
  logDivider();
}

async function tamperInsecure() {
  log('━━ SCENARIO 2: Data tampering attack against an unprotected endpoint ━━', 'title');
  log('Original intent: { amount: 100 }', 'info');
  log('Modified payload: { amount: 99999 }  ← field value altered by adversary', 'warning');

  const res  = await fetch(`${API}/send-insecure`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ amount: 99999, from: 'Alice', to: 'Attacker' }),
  });
  const data = await res.json();
  log(`Server response: ${data.status.toUpperCase()} — modified data was accepted.`, 'error');
  log(`   Received: ${JSON.stringify(data.received)}`, 'data');
  log('   Conclusion: The server accepted modified data because no integrity verification mechanism was present.', 'warning');
  logDivider();
}

async function sendSecure() {
  log('━━ SCENARIO 3: Authenticated secure transmission (JWT + AES-256-GCM + RSA-2048 + nonce) ━━', 'title');

  if (!jwtToken) {
    log('Authentication required. Please log in before running this scenario.', 'error');
    logDivider();
    return;
  }

  const nonce = crypto.randomUUID();
  const originalData = { amount: 100, from: 'Alice', to: 'Bob', nonce };
  log(`Preparing data: ${JSON.stringify({ amount: 100, from: 'Alice', to: 'Bob' })}`, 'info');
  log(`   + nonce: ${nonce}`, 'data');

  log('Requesting RSA-2048 digital signature from server...', 'info');
  const signature = await requestSignature(originalData);
  log(`Digital signature received (Base64, truncated): ${signature.substring(0, 40)}...`, 'data');

  log('Encrypting payload with AES-256-GCM (96-bit IV, 128-bit authentication tag)...', 'info');
  const encryptedPayload = await requestEncryption(originalData);
  log('Payload encrypted. Transmitting ciphertext, authentication tag, and RSA signature.', 'data');

  const res = await fetch(`${API}/send-secure`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ encryptedPayload, signature }),
  });
  const data = await res.json();

  if (res.ok) {
    log(`Server response: ${data.status.toUpperCase()} — all verification layers passed.`, 'success');
    log(`   "${data.message}"`, 'success');
    lastSecureRequest = { encryptedPayload, signature };
    log('   Note: Request captured for replay demonstration (Scenario 5).', 'data');
  } else {
    log(`Server rejected request: ${data.error}`, 'error');
  }
  logDivider();
}

async function tamperSigned() {
  log('━━ SCENARIO 4: Data tampering attack against a digitally signed payload ━━', 'title');

  if (!jwtToken) {
    log('Authentication required. Please log in before running this scenario.', 'error');
    logDivider();
    return;
  }

  const nonce = crypto.randomUUID();
  const originalData = { amount: 100, from: 'Alice', to: 'Bob', nonce };

  log('Obtaining a legitimate RSA-2048 digital signature for the original payload...', 'info');
  const signature = await requestSignature(originalData);

  const tamperedData = { amount: 99999, from: 'Alice', to: 'Attacker', nonce };
  log(`Simulating tampering: modifying payload to ${JSON.stringify(tamperedData)}`, 'warning');
  log('   The original digital signature is reused without modification.', 'warning');

  const encryptedPayload = await requestEncryption(tamperedData);

  const res = await fetch(`${API}/send-secure`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ encryptedPayload, signature }),
  });
  const data = await res.json();

  if (!res.ok) {
    log(`Server response: ${(data.status || 'rejected').toUpperCase()}`, 'error');
    log(`   "${data.error}"`, 'error');
    log('   Conclusion: The digital signature verification process detected data tampering and rejected the request.', 'success');
  } else {
    log(`Unexpected result: server accepted tampered data: ${JSON.stringify(data)}`, 'warning');
  }
  logDivider();
}

async function replayAttack() {
  log('━━ SCENARIO 5: Replay attack using a previously captured valid request ━━', 'title');

  if (!jwtToken) {
    log('Authentication required. Please log in before running this scenario.', 'error');
    logDivider();
    return;
  }
  if (!lastSecureRequest) {
    log('Prerequisite not met: Run Scenario 3 first to capture a valid secure request.', 'error');
    logDivider();
    return;
  }

  log('Replaying the previously accepted payload and signature from Scenario 3...', 'warning');
  log('   Payload, ciphertext, and RSA signature are transmitted without modification.', 'warning');
  log('   This models a network-level capture and retransmission attack.', 'warning');

  const res = await fetch(`${API}/send-secure`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify(lastSecureRequest),
  });
  const data = await res.json();

  if (!res.ok) {
    log(`Server response: ${(data.status || 'rejected').toUpperCase()}`, 'error');
    log(`   "${data.error}"`, 'error');
    log('   Conclusion: The server detected a previously used nonce and rejected the replay attempt. Replay protection confirmed.', 'success');
  } else {
    log(`Unexpected result: server accepted replayed data: ${JSON.stringify(data)}`, 'warning');
  }
  logDivider();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-login').addEventListener('click', login);
  document.getElementById('btn-insecure').addEventListener('click', sendInsecure);
  document.getElementById('btn-tamper-insecure').addEventListener('click', tamperInsecure);
  document.getElementById('btn-secure').addEventListener('click', sendSecure);
  document.getElementById('btn-tamper-signed').addEventListener('click', tamperSigned);
  document.getElementById('btn-replay').addEventListener('click', replayAttack);
  document.getElementById('btn-clear').addEventListener('click', () => {
    logEl.innerHTML = '';
    log('Log cleared.', 'info');
  });
});
