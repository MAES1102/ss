# Project Summary
## SEC-PRJ-7E_25 — Fake Data Prevention with Conventional Cryptographic Tools

---

## 1. Project Objective

Design, implement, and demonstrate a system that prevents fake or tampered data from being accepted by a server, using conventional cryptographic tools: digital signatures, symmetric encryption, authenticated tokens, TLS certificates, and replay protection.

The demonstration compares two endpoints — one without any protection and one with four layers of cryptographic security — to make the value of each control directly observable.

---

## 2. Security Problem

Without integrity controls, any party with network access to a server can submit arbitrary data. For example:

```
POST /send-insecure
{ "amount": 99999, "from": "Alice", "to": "Attacker" }
→ Server responds: ACCEPTED
```

There is no mechanism to distinguish a legitimate request from a fabricated one. This is the baseline vulnerability the project addresses.

---

## 3. Implemented Technologies

| Layer | Technology | Standard | Purpose |
|---|---|---|---|
| **Transport** | TLS | X.509, RSA-2048 | Encrypts channel; prevents eavesdropping of tokens and session data |
| **Authentication** | JWT | HS256 (HMAC-SHA256) | Stateless identity verification; server rejects unsigned or expired tokens |
| **Confidentiality** | AES-256-GCM | NIST SP 800-38D | Encrypts payload in transit; authentication tag detects ciphertext tampering |
| **Integrity** | RSA-2048 + SHA-256 | PKCS#1 v1.5 | Digital signature binds data to signer; any field modification breaks verification |
| **Replay Protection** | UUID nonce | RFC 9562 | One-time value embedded inside signed payload; server rejects previously seen nonces |
| **Password Security** | bcrypt | Cost factor 10 | Slow, salted hash; resistant to brute-force and rainbow table attacks |

---

## 4. Demonstration Scenarios

| # | Scenario | Security Property | Expected Outcome |
|---|---|---|---|
| 0 | Authenticate (Login) | Authentication | JWT issued after bcrypt credential verification |
| 1 | Send data — no protection | Baseline | Server accepts payload without any verification |
| 2 | Tamper data — no protection | Absence of integrity | Modified payload accepted; attack succeeds |
| 3 | Send data — all layers | Confidentiality + Integrity + Authentication + Replay Protection | All layers pass; payload accepted |
| 4 | Tamper signed data | Digital signature integrity | RSA verification fails; request rejected |
| 5 | Replay valid request | Replay protection | Duplicate nonce detected; request rejected |

**Demo workflow:** Run scenarios 0 → 1 → 2 → 3 → 4 → 5 in order. Scenario 5 requires Scenario 3 to be run first (to capture a valid request).

---

## 5. Security Benefits

**Why each layer is necessary:**

- **TLS alone** is not sufficient — it protects the channel but does not prove the payload has not been modified by the sender.
- **Signatures alone** do not prevent replay — a captured valid signed request can be retransmitted.
- **Encryption alone** does not prove authenticity — anyone with the key can encrypt arbitrary data.
- **JWT alone** proves identity but not data integrity — a valid user can send tampered data.
- **All layers together** address: identity, confidentiality, integrity, freshness, and transport security.

---

## 6. Final Conclusion

This project demonstrates that fake data prevention cannot be achieved with a single control. It requires a layered cryptographic approach in which each tool addresses a distinct attack vector:

| Attack Vector | Mitigation |
|---|---|
| Passive eavesdropping | TLS / HTTPS |
| Unauthorized access | JWT authentication |
| Data tampering in transit | RSA-2048 digital signature |
| Payload interception and reading | AES-256-GCM encryption |
| Replay of captured valid requests | Nonce-based replay protection |
| Credential brute-force | bcrypt password hashing |

The implementation uses only conventional, standardized cryptographic tools and remains fully demonstrable in under 10 minutes on a single machine.

---

*Run with: `npm start` → open `https://localhost:3000` → accept the self-signed certificate warning.*
