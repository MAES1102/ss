# Fake Data Prevention with Conventional Cryptographic Tools

**SEC-PRJ-7E_25** — University security presentation demo.

Demonstrates fake-data injection attacks and their prevention using:
JWT authentication · RSA-2048 digital signatures · AES-256-GCM encryption · TLS certificates · bcrypt · Nonce replay protection

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create environment file (copy example and keep as-is for demo)
cp .env.example .env

# 3. Generate TLS certificate (already done — files in server/)
#    To regenerate:
openssl req -x509 -newkey rsa:2048 \
  -keyout server/key.pem -out server/cert.pem \
  -days 365 -nodes -subj "/CN=localhost"

# 4. Start the server
npm start

# 5. Open the UI
open https://localhost:3000
# ⚠ On first visit: click "Advanced" → "Proceed to localhost (unsafe)"
#   This is expected for a self-signed certificate.
```

---

## Project Structure

```
ss7/
├── package.json
├── README.md
├── DEFENSE_NOTES.md    ← Professor Q&A and improvement explanations
├── TECHNICAL_AUDIT.md  ← Full code-level security audit
├── .env                ← JWT secret (not committed to git)
├── .env.example        ← Template for .env
├── .gitignore
├── server/
│   ├── index.js        ← Express HTTPS server + all endpoints
│   ├── cryptoUtils.js  ← RSA key pair, signing, AES encryption
│   ├── auth.js         ← JWT + bcrypt + middleware
│   ├── cert.pem        ← TLS certificate (self-signed, localhost)
│   └── key.pem         ← TLS private key (not committed in production)
└── client/
    ├── index.html      ← Demo UI
    └── app.js          ← Button logic + API calls (5 scenarios)
```

---

## Demo Endpoints

| Method | Path             | Protection               | Purpose                              |
|--------|------------------|--------------------------|--------------------------------------|
| POST   | `/login`         | None                     | Returns JWT (bcrypt password check)  |
| GET    | `/public-key`    | None                     | Returns RSA public key               |
| POST   | `/sign-data`     | JWT required             | Signs data with RSA private key      |
| POST   | `/encrypt-data`  | JWT required             | Encrypts data with AES-256-GCM       |
| POST   | `/send-insecure` | **NONE**                 | Vulnerable — accepts anything        |
| POST   | `/send-secure`   | JWT + AES + RSA + nonce  | Verifies all four layers             |

---

## Demo Scenarios (run in order)

| # | Button | Expected | What it demonstrates |
|---|--------|----------|----------------------|
| 0 | **Login** | JWT issued | Authentication via bcrypt |
| 1 | **Send normal data** | `accepted` | No protection → data trusted blindly |
| 2 | **Tamper + send** | `accepted` ← ATTACK | No crypto → fake `amount: 99999` accepted |
| 3 | **Send secure data** | `accepted` | JWT + AES + RSA + nonce all pass |
| 4 | **Tamper signed data** | **rejected** | RSA detects modified `amount` |
| 5 | **Replay valid request** | **rejected** | Nonce already used → replay blocked |

---

## TLS Certificates

The server runs on **HTTPS** using a self-signed X.509 certificate (`server/cert.pem`).

- Generated with `openssl req -x509` — RSA-2048, valid 365 days, CN=localhost
- Provides the same AES-256 transport encryption as a CA-signed certificate
- The only difference from a CA cert: browsers show a warning on first visit
- Accept the warning once — subsequent requests are fully encrypted

**In production:** replace with a Let's Encrypt certificate for automatic CA trust.

---

## Password Hashing

Passwords are stored as **bcrypt hashes** (cost factor 10), never as plaintext.

```javascript
// server/auth.js
passwordHash: bcrypt.hashSync('password123', 10)
// Verification:
await bcrypt.compare(candidate, DEMO_USER.passwordHash)
```

bcrypt is a slow, salted hash function designed for passwords. At cost factor 10,
each attempt takes ~100 ms — brute-forcing 1 billion passwords takes ~3 years.

---

## Replay Protection

Every secure payload includes a **UUID nonce** embedded inside the signed and encrypted body:

```json
{ "amount": 100, "from": "Alice", "to": "Bob", "nonce": "a4f3c2d1-..." }
```

The server stores accepted nonces in a `Set` and rejects duplicates:
```
Status: rejected
Error:  "Replay attack detected! This nonce has already been used."
```

The nonce is inside the RSA signature — it cannot be swapped without breaking the signature.

---

## Environment Secrets

The JWT signing secret is loaded from `.env` via `dotenv`:

```
# .env  (never commit this file)
JWT_SECRET=6f29fe06c8eec8f6b57293e76f749faeb4fa640339e...
```

The server refuses to start if `JWT_SECRET` is missing:
```
[auth] FATAL: JWT_SECRET is not set in the environment.
```

Generate a new secret:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## How the Cryptography Works

### The Problem (Fake Data)
Without any validation, a server blindly trusts whatever JSON it receives.
An attacker can change `amount: 100` to `amount: 99999` and the server cannot tell the difference.

### TLS / HTTPS
- The self-signed certificate proves server identity and encrypts all transport traffic
- Prevents passive eavesdropping of JWTs and session data
- Required before any application-layer crypto is meaningful

### Digital Signatures (RSA-2048 + SHA-256)
```
Sender:   JSON.stringify(data) → SHA-256 hash → encrypt with PRIVATE KEY → signature
Receiver: JSON.stringify(data) → SHA-256 hash → decrypt sig with PUBLIC KEY → compare
```
If the data changes at all, the hashes no longer match → **rejected**.

### Encryption (AES-256-GCM)
- Data is encrypted — unreadable in transit (confidentiality)
- GCM authentication tag: if ciphertext is tampered, `decipher.final()` throws (integrity)
- Fresh 96-bit random IV per encryption — no nonce reuse

### JWT Authentication (HS256)
```
Header.Payload.Signature   ← all Base64url-encoded
```
- Server signs payload with `JWT_SECRET` (from `.env`) on login
- Every protected request must carry `Authorization: Bearer <token>`
- Expired, forged, or modified tokens fail `jwt.verify()` → **401 / 403**

---

## Credentials (demo only)

| Field    | Value         |
|----------|---------------|
| Username | `demo`        |
| Password | `password123` |

---

## Remaining Limitations

| Limitation | Notes |
|---|---|
| Self-signed certificate | Expected for localhost — use Let's Encrypt in production |
| In-memory nonce store | Cleared on server restart — use Redis with TTL in production |
| Server-side signing (`/sign-data`) | Demo simplification — real systems use client-side private keys |
| No rate limiting | Add `express-rate-limit` to `/login` for production |

---

## Attack Flow Visualised

```
WITHOUT PROTECTION
  Client ──[{ amount: 99999 }]──────────────────────────► Server ──► "accepted" ✗

WITH CRYPTOGRAPHY (Scenario 4 — tampered signature)
  Client ──[AES({ amount: 99999 }) + sig_for_100]────────► Server
         ──► AES decrypt OK
         ──► RSA verify: SHA256({amount:99999}) ≠ SHA256({amount:100})
         ──► "Tampered data detected" ✓

WITH CRYPTOGRAPHY (Scenario 5 — replay)
  Client ──[same valid payload replayed]─────────────────► Server
         ──► AES decrypt OK, RSA verify OK
         ──► nonce "a4f3..." already in usedNonces Set
         ──► "Replay attack detected" ✓
```
