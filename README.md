# Fake Data Prevention with Conventional Cryptographic Tools

**SEC-PRJ-7E_25** — University Security Project

A fully working demonstration of how conventional cryptographic tools prevent fake and tampered data from being accepted by a server. The project implements and contrasts a vulnerable endpoint against a four-layer protected endpoint, making each security control directly observable.

---

## Overview

Without integrity controls, any party with network access can submit arbitrary JSON to a server. For example, `{ "amount": 99999 }` is accepted identically to `{ "amount": 100 }` — the server has no way to tell the difference. This project demonstrates the attack and its cryptographic prevention.

---

## Security Features

| Layer | Technology | Standard | Purpose |
|---|---|---|---|
| Transport | TLS / HTTPS | X.509, RSA-2048 | Encrypts all traffic; prevents passive eavesdropping |
| Authentication | JWT (HS256) | RFC 7519 | Stateless identity verification; rejects unsigned or expired tokens |
| Confidentiality | AES-256-GCM | NIST SP 800-38D | Encrypts payload; authentication tag detects ciphertext tampering |
| Integrity | RSA-2048 + SHA-256 | PKCS#1 v1.5 | Digital signature; any field modification breaks verification |
| Replay Protection | UUID nonce | RFC 9562 | One-time value inside signed payload; server rejects duplicate nonces |
| Password Security | bcrypt | Cost factor 10 | Slow salted hash; resistant to brute-force attacks |

---

## Installation

```bash
npm install
```

---

## Environment Setup

```bash
cp .env.example .env
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the result as `JWT_SECRET` in `.env`.

---

## TLS Certificate

Generate a self-signed certificate for localhost:

```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout server/key.pem -out server/cert.pem \
  -days 365 -nodes -subj "/CN=localhost"
```

---

## Running

```bash
npm start
```

Open: **https://localhost:3000**

On first visit: click **Advanced** → **Proceed to localhost (unsafe)**. This warning is expected for a self-signed certificate and only appears once per browser session.

---

## Demonstration Scenarios

Run the scenarios in order using the UI buttons:

| # | Action | Expected Result | What It Demonstrates |
|---|---|---|---|
| 0 | **Login** | JWT issued | bcrypt credential verification; stateless JWT authentication |
| 1 | **Send normal data** | `accepted` | Baseline — no protection; server trusts all input |
| 2 | **Tamper + send (attack)** | `accepted` | Attack succeeds — `amount: 99999` accepted without challenge |
| 3 | **Send secure data** | `accepted` | All four layers pass: JWT, AES-256-GCM, RSA-2048, nonce |
| 4 | **Tamper signed data** | **rejected** | RSA signature mismatch — tampering detected |
| 5 | **Replay valid request** | **rejected** | Nonce already used — replay attack blocked |

> Scenario 5 requires Scenario 3 to be run first (to capture a valid request).

---

## Project Structure

```
ss7/
├── package.json
├── README.md
├── PROJECT_SUMMARY.md
├── DEFENSE_NOTES.md
├── .env.example
├── .gitignore
├── server/
│   ├── index.js        — Express HTTPS server and all API endpoints
│   ├── auth.js         — JWT generation, bcrypt verification, auth middleware
│   └── cryptoUtils.js  — RSA key pair, digital signing, AES-256-GCM encryption
├── client/
│   ├── index.html      — Demo UI
│   └── app.js          — Scenario logic and API calls
└── tes/
    ├── DEFENSE_NOTES.md
    ├── PRESENTATION.md
    ├── PRESENTATION_NOTES.md
    ├── DEFENSE_SCRIPT.md
    └── TECHNICAL_AUDIT.md
```

---

## API Endpoints

| Method | Path | Protection | Purpose |
|---|---|---|---|
| POST | `/login` | None | Validate credentials; return signed JWT |
| GET | `/public-key` | None | Return RSA public key |
| POST | `/sign-data` | JWT required | Sign data with RSA private key |
| POST | `/encrypt-data` | JWT required | Encrypt data with AES-256-GCM |
| POST | `/send-insecure` | **None** | Vulnerable endpoint — accepts any payload |
| POST | `/send-secure` | JWT + AES + RSA + nonce | Verifies all four cryptographic layers |

---

## Technologies Used

- **Node.js** — Runtime
- **Express** — HTTP server framework
- **jsonwebtoken** — JWT signing and verification
- **bcrypt** — Password hashing (cost factor 10)
- **dotenv** — Environment variable management
- **cors** — Cross-origin policy (restricted to `https://localhost:3000`)
- **Node.js `crypto`** — Built-in AES-256-GCM encryption and RSA-2048 signatures
- **OpenSSL** — TLS certificate generation

---

## Demo Credentials

| Field | Value |
|---|---|
| Username | `demo` |
| Password | `password123` |

These are fixed demo values intentional for classroom demonstration. In production, credentials would be stored in a database with per-user bcrypt hashes.

---

## Remaining Limitations

| Limitation | Notes |
|---|---|
| Self-signed TLS certificate | Expected for localhost; use Let's Encrypt in production |
| In-memory nonce store | Cleared on restart; use Redis with TTL in production |
| Server-side RSA signing | Simplified for demo; real systems use client-side private keys |
| No rate limiting on `/login` | Add `express-rate-limit` for production deployments |

---

## How the Attack and Defense Work

```
WITHOUT PROTECTION (Scenarios 1 & 2)
  Client ──[{ amount: 99999 }]─────────────────────────► Server ──► "accepted"

WITH PROTECTION — Tampering (Scenario 4)
  Client ──[AES({ amount: 99999 }) + sig_for_100]──────► Server
         ──► AES decrypt OK
         ──► RSA verify: hash({amount:99999}) ≠ hash({amount:100})
         ──► Request rejected: signature mismatch

WITH PROTECTION — Replay (Scenario 5)
  Client ──[captured valid payload replayed]────────────► Server
         ──► AES decrypt OK, RSA verify OK
         ──► nonce already in usedNonces Set
         ──► Request rejected: duplicate nonce
```

---

*Project: SEC-PRJ-7E_25 | Course: System Security*
