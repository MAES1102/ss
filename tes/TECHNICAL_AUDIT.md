# Technical Audit — Fake Data Prevention Demo
### Complete Project Analysis for Engineer Handoff and Academic Defense

**Audited:** `/Users/yermekaubayev/Documents/ss7`  
**Stack:** Node.js · Express · Web Crypto (built-in) · jsonwebtoken  
**Purpose:** University security presentation — demonstrates cryptographic fake-data prevention

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Project Structure](#2-project-structure)
3. [Backend Analysis](#3-backend-analysis)
4. [Frontend Analysis](#4-frontend-analysis)
5. [Cryptography Analysis](#5-cryptography-analysis)
6. [Security Analysis](#6-security-analysis)
7. [Demonstration Flow](#7-demonstration-flow)
8. [Data Flow](#8-data-flow)
9. [Presentation Preparation](#9-presentation-preparation)
10. [Defense Questions & Answers](#10-defense-questions--answers)
11. [UML and Architecture Descriptions](#11-uml-and-architecture-descriptions)
12. [Improvement Suggestions](#12-improvement-suggestions)

---

## 1. Project Overview

### Project Name
**Fake Data Prevention with Conventional Cryptographic Tools**

### Main Purpose
An interactive, browser-based demonstration that shows — side by side — what happens when a server has **no data validation** versus when it enforces **three layers of cryptographic protection** (JWT authentication, AES-256-GCM encryption, RSA-2048 digital signatures).

### Security Objectives
| Objective | Mechanism | Where Implemented |
|---|---|---|
| **Authentication** — only known users can access protected endpoints | JWT (HMAC-SHA256) | `server/auth.js` → `authenticateToken` middleware |
| **Confidentiality** — data is unreadable in transit | AES-256-GCM encryption | `server/cryptoUtils.js` → `encryptData()` |
| **Integrity** — any modification to data is detected | RSA-2048 digital signature + AES-GCM auth tag | `server/cryptoUtils.js` → `signData()` / `verifySignature()` |
| **Non-repudiation** (partial) — signature proves data origin | RSA private key — only the server holds it | `server/cryptoUtils.js` — key never leaves the server |

### What Problem It Solves
Without validation a server **blindly trusts whatever JSON it receives**. An attacker (MITM or malicious client) can change `{ amount: 100 }` to `{ amount: 99999 }` and the server accepts it. The project demonstrates exactly this attack and then shows how cryptographic tools eliminate it.

### Main Demonstration Scenario
A payment-style transaction (`amount`, `from`, `to`) is used as the data payload. The demo shows:
- Attack succeeds on the insecure endpoint (server accepts `amount: 99999`)
- Attack is blocked on the secure endpoint (server detects the tampered signature)

---

## 2. Project Structure

```
ss7/
├── package.json           Node.js manifest — dependencies and start script
├── package-lock.json      Locked dependency tree
├── README.md              Quick-start guide and concept explanation
├── TECHNICAL_AUDIT.md     ← This file
├── node_modules/          Installed packages (express, jsonwebtoken, cors)
├── venv/                  Unused Python virtualenv (legacy artefact, not used)
│
├── server/
│   ├── index.js           Express server — all endpoint definitions (169 lines)
│   ├── auth.js            JWT generation + authenticateToken middleware (76 lines)
│   └── cryptoUtils.js     RSA key gen, signing/verification, AES enc/dec (113 lines)
│
└── client/
    ├── index.html         Single-page demo UI — layout, cards, buttons, theory panel
    └── app.js             All client logic — fetch calls, log display, 4 scenarios
```

### Purpose of Each File

| File | Role |
|---|---|
| `server/index.js` | Entry point. Wires middleware, defines 6 API endpoints, starts HTTP server on port 3000 |
| `server/auth.js` | Defines `DEMO_USER`, `generateToken()`, and `authenticateToken` middleware |
| `server/cryptoUtils.js` | Generates RSA-2048 key pair and AES-256 key at startup; exports sign/verify/encrypt/decrypt |
| `client/index.html` | Dark-themed UI with 5 action buttons, live log panel, and theory section |
| `client/app.js` | Implements `login()`, `sendInsecure()`, `tamperInsecure()`, `sendSecure()`, `tamperSigned()` |
| `package.json` | Three runtime dependencies: `express@^4.18.2`, `jsonwebtoken@^9.0.2`, `cors@^2.8.5` |

---

## 3. Backend Analysis

### Frameworks Used
- **Runtime:** Node.js (built-in `crypto` module — no external crypto library)
- **Web framework:** Express 4.18.2
- **JWT library:** jsonwebtoken 9.0.2 (wraps HMAC-SHA256 signing)
- **CORS:** cors 2.8.5 (permissive — all origins allowed)
- **Crypto primitives:** Node.js `crypto` — `generateKeyPairSync`, `createSign`, `createVerify`, `createCipheriv`, `createDecipheriv`, `randomBytes`

### Server Architecture

```
HTTP :3000
  ├─ cors()              → allows all origins (demo: browser on file://)
  ├─ express.json()      → parses JSON request bodies
  ├─ express.static()    → serves client/ folder (index.html + app.js)
  └─ Routes:
       POST /login
       GET  /public-key
       POST /sign-data        [authenticateToken]
       POST /encrypt-data     [authenticateToken]
       POST /send-insecure    [NO MIDDLEWARE]
       POST /send-secure      [authenticateToken]
```

The server is **single-process, synchronous** (no worker threads, no clustering). The RSA key pair and AES key are module-level constants — generated once when `cryptoUtils.js` is first `require()`d and reused for the entire server lifetime.

### API Endpoints

#### `POST /login`
- **Auth:** None
- **Input:** `{ username: string, password: string }`
- **Success:** `200 { token: "<JWT>" }`
- **Failure:** `401 { error: "Invalid credentials." }`
- **Logic:** Compares against hardcoded `DEMO_USER = { username: "demo", password: "password123" }`. If match, calls `generateToken(username)` and returns the JWT.

**Request example:**
```json
POST /login
{ "username": "demo", "password": "password123" }

Response 200:
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImRlbW8iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.XXXX" }
```

---

#### `GET /public-key`
- **Auth:** None
- **Output:** `{ publicKey: "<PEM string>" }`
- **Purpose:** Exposes the server's RSA public key so the client can theoretically verify signatures independently. In the demo the client calls this endpoint but does not use the key client-side for actual verification (it delegates that to `/send-secure`).

---

#### `POST /sign-data`
- **Auth:** `authenticateToken` middleware (JWT required)
- **Input:** `{ data: <any object> }`
- **Output:** `{ signature: "<Base64 string>" }`
- **Logic:** Calls `signData(data)` — serialises data to `JSON.stringify(data)` then signs with RSA-2048 private key using SHA-256. Returns Base64-encoded signature.

**Important note:** In a real system the **client** would hold a private key and sign locally. Here the server signs on behalf of the client to keep the demo self-contained without key distribution complexity. This is explicitly documented in `client/app.js` line 13.

---

#### `POST /encrypt-data`
- **Auth:** `authenticateToken` middleware
- **Input:** `{ data: <any object> }`
- **Output:** `{ iv: "<Base64>", ciphertext: "<Base64>", authTag: "<Base64>" }`
- **Logic:** Calls `encryptData(data)` — generates a fresh 96-bit random IV per call, encrypts with AES-256-GCM, returns IV + ciphertext + GCM auth tag.

---

#### `POST /send-insecure` ⚠️ VULNERABLE
- **Auth:** None
- **Input:** Any JSON
- **Output:** `{ status: "accepted", warning: "No validation performed...", received: <data> }`
- **Logic:** Literally `const data = req.body; res.json({ received: data })`. No checks whatsoever. Exists solely to demonstrate the absence-of-protection scenario.

---

#### `POST /send-secure` ✅ PROTECTED
- **Auth:** `authenticateToken` middleware
- **Input:** `{ encryptedPayload: { iv, ciphertext, authTag }, signature: "<Base64>" }`
- **Output (success):** `{ status: "accepted", message: "Data is authentic...", received: <decrypted object> }`
- **Output (fail — decryption):** `400 { error: "Decryption failed. Data may be corrupted." }`
- **Output (fail — signature):** `400 { status: "rejected", error: "Tampered data detected! Signature verification failed." }`

**Processing order:**
1. `authenticateToken` verifies JWT → 401/403 if bad
2. `decryptData(encryptedPayload)` → 400 if authTag mismatch or key mismatch
3. `verifySignature(decryptedData, signature)` → 400 if hash mismatch
4. Accept and return decrypted data with `req.user.username` logged

### Authentication Flow

```
Client                           Server (auth.js)
  │                                    │
  │──POST /login {user, pass}─────────►│
  │                                    ├─ compare vs DEMO_USER
  │                                    ├─ jwt.sign({username}, JWT_SECRET, {expiresIn:"1h"})
  │◄──{token: "eyJ..."}───────────────│
  │                                    │
  │──POST /send-secure                 │
  │  Authorization: Bearer eyJ...─────►│
  │                                    ├─ split(" ")[1] → raw token
  │                                    ├─ jwt.verify(token, JWT_SECRET, callback)
  │                                    │   ├─ TokenExpiredError → 401
  │                                    │   ├─ JsonWebTokenError → 403
  │                                    │   └─ OK → req.user = decoded; next()
  │◄──(route handler executes)─────────│
```

### JWT Implementation Details
- **Algorithm:** HS256 (HMAC-SHA256) — symmetric, single secret
- **Secret:** `'demo_super_secret_key_change_in_prod'` — hardcoded string constant in `auth.js:21`
- **Expiry:** `'1h'` (1 hour) — embedded in the `exp` claim of the payload
- **Payload:** `{ username: "demo", iat: <issued-at>, exp: <expiry> }`
- **Token format:** `Base64url(header).Base64url(payload).Base64url(HMAC-SHA256(header+"."+payload, secret))`
- **Verification:** `jwt.verify()` checks signature AND expiry simultaneously; distinguishes `TokenExpiredError` from `JsonWebTokenError` for clearer error messages

### Middleware Used

| Middleware | Package | Scope | Purpose |
|---|---|---|---|
| `cors()` | `cors` | Global | Allows all cross-origin requests (needed for browser `file://` access) |
| `express.json()` | express built-in | Global | Parses `application/json` request bodies into `req.body` |
| `express.static()` | express built-in | Global | Serves `client/` directory (index.html, app.js) |
| `authenticateToken` | custom (`auth.js`) | Per-route | Validates Bearer JWT on protected routes |

### Crypto Implementation

All cryptography uses **Node.js built-in `crypto` module** (OpenSSL under the hood). Zero external crypto dependencies.

| Operation | Algorithm | Key Size | Node.js API |
|---|---|---|---|
| RSA key generation | RSA, SPKI/PKCS8 PEM | 2048 bits | `crypto.generateKeyPairSync('rsa', {...})` |
| Digital signing | RSA-SHA256 | 2048-bit private key | `crypto.createSign('SHA256')` |
| Signature verification | RSA-SHA256 | 2048-bit public key | `crypto.createVerify('SHA256')` |
| Symmetric encryption | AES-256-GCM | 256 bits (32 bytes) | `crypto.createCipheriv('aes-256-gcm', ...)` |
| Symmetric decryption | AES-256-GCM | 256 bits | `crypto.createDecipheriv('aes-256-gcm', ...)` |
| IV generation | Random | 96 bits (12 bytes) | `crypto.randomBytes(12)` |
| AES key generation | Random | 256 bits (32 bytes) | `crypto.randomBytes(32)` |

---

## 4. Frontend Analysis

### Pages
Single-page application: `client/index.html` — served at `http://localhost:3000/` via `express.static`.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Fake Data Prevention Demo                          │
│  Digital Signatures · AES Encryption · JWT         │
├─────────────────────┬───────────────────────────────┤
│  Step 0 — Auth      │  Vulnerable System            │
│  [JWT badge]        │  [DANGER badge]               │
│  [token display]    │  [1. Send insecure]           │
│  [Login button]     │  [2. Tamper + send]           │
├─────────────────────┼───────────────────────────────┤
│  Secure System      │  Live Demo Log                │
│  [SUCCESS badge]    │  ──────────────────────       │
│  [3. Send secure]   │  (scrollable mono log)        │
│  [4. Tamper signed] │  [Clear]                      │
├─────────────────────┴───────────────────────────────┤
│  How the Protection Works (theory grid + flow)      │
└─────────────────────────────────────────────────────┘
```

### Components

| Element | ID / Class | Purpose |
|---|---|---|
| Token display | `#token-display` | Shows truncated JWT after login; green on success |
| Login button | `#btn-login` | Triggers `login()` — POST /login |
| Insecure send button | `#btn-insecure` | Triggers `sendInsecure()` — POST /send-insecure |
| Tamper insecure button | `#btn-tamper-insecure` | Triggers `tamperInsecure()` — POST /send-insecure with `amount: 99999` |
| Secure send button | `#btn-secure` | Triggers `sendSecure()` — sign + encrypt + POST /send-secure |
| Tamper signed button | `#btn-tamper-signed` | Triggers `tamperSigned()` — sign original, encrypt tampered, POST /send-secure |
| Log panel | `#log` | Appends coloured `<div>` per log entry; auto-scrolls |
| Clear button | `#btn-clear` | Empties `#log.innerHTML` |
| Theory section | `.theory` | Static educational content — 5 theory cards + flow diagram |

### User Workflow (Recommended Button Order)
```
Login → (1) Send insecure → (2) Tamper insecure → (3) Send secure → (4) Tamper signed
```
Buttons 3 and 4 display an error if `jwtToken` is `null` (login not yet performed).

### Event Handlers (`app.js:240–249`)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-login')            .addEventListener('click', login);
  document.getElementById('btn-insecure')         .addEventListener('click', sendInsecure);
  document.getElementById('btn-tamper-insecure')  .addEventListener('click', tamperInsecure);
  document.getElementById('btn-secure')           .addEventListener('click', sendSecure);
  document.getElementById('btn-tamper-signed')    .addEventListener('click', tamperSigned);
  document.getElementById('btn-clear')            .addEventListener('click', () => {
    logEl.innerHTML = '';
    log('Log cleared.', 'info');
  });
});
```

### State Management
- **`jwtToken`** — module-level `let` variable in `app.js`. Set after successful login. `null` until login. The token string is sent as `Authorization: Bearer ${jwtToken}` in all subsequent requests.

### Log Colour Coding

| Type | Colour | Usage |
|---|---|---|
| `info` | `#a0c4ff` (blue) | Processing steps, status |
| `success` | `#b7e4c7` (green) | Server accepted |
| `error` | `#ffb3b3` (red) | Server rejected, attack succeeded |
| `warning` | `#ffd166` (yellow) | Tampered data being sent |
| `title` | `#ffd60a` (yellow) | Scenario headers |
| `data` | `#cdb4db` (purple) | Token/signature/payload display |

---

## 5. Cryptography Analysis

### How JWT is Generated and Validated

**Generation (`auth.js:32–38`):**
```javascript
jwt.sign(
  { username },                    // payload (visible, not secret)
  'demo_super_secret_key...',      // HMAC-SHA256 signing key
  { expiresIn: '1h' }             // adds exp claim
)
```
The `jsonwebtoken` library:
1. Creates `header = Base64url({ alg:"HS256", typ:"JWT" })`
2. Creates `payload = Base64url({ username, iat, exp })`
3. Computes `signature = Base64url(HMAC-SHA256(header+"."+payload, secret))`
4. Returns `header.payload.signature`

**Validation (`auth.js:58–72`):**
```javascript
jwt.verify(token, JWT_SECRET, (err, decoded) => { ... })
```
`jwt.verify` recomputes the HMAC-SHA256 over the received `header.payload` using the same secret and compares it to the received signature. It also checks that `exp > Date.now()/1000`. Failure on either check raises an error — the middleware then returns 401/403.

**Security guarantee:** Any modification to the payload (e.g., changing `username`, extending `exp`) breaks the HMAC signature → rejected.

---

### How RSA Keys are Generated

**Location:** `cryptoUtils.js:19–23` — executed **once at module load time** (server startup).

```javascript
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
```

- **`modulusLength: 2048`** — 2048-bit RSA key. The current NIST minimum for signatures. 3072-bit is recommended for keys beyond 2030.
- **`spki`** (SubjectPublicKeyInfo) — standard X.509 encoding for the public key.
- **`pkcs8`** — standard PKCS#8 encoding for the private key.
- Both are PEM format (Base64 with `-----BEGIN ... KEY-----` headers).
- Keys are stored only **in memory** — new keys are generated every server restart. There is no persistence to disk.

---

### How Digital Signatures are Created

**Location:** `cryptoUtils.js:38–45`

```javascript
function signData(data) {
  const payload = JSON.stringify(data);       // 1. canonical serialisation
  const sign    = crypto.createSign('SHA256'); // 2. create signer (SHA-256 hash)
  sign.update(payload);                        // 3. feed data
  sign.end();
  return sign.sign(privateKey, 'base64');     // 4. sign hash with RSA private key
}
```

**Internally what happens:**
1. `JSON.stringify(data)` produces a deterministic byte string of the data.
2. `createSign('SHA256')` creates an RSA-SHA256 signer context.
3. `.update(payload)` feeds the plaintext into the SHA-256 hash computation.
4. `.sign(privateKey)` computes `SHA256(payload)` → encrypts the hash with the RSA private key using RSASSA-PKCS1-v1_5 padding → returns the result as Base64.

**Result:** A 256-byte (2048-bit) Base64 string. Only the holder of the private key could have produced it.

---

### How Signature Verification Works

**Location:** `cryptoUtils.js:55–61`

```javascript
function verifySignature(data, signature) {
  const payload = JSON.stringify(data);
  const verify  = crypto.createVerify('SHA256');
  verify.update(payload);
  verify.end();
  return verify.verify(publicKey, signature, 'base64');
}
```

**Internally what happens:**
1. Re-serialises the (now decrypted) data object with `JSON.stringify`.
2. Computes `SHA256(payload)` — the "expected hash".
3. Decrypts the received `signature` using the RSA **public key** → produces the "claimed hash".
4. Returns `true` if `expected hash === claimed hash`, `false` otherwise.

**Why tampering breaks it:** If `amount` was changed from `100` to `99999`, `JSON.stringify(data)` produces a different string → different SHA-256 → different expected hash → mismatch with the claimed hash from the signature → `verifySignature` returns `false` → 400 rejected.

**Critical serialisation coupling:** Both `signData` and `verifySignature` use `JSON.stringify(data)`. The verification will fail if the JSON serialisation order differs between the two calls. In this demo it is safe because the server serialises both times with the same V8 engine. In a cross-language system, serialisation order must be explicitly standardised.

---

### How AES Encryption Works

**Location:** `cryptoUtils.js:78–92`

```javascript
function encryptData(data) {
  const iv     = crypto.randomBytes(12);                       // fresh 96-bit IV
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);
  const plaintext = JSON.stringify(data);
  let ciphertext  = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext     += cipher.final('base64');
  const authTag   = cipher.getAuthTag().toString('base64');
  return { iv: iv.toString('base64'), ciphertext, authTag };
}
```

**AES-256-GCM mechanics:**
- **AES (Advanced Encryption Standard):** block cipher operating on 128-bit blocks, 256-bit key.
- **GCM (Galois/Counter Mode):** turns AES into a stream cipher via a counter, simultaneously computing a GHASH authentication tag over the ciphertext and additional data (AAD — not used here).
- **IV (Initialisation Vector):** 96 bits (12 bytes) — a fresh random value per encryption. Never reused. Sent in plaintext with the ciphertext (not secret).
- **Auth tag:** 128-bit GHASH value. If any bit of the ciphertext changes, the auth tag verification fails on decryption — this is the GCM integrity guarantee.

**Decryption (`cryptoUtils.js:99–110`):**
```javascript
function decryptData({ iv, ciphertext, authTag }) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  let plaintext  = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext     += decipher.final('utf8');   // throws if authTag mismatch
  return JSON.parse(plaintext);
}
```
`decipher.final()` throws a `bad decrypt` error if the auth tag does not match — caught in `index.js:132-135` and returned as HTTP 400.

---

### How AES Keys are Generated

**Location:** `cryptoUtils.js:67`

```javascript
const AES_KEY = crypto.randomBytes(32);   // 256-bit = 32 bytes
```

- Called **once at server startup** (module load). Stays constant for the entire demo session.
- `crypto.randomBytes(32)` uses the OS CSPRNG (cryptographically secure pseudo-random number generator), which is `arc4random` on macOS / `getrandom()` on Linux.
- The key is a raw `Buffer` — never exported, never transmitted, never logged.

**Demo limitation:** The same AES key is used for all encryptions in the session. In production, a new symmetric key should be generated per session or even per message (using key exchange protocols like ECDH).

---

### Security Guarantees by Mechanism

| Mechanism | Confidentiality | Integrity | Authentication | Non-repudiation |
|---|---|---|---|---|
| **JWT (HS256)** | ✗ (payload is Base64, not encrypted) | ✓ (HMAC breaks on modification) | ✓ (proves user logged in) | ✗ (symmetric — server can forge) |
| **AES-256-GCM** | ✓ (ciphertext is unintelligible) | ✓ (auth tag catches tampering) | ✗ | ✗ |
| **RSA-2048 Signature** | ✗ | ✓ (hash mismatch detected) | ✓ (only private key holder can sign) | ✓ (asymmetric — server cannot deny) |
| **Combined (all three)** | ✓ | ✓ | ✓ | Partial |

---

## 6. Security Analysis

### What Attacks Are Prevented

| Attack | Prevention Mechanism | How |
|---|---|---|
| **Data tampering in transit** | RSA-SHA256 digital signature | `verifySignature()` returns false on any payload modification |
| **Ciphertext bit-flipping** | AES-GCM auth tag | `decipher.final()` throws on auth tag mismatch |
| **Unauthenticated access** | JWT middleware | `authenticateToken` returns 401 before route handler executes |
| **Replay with fake credentials** | JWT secret | Cannot forge a valid token without knowing `JWT_SECRET` |
| **Token modification** | JWT HMAC | Changing any JWT field breaks the HS256 signature |
| **Expired token reuse** | JWT `exp` claim | `jwt.verify()` rejects tokens past their expiry time |
| **Signature reuse on different data** | Signature + data binding | `verifySignature()` re-derives hash from current data — old sig fails |

### What Attacks Are Still Possible

| Attack | Reason | Impact |
|---|---|---|
| **No HTTPS** | Server runs plain HTTP on port 3000 | A real MITM can intercept the entire exchange, including the JWT and AES key negotiation. The signature and encryption provide no protection if the key exchange is observed. |
| **JWT secret brute-force** | Hardcoded short string `'demo_super_secret_key_change_in_prod'` | An attacker with a captured token could attempt dictionary/brute-force attacks against the HMAC secret to forge tokens. |
| **AES key never changes** | `AES_KEY` is a module constant | If the AES key leaks (e.g., via memory dump, process inspection), all past and future ciphertexts are decryptable. |
| **Server-side signing is a design flaw** | `/sign-data` lets any authenticated user get a server-signed signature for any data | An authenticated user could sign malicious data via `/sign-data` and then claim it as legitimate. The demo notes this in `app.js:13` but it is architecturally incorrect for a real system. |
| **No password hashing** | Hardcoded plaintext `'password123'` in `auth.js:25` | If the source is exposed, credentials are immediately known. In production, use bcrypt/Argon2. |
| **CORS is fully open** | `app.use(cors())` with no options | Any website in a browser can make requests to this server (CSRF-style attacks). |
| **No rate limiting** | No express-rate-limit or similar | Brute-force login attempts are unrestricted. |
| **JWT payload is readable** | HS256 does not encrypt the payload | Anyone who intercepts the token can Base64-decode the payload and read `username`, `iat`, `exp`. |
| **No input validation** | Endpoints accept arbitrary JSON | `/send-insecure` obviously, but also `/sign-data` and `/encrypt-data` accept any object. |
| **Signature oracle** | `/sign-data` returns server's private-key signature on demand | A user can trick the server into signing arbitrary data, enabling selective data authentication abuse. |

### Threat Model

**Assets:** The data payload (the `amount` transaction), identity (username), and cryptographic material (AES key, RSA private key, JWT secret).

**Adversaries:**
- **Passive eavesdropper:** Can read HTTP traffic. Can capture JWT tokens and encrypted payloads. *Mitigated:* by AES encryption for payload confidentiality. *Not mitigated:* JWT payload is readable; AES key could be reverse-engineered.
- **Active MITM:** Can modify HTTP requests in transit. *Mitigated:* RSA signature detects modification. *Not mitigated:* Without TLS, MITM can replace the entire request (including the signature and JWT) with their own.
- **Malicious authenticated user:** Can call `/sign-data` to get legitimate signatures on arbitrary payloads. *Not mitigated:* This is the demo's key architectural flaw.
- **Unauthenticated attacker:** Can only access `/login`, `/public-key`, and `/send-insecure`. All protected routes return 401.

### Security Strengths
- Correct use of AES-256-GCM (industry standard AEAD cipher)
- Fresh random IV per encryption (`crypto.randomBytes(12)`) — prevents nonce reuse
- RSA-2048 with SHA-256 (minimum recommended standard)
- JWT expiry enforced server-side (`expiresIn: '1h'`)
- Separate error messages for expired vs. invalid tokens (good UX for demo)
- Auth tag check throws before application logic sees tampered data
- Signature verified AFTER decryption (correct order — prevents oracle attacks on ciphertext)

### Security Weaknesses
- No TLS (the single most critical missing layer)
- Hardcoded JWT secret as a source-code constant
- AES key never rotated
- Server-side signing (architecturally incorrect for real non-repudiation)
- No password hashing
- Fully permissive CORS
- No rate limiting
- RSA PKCS1v1.5 padding used (not OAEP/PSS) — acceptable for signatures but noted

---

## 7. Demonstration Flow

### Scenario 0 — Login (prerequisite)

**Button:** Login (demo / password123)

**Client action (`app.js:56–79`):**
```javascript
POST /login { username: "demo", password: "password123" }
```

**Server action (`index.js:32–43`):**
1. Compares `username === DEMO_USER.username` and `password === DEMO_USER.password`
2. Match → calls `generateToken("demo")` → HS256 JWT with `exp = now + 1h`
3. Returns `{ token: "eyJ..." }`

**Client response:**
- Stores token in `jwtToken` variable
- Updates `#token-display` to show truncated token in green
- Logs: `"SUCCESS: Login successful. JWT token received."`

**Why this matters for the demo:** The JWT is the gatekeeper — without it, scenarios 3 and 4 return "ERROR: You must login first!" before making any API call.

---

### Scenario 1 — Send Normal Data (Insecure)

**Button:** 1 · Send normal data (insecure)

**Client action:**
```javascript
POST /send-insecure { amount: 100, from: "Alice", to: "Bob" }
// No Authorization header
```

**Server action (`index.js:91–102`):**
```javascript
const data = req.body;           // blindly reads whatever was sent
res.json({ status: "accepted", warning: "No validation performed!", received: data });
```

**No checks. No auth. No validation. Data accepted unconditionally.**

**What happens internally:** The `req.body` object (parsed by `express.json()`) is returned directly. The server has no knowledge of whether the data is legitimate.

**Why it is insecure:** There is nothing preventing any client — legitimate or malicious — from sending any values in any field.

---

### Scenario 2 — Tamper Data and Send (Attack Succeeds)

**Button:** 2 · Tamper data and send (attack)

**How tampering is performed (`app.js:131–146`):**
```javascript
// "Alice" wants to send amount: 100
// Attacker intercepts and changes to:
POST /send-insecure { amount: 99999, from: "Alice", to: "Attacker" }
```

**Server action:** Identical to Scenario 1 — accepts unconditionally. Returns:
```json
{ "status": "accepted", "received": { "amount": 99999, "from": "Alice", "to": "Attacker" } }
```

**Why the server accepts it:** There is no mechanism to distinguish `amount: 100` from `amount: 99999`. The server sees only a valid JSON body. There is no signature, no token, no checksum.

**Demo impact:** This is the attack scenario — it makes the problem viscerally clear before demonstrating the solution.

---

### Scenario 3 — Send Secure Data (Signed + Encrypted)

**Button:** 3 · Send secure data (signed + encrypted)

**What cryptographic operations occur (client-side, `app.js:151–191`):**

**Step 1 — Sign the original data:**
```javascript
POST /sign-data   Authorization: Bearer <JWT>
{ data: { amount: 100, from: "Alice", to: "Bob" } }
→ { signature: "BASE64_RSA_SIG..." }
```
Server computes `RSASHA256(JSON.stringify({amount:100,from:"Alice",to:"Bob"}))` with its private key.

**Step 2 — Encrypt the data:**
```javascript
POST /encrypt-data   Authorization: Bearer <JWT>
{ data: { amount: 100, from: "Alice", to: "Bob" } }
→ { iv: "BASE64...", ciphertext: "BASE64...", authTag: "BASE64..." }
```
Server generates fresh 12-byte IV, encrypts with AES-256-GCM, returns IV+ciphertext+authTag.

**Step 3 — Send to secure endpoint:**
```javascript
POST /send-secure   Authorization: Bearer <JWT>
{ encryptedPayload: {iv, ciphertext, authTag}, signature: "BASE64_RSA_SIG..." }
```

**Server processing order (`index.js:118–159`):**
1. `authenticateToken` → verifies JWT → passes
2. `decryptData(encryptedPayload)` → decrypts with AES-256-GCM → `{ amount: 100, from: "Alice", to: "Bob" }`
3. `verifySignature(decryptedData, signature)` → `SHA256(JSON.stringify(decryptedData))` matches → returns `true`
4. Returns `{ status: "accepted", message: "Data is authentic and untampered." }`

**Why the request is accepted:** All three layers pass. The decrypted data matches the signed data exactly.

---

### Scenario 4 — Tamper Signed Data (Attack Fails)

**Button:** 4 · Tamper signed data (blocked!)

**How tampering is performed (`app.js:196–237`):**
```javascript
// 1. Get legitimate signature for original data:
POST /sign-data { data: { amount: 100, from: "Alice", to: "Bob" } }
→ signature_for_100   ← valid RSA signature for amount:100

// 2. Encrypt the TAMPERED data (different payload):
POST /encrypt-data { data: { amount: 99999, from: "Alice", to: "Attacker" } }
→ { iv, ciphertext, authTag }   ← AES encryption of TAMPERED data

// 3. Send tampered data with MISMATCHED signature:
POST /send-secure {
  encryptedPayload: <encrypted amount:99999>,   ← tampered
  signature: signature_for_100                   ← belongs to amount:100
}
```

**Server processing:**
1. JWT check → passes (token is still valid)
2. `decryptData()` → decrypts successfully → `{ amount: 99999, from: "Alice", to: "Attacker" }`
3. `verifySignature({ amount: 99999, ... }, signature_for_100)`:
   - Computes `SHA256(JSON.stringify({ amount: 99999, ...}))` → hash_tampered
   - Decrypts `signature_for_100` → hash_original (for `amount: 100`)
   - `hash_tampered ≠ hash_original` → returns `false`
4. Returns `400 { status: "rejected", error: "Tampered data detected! Signature verification failed." }`

**Why the request is rejected:** SHA-256 is a one-way function — changing `100` to `99999` produces a completely different hash. The RSA signature is bound to the hash of the original data. No attacker without the private key can produce a valid signature for the tampered data.

---

## 8. Data Flow

### Complete Request Lifecycle — Secure Path

```
CLIENT (browser)
│
├─ (1) LOGIN
│   POST /login {username, password}
│       → Server: compare DEMO_USER → jwt.sign({username}, SECRET) → JWT
│       ← {token: "eyJ..."}
│   Client stores JWT in memory (jwtToken variable)
│
├─ (2) SIGN REQUEST
│   POST /sign-data {data: {amount:100, from:"Alice", to:"Bob"}}
│       Authorization: Bearer <JWT>
│       → Middleware: jwt.verify(token, SECRET) → OK → req.user set
│       → Server: JSON.stringify(data) → SHA256 → RSA_sign(hash, PRIVATE_KEY)
│       ← {signature: "BASE64_SIG"}
│
├─ (3) ENCRYPT REQUEST
│   POST /encrypt-data {data: {amount:100, from:"Alice", to:"Bob"}}
│       Authorization: Bearer <JWT>
│       → Middleware: jwt.verify() → OK
│       → Server: randomBytes(12) → IV; AES-256-GCM(data, AES_KEY, IV) → ciphertext + authTag
│       ← {iv: "B64", ciphertext: "B64", authTag: "B64"}
│
├─ (4) SECURE SEND
│   POST /send-secure
│       Authorization: Bearer <JWT>
│       Body: {encryptedPayload: {iv,ciphertext,authTag}, signature: "B64"}
│       │
│       ├─ LAYER 1: authenticateToken middleware
│       │   jwt.verify(token, SECRET, callback)
│       │   ├─ Expired → 401 "Token expired"
│       │   ├─ Bad sig → 403 "Invalid token"
│       │   └─ OK → req.user = {username:"demo"} → next()
│       │
│       ├─ LAYER 2: AES-256-GCM Decryption
│       │   createDecipheriv('aes-256-gcm', AES_KEY, IV)
│       │   setAuthTag(authTag)
│       │   decipher.final()  ← throws if authTag mismatch
│       │   └─ Throw → 400 "Decryption failed"
│       │   → decryptedData = {amount:100, from:"Alice", to:"Bob"}
│       │
│       ├─ LAYER 3: RSA-SHA256 Signature Verification
│       │   JSON.stringify(decryptedData) → compute SHA256
│       │   RSA_verify(signature, PUBLIC_KEY) → compare hashes
│       │   └─ Mismatch → 400 "Tampered data detected!"
│       │
│       └─ ALL PASS → 200 "Data is authentic and untampered"
│           {status:"accepted", received:{amount:100,...}}
│
SERVER (Node.js / Express on :3000)
```

---

## 9. Presentation Preparation

### 30-Second Project Summary

> "This project is a live security demonstration showing how cryptography prevents data tampering. We have two endpoints: one with no protection that accepts any data — including fake data with a forged amount — and one that uses JWT authentication, AES-256-GCM encryption, and RSA digital signatures. On the insecure endpoint, changing `amount: 100` to `amount: 99999` succeeds. On the secure endpoint, the same change fails because the RSA signature doesn't match the tampered data. The server detects the forgery and rejects the request."

---

### 1-Minute Project Summary

> "The project demonstrates the classic fake data problem: without validation, a server blindly accepts any JSON it receives. We built two systems side by side.
>
> The first system has no protection. You can send `{ amount: 100 }`, then send `{ amount: 99999 }` as an attacker — the server accepts both, no questions asked.
>
> The second system uses three cryptographic layers. First, JWT authentication — every request must prove identity with a signed token. Second, AES-256-GCM encryption — data is encrypted in transit so it cannot be read or modified. Third, RSA digital signatures — before sending data, the client signs it with the server's private key; the server verifies the signature on receipt.
>
> When an attacker tries to tamper the amount and reuse the old signature, the SHA-256 hash of the new data doesn't match the hash in the signature — the request is rejected with 'Tampered data detected.' Cryptography wins."

---

### 3-Minute Project Explanation

> "The problem we're solving is fake data injection. In any system where a client sends data to a server — a payment amount, a transaction record, a user action — there is nothing inherently stopping a malicious client from sending false values. Traditionally, developers have relied on trust: 'only our client will call this endpoint.' That assumption is wrong.
>
> We demonstrate this with a simple transaction: Alice sends Bob 100 units. On the insecure endpoint, any attacker can substitute 99999 and the server has no way to detect it. This is Scenario 2 in the demo.
>
> Our solution combines three well-established cryptographic mechanisms:
>
> **JWT for authentication.** When the user logs in, the server signs a JSON Web Token using HMAC-SHA256 with a secret key. Every subsequent request must include this token in the Authorization header. The server verifies the token on every protected request. A forged, modified, or expired token is rejected before the request even reaches the application logic.
>
> **AES-256-GCM for encryption.** The payload is encrypted using the Advanced Encryption Standard in Galois/Counter Mode. GCM is what we call an AEAD cipher — Authenticated Encryption with Associated Data. It provides confidentiality, so the data is unreadable in transit, AND integrity, because GCM produces a 128-bit authentication tag. If even one bit of the ciphertext is modified, decryption throws an error and the request is rejected before any application code processes the data.
>
> **RSA digital signatures for data integrity and authenticity.** Before transmission, the data is serialised to JSON, hashed with SHA-256, and the hash is signed with the server's 2048-bit RSA private key. The server verifies this signature using the corresponding public key. RSA signatures are asymmetric — only the private key can produce them, but anyone with the public key can verify them. Any modification to the data — changing a single character — produces a completely different SHA-256 hash, which won't match the decrypted signature.
>
> Scenario 4 is the critical demo: we get a legitimate signature for `amount: 100`, then encrypt a tampered payload with `amount: 99999`, and send both to the server. The server decrypts the data correctly, but when it verifies the signature, the hash of `{ amount: 99999 }` does not match the hash stored in the signature for `{ amount: 100 }`. The request is rejected. Cryptography works."

---

### Main Project Advantages
1. **Pedagogically complete** — demonstrates both the problem AND the solution side by side in one UI
2. **Zero external crypto** — uses Node.js built-in `crypto` (OpenSSL) — no third-party crypto library risk
3. **Correct algorithm choices** — AES-256-GCM (AEAD), RSA-2048-SHA256, HS256 JWT — all current industry standards
4. **Layered security** — three independent layers; compromising one does not compromise the others
5. **Visual live log** — real-time colour-coded feedback makes the demo compelling during a presentation
6. **Clean code** — well-commented, single-file server, minimal dependencies

---

## 10. Defense Questions & Answers

### Most Likely Professor Questions

**Q: Why did you choose AES-256-GCM instead of AES-256-CBC?**
> A: GCM mode provides Authenticated Encryption with Associated Data (AEAD). It simultaneously ensures confidentiality (data cannot be read) AND integrity (any modification to the ciphertext is detected via the authentication tag). CBC provides only confidentiality — an attacker can flip bits in the ciphertext without breaking decryption, which enables padding oracle attacks. GCM's auth tag eliminates this class of attacks. For any modern system, GCM (or ChaCha20-Poly1305) is the correct choice.

**Q: Why is the RSA key pair regenerated every time the server restarts?**
> A: This is a demo simplification. In production, the private key would be stored in a Hardware Security Module (HSM) or a secrets manager (e.g., AWS KMS, HashiCorp Vault). Regenerating per restart means any old signatures become unverifiable after restart. For the demo, this is acceptable because all operations happen within one session.

**Q: What is the purpose of the IV in AES-GCM?**
> A: The Initialisation Vector ensures that encrypting the same plaintext twice produces different ciphertexts. Without a fresh random IV, an attacker seeing two identical ciphertexts would know the plaintexts are identical (known as a "known-plaintext" information leak). AES-GCM requires a 96-bit (12-byte) IV. Critically, the same (key, IV) pair must never be reused — doing so catastrophically breaks GCM's integrity guarantees. We use `crypto.randomBytes(12)` for every encryption call, making IV collision negligible.

**Q: Why does the server sign data on behalf of the client in `/sign-data`?**
> A: This is a demo architecture shortcut. In a real system, the client would generate its own RSA key pair, register the public key with the server, and sign data locally using its own private key — which never leaves the client. We centralised signing on the server to avoid implementing client-side RSA key generation (which would require the Web Crypto API's `generateKey` + `sign` in the browser) to keep the demo scope manageable. The code comments in `app.js:11–13` explicitly acknowledge this.

---

### Technical Questions

**Q: What is the difference between PKCS8 and SPKI key formats?**
> A: PKCS8 (Private-Key Information Syntax) is the standard container format for private keys — it wraps the key with algorithm identifier information. SPKI (SubjectPublicKeyInfo) is the equivalent for public keys, used in X.509 certificates. Both are the standard formats for PEM-encoded keys. We use PKCS8 for the private key and SPKI for the public key, matching what the Node.js `crypto` module expects.

**Q: What is the difference between `jwt.sign` and `crypto.createSign`?**
> A: `jwt.sign` uses HMAC-SHA256 (symmetric) — the same secret is used for both signing and verification. This means the server can both create and verify tokens (suitable for authentication). `crypto.createSign` uses RSA (asymmetric) — the private key signs, the public key verifies. This enables non-repudiation: the server can prove a specific private key holder signed the data, and anyone with the public key can verify it.

**Q: Why does `verifySignature` call `JSON.stringify` again instead of verifying the raw ciphertext?**
> A: Because we verify the signature against the **decrypted** data, not the ciphertext. The signature was computed over `JSON.stringify(originalData)`. After decryption we have `decryptedData` — we re-serialise it with `JSON.stringify` to reproduce the exact same byte sequence that was originally signed. This two-step approach (decrypt first, then verify) is architecturally important: we verify what the data actually says, not just that the ciphertext was intact.

---

### Cryptography Questions

**Q: What does RSA-SHA256 mean? Are RSA and SHA256 separate operations?**
> A: Yes, they are separate. SHA-256 is a hash function that maps any input to a fixed 256-bit (32-byte) output. RSA is a public-key algorithm that can encrypt/decrypt fixed-size blocks. Because RSA can only sign fixed-size data efficiently, we hash the payload first (SHA-256 → 32 bytes), then RSA-encrypt the hash with the private key. Verification re-hashes the received data and RSA-decrypts the signature with the public key to recover the original hash, then compares. This is the RSASSA-PKCS1-v1_5 scheme.

**Q: What would happen if an attacker tried a length extension attack on the SHA-256 hash?**
> A: Length extension attacks apply to Merkle-Damgård constructions like SHA-256 when used directly as a MAC (e.g., `SHA256(secret || message)`). Since we use RSA signatures (not HMAC with SHA-256), length extension attacks do not apply here. The RSA operation over the hash prevents any such manipulation.

**Q: If an attacker knows the IV, can they decrypt the AES-GCM ciphertext?**
> A: No. The IV is not secret — it is transmitted in plaintext alongside the ciphertext. The security of AES-GCM depends on the **key** remaining secret, not the IV. The IV's only security requirement is uniqueness (per key). Knowing the IV without the key provides no decryption capability.

**Q: What happens if the same IV is used twice with the same AES key?**
> A: This is catastrophic for GCM. With the same (key, IV) pair, an attacker who observes two ciphertexts can XOR them to cancel the keystream and learn information about both plaintexts. More critically, GCM's authentication tag becomes forgeable — the attacker can authenticate arbitrary ciphertext. This is why IV reuse is the single most dangerous mistake in GCM usage. We avoid it with `crypto.randomBytes(12)` per call.

---

### Security Questions

**Q: What is a replay attack and does this demo prevent it?**
> A: A replay attack is when an attacker records a legitimate request and re-sends it later. This demo does **not** prevent replay attacks. A captured valid `/send-secure` request (with correct JWT, encrypted payload, and signature) could be replayed as-is. Prevention requires request timestamps (`iat` with tight tolerance) or nonces (one-time tokens per request), neither of which is implemented.

**Q: Can an attacker who captures the JWT impersonate the user?**
> A: Yes, for the duration of the token's validity (1 hour). Without HTTPS, the JWT travels in plaintext HTTP headers and can be trivially captured by a network observer (MITM). In production, TLS prevents this. Additionally, there is no token revocation mechanism — a stolen JWT remains valid until expiry.

**Q: Why is `/send-insecure` included in a production-quality server?**
> A: It is not intended for production — it is a deliberate demonstration endpoint. Its presence illustrates the contrast between protected and unprotected behaviour. In the academic context, having it run in the same server makes the demo self-contained and the comparison immediate and visceral. In any real system it would not exist.

**Q: What would a "complete" secure system add to this implementation?**
> A: In order of priority: (1) TLS/HTTPS — the single most important missing layer. (2) Password hashing with bcrypt or Argon2. (3) Client-side key generation — client holds its own private key, eliminating the `/sign-data` server-signing anti-pattern. (4) Request nonces to prevent replay attacks. (5) Shorter JWT expiry + refresh token rotation. (6) Rate limiting on `/login`. (7) Environment-variable secrets instead of hardcoded strings.

---

## 11. UML and Architecture Descriptions

### Class Diagram Description

The system has no OOP classes — it is procedurally structured. Conceptually:

```
Module: auth.js
  ├── DEMO_USER: {username, password}
  ├── JWT_SECRET: string
  ├── JWT_EXPIRES: string
  ├── generateToken(username: string): string
  └── authenticateToken(req, res, next): void  [Express middleware]

Module: cryptoUtils.js
  ├── privateKey: RSA-2048 PEM (module-level, secret)
  ├── publicKey: RSA-2048 PEM (module-level, exported)
  ├── AES_KEY: Buffer[32] (module-level, secret)
  ├── signData(data: object): string [Base64]
  ├── verifySignature(data: object, signature: string): boolean
  ├── encryptData(data: object): {iv, ciphertext, authTag}
  └── decryptData({iv, ciphertext, authTag}): object

Module: index.js (Express App)
  ├── POST /login
  ├── GET  /public-key
  ├── POST /sign-data   [→ authenticateToken]
  ├── POST /encrypt-data [→ authenticateToken]
  ├── POST /send-insecure [no middleware]
  └── POST /send-secure   [→ authenticateToken]

Client: app.js
  ├── jwtToken: string | null
  ├── login(): Promise<void>
  ├── requestSignature(data): Promise<string>
  ├── requestEncryption(data): Promise<{iv,ciphertext,authTag}>
  ├── sendInsecure(): Promise<void>
  ├── tamperInsecure(): Promise<void>
  ├── sendSecure(): Promise<void>
  └── tamperSigned(): Promise<void>
```

### Component Diagram Description

```
┌─────────────────────────────────────────────────┐
│  Node.js Process (port 3000)                    │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Express Application (index.js)         │   │
│  │                                         │   │
│  │  Global Middleware:                     │   │
│  │    cors() → express.json() → static()   │   │
│  │                                         │   │
│  │  Routes:                                │   │
│  │  ┌────────────┐  ┌──────────────────┐   │   │
│  │  │ /login     │  │ /sign-data       │   │   │
│  │  │ /public-key│  │ /encrypt-data    │◄──┼─┐ │
│  │  └──────┬─────┘  │ /send-secure     │   │ │ │
│  │         │        └────────┬─────────┘   │ │ │
│  │         │                 │             │ │ │
│  │  ┌──────▼─────────────────▼──────────┐ │ │ │
│  │  │        auth.js                    │ │ │ │
│  │  │  generateToken()                  │ │ │ │
│  │  │  authenticateToken() [middleware] ─┼─┘ │ │
│  │  └───────────────────────────────────┘   │ │
│  │                                          │ │
│  │  ┌───────────────────────────────────┐   │ │
│  │  │        cryptoUtils.js             │   │ │
│  │  │  RSA-2048 key pair (in-memory)    │   │ │
│  │  │  AES-256 key (in-memory)          │   │ │
│  │  │  signData() verifySignature()     ├───┘ │
│  │  │  encryptData() decryptData()      │     │
│  │  └───────────────────────────────────┘     │
│  └─────────────────────────────────────────────┘
└─────────────────────────────────────────────────┘
        ▲ HTTP (no TLS)
        │
┌───────┴────────────────────────────────┐
│  Browser (client/)                     │
│  index.html — UI layout                │
│  app.js — fetch() calls, log display   │
│  State: jwtToken (in memory)           │
└────────────────────────────────────────┘
```

### Deployment Diagram Description

```
Development Machine
├── Node.js runtime
│    └── server/index.js listening on :3000
│         ├── Serves static files from client/
│         ├── In-memory state: RSA keys, AES key
│         └── No database, no external services
└── Browser
      └── http://localhost:3000/ → index.html + app.js
           └── fetch() → http://localhost:3000/{endpoints}

No Docker. No database. No external APIs.
No HTTPS. No persistent storage. Single process.
```

### Data Flow Diagram Description

```
Level 0 (Context):
  [User] → (Demo System) → [Server Log Output]

Level 1 (Main processes):
  [User]
    │── Credentials ──► (P1: Authenticate) ──► JWT ──► [Token Store]
    │── Data ──────────► (P2: Sign)  ──────────────────► Signature
    │── Data ──────────► (P3: Encrypt) ───────────────► Encrypted Blob
    │── Encrypted+Sig ─► (P4: Verify & Accept/Reject) ─► Response
    │── Raw Data ──────► (P5: Insecure Accept) ────────► Response

Level 2 (P4 detail — /send-secure):
  [Encrypted Blob + Signature + JWT]
    │── JWT ──────────► (P4a: JWT Verify)       [JWT Secret]
    │── Enc Blob ─────► (P4b: AES Decrypt)      [AES Key]
    │                    └─ decryptedData
    │── decryptedData + Signature ─► (P4c: RSA Verify) [Public Key]
    └── Result ──────────────────────────────────────► Accept/Reject
```

---

## 12. Improvement Suggestions

### Critical Security Fixes (Required for Any Production Use)

| # | Issue | Fix |
|---|---|---|
| 1 | **No TLS** | Add `https.createServer({key, cert}, app)` with a self-signed cert for demo; use Let's Encrypt for production |
| 2 | **Hardcoded JWT secret** | Load from `process.env.JWT_SECRET`; require minimum 256-bit entropy |
| 3 | **Plaintext password storage** | Replace `DEMO_USER.password = 'password123'` with bcrypt hash; use `bcrypt.compare()` on login |
| 4 | **Server-side signing anti-pattern** | Move RSA key generation to the client using Web Crypto API `subtle.generateKey('RSASSA-PKCS1-v1_5', ...)` and `subtle.sign(...)` |
| 5 | **No replay attack prevention** | Add a `nonce` (UUID) to each signed payload; server tracks used nonces with TTL equal to JWT expiry |
| 6 | **AES key never rotated** | Generate AES key per session or derive it via ECDH key exchange |
| 7 | **Permissive CORS** | Replace `cors()` with `cors({ origin: 'http://localhost:3000' })` |
| 8 | **No rate limiting** | Add `express-rate-limit` to `/login` (e.g., 5 attempts per 15 minutes) |

### Missing Security Features

| Feature | Why It Matters |
|---|---|
| **Token revocation / blacklist** | Stolen JWTs valid until expiry — need Redis-based denylist or short-lived tokens + refresh |
| **Signature scheme upgrade** | Use RSASSA-PSS instead of PKCS1-v1_5 for signatures (PSS is probabilistic, stronger theoretical security) |
| **Request timestamp validation** | Include `timestamp` in signed payload; reject requests older than N seconds |
| **Input validation** | Validate data schema before signing/encrypting — `amount` should be a positive number, not arbitrary JSON |
| **Key fingerprint verification** | Client should verify the public key from `/public-key` against a known fingerprint to prevent key substitution |
| **Structured logging** | Replace `console.log` with a structured logger (e.g., `pino`) with log levels and request IDs |

### Production-Grade Enhancements

| Enhancement | Implementation |
|---|---|
| **Persistent keys** | Store RSA private key in AWS KMS / HashiCorp Vault; never in process memory |
| **Proper PKI** | Issue an X.509 certificate for the public key signed by a CA instead of bare PEM |
| **Session management** | Implement refresh token rotation with Redis-backed sessions |
| **Database users** | Replace hardcoded `DEMO_USER` with PostgreSQL + Argon2-hashed passwords |
| **Client-side crypto** | Implement full client-side signing with Web Crypto API to demonstrate real-world key distribution |
| **Docker** | Containerise with `node:20-slim`, inject secrets via environment variables |
| **CI/CD** | Add automated security scanning (`npm audit`, `eslint-plugin-security`) |
| **Key rotation** | Implement automated RSA key rotation with signature grace period |
| **OpenAPI spec** | Document all endpoints with Swagger/OpenAPI for engineer clarity |
| **Unit tests** | Add Jest tests for `signData/verifySignature` round-trip, tamper detection, JWT expiry |

---

*Report generated from direct source code analysis. Every conclusion references specific files and line numbers in the codebase.*
