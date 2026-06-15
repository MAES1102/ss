# Defense Script
## SEC-PRJ-7E_25 — Fake Data Prevention with Conventional Cryptographic Tools
### Complete 5-Minute Presentation Speech

---

*Delivery guidance: Speak at approximately 130 words per minute. Pause at [PAUSE] marks.
Estimated total time: 5 minutes 30 seconds.*

---

### SLIDE 1 — Title

Good morning. My name is [Student Name], and I am presenting project SEC-PRJ-7E_25: Fake Data Prevention with Conventional Cryptographic Tools, developed for the System Security course.

[PAUSE]

---

### SLIDE 2 — The Security Problem

The problem I want to address is fundamental: when a client sends data to a server, what prevents someone from intercepting and modifying it?

Consider a financial transaction. A client sends a request: amount 100, from Alice, to Bob.

Without any integrity controls, an adversary positioned on the network can modify that request — changing the amount to 99999 and the recipient to Attacker — before it reaches the server.

The server receives the modified data and accepts it. It has no mechanism to detect the change.

[PAUSE]

This is not a theoretical edge case. Any unprotected HTTP endpoint is vulnerable to exactly this attack. The server has no way to distinguish a legitimate request from a fabricated one.

---

### SLIDE 3 — Security Objectives

To solve this problem, we need to satisfy five distinct security properties.

First: Authentication — only authorized users should be able to submit requests.

Second: Confidentiality — data must be unreadable if intercepted in transit.

Third: Integrity — any modification to the data must be detectable.

Fourth: Replay Protection — capturing a valid request and retransmitting it must be prevented.

Fifth: Transport Security — the communication channel itself must be encrypted.

[PAUSE]

Each of these properties requires a different cryptographic tool. No single tool satisfies all five.

---

### SLIDE 4 — System Architecture

The system implements four sequential verification layers on the protected endpoint, over an HTTPS connection.

Layer one: JWT authentication. The server verifies the token's cryptographic signature and expiry. If the token is invalid or missing, the request is rejected immediately.

Layer two: AES-256-GCM decryption. The payload is decrypted and the 128-bit authentication tag is verified. Any tampering with the ciphertext is detected at this stage.

Layer three: RSA-2048 digital signature verification. The server computes the SHA-256 hash of the decrypted payload and verifies it against the provided signature. Any modification to the data breaks the hash.

Layer four: Nonce validation. The server checks that the one-time value embedded in the payload has not been used before.

[PAUSE]

If any single layer fails, the request is rejected with a specific error identifying the failure.

---

### SLIDE 5 — Technologies Used

All technologies used are conventional and standardized.

TLS uses a self-signed X.509 certificate for this localhost demonstration. The encryption strength is identical to a CA-issued certificate — the only difference is browser trust establishment.

The JWT uses HMAC-SHA256. AES-256-GCM is an authenticated encryption scheme — it provides both confidentiality and integrity verification in a single operation.

The RSA-2048 digital signature uses SHA-256 as the hashing algorithm. The nonce is a UUID version 4, embedded inside the RSA-signed payload — so it cannot be replaced without invalidating the signature.

Finally, bcrypt with cost factor 10 replaces plaintext password storage, making each verification attempt take approximately 100 milliseconds.

---

### SLIDE 6 — Demonstration Scenarios

The demonstration has five scenarios. Scenarios one and two use the unprotected endpoint to show the vulnerability. Scenarios three through five use the protected endpoint to show the controls in action.

Let me walk through the three most significant scenarios.

---

### SLIDE 7 — Scenario 2: The Attack

In Scenario 2, the adversary sends a modified payload to the insecure endpoint.

The amount is changed from 100 to 99999. The server returns: status accepted.

The root cause is straightforward: no authentication, no signature, no integrity check. The server accepts any JSON it receives.

[PAUSE]

This is the attack that the cryptographic solution must prevent.

---

### SLIDE 8 — Scenario 4: Tampering Detection

In Scenario 4, the adversary attempts the same attack against the protected endpoint.

They first obtain a legitimate RSA signature for the original payload. They then modify the amount to 99999, reusing the original signature.

When the server processes the request, it decrypts the payload successfully. It then computes the SHA-256 hash of the decrypted data and verifies it against the signature using the RSA public key.

The hash of the modified payload does not match the hash that was signed. Signature verification fails.

[PAUSE]

The server returns: signature verification failed. The request is rejected.

This is the fundamental property of a digital signature: any modification — even a single character — produces a completely different hash.

---

### SLIDE 9 — Scenario 5: Replay Attack Prevention

Scenario 5 addresses a more subtle attack.

Even a perfectly valid, correctly signed, encrypted request can be captured from the network and retransmitted. The data is authentic. The signature verifies. The JWT is still valid. Without replay protection, this would be accepted again.

After Scenario 3 succeeds, I retransmit the exact same request — unchanged payload, unchanged ciphertext, unchanged signature.

The server decrypts successfully. The signature verifies. But when it checks the nonce, it finds it has already been recorded from the previous request.

[PAUSE]

The server returns: nonce has already been used. The replay attempt is rejected.

The critical design point is that the nonce is embedded inside the RSA-signed payload. An adversary cannot substitute a fresh nonce without invalidating the signature.

---

### SLIDE 10 — Security Controls Summary

This table summarizes the complete threat model.

For each identified attack vector — unauthorized access, eavesdropping, payload reading, data modification, replay, and credential brute-force — a specific cryptographic control is implemented.

None of these controls is redundant. Each addresses a threat the others do not.

---

### SLIDE 11 — Results

All security objectives have been implemented and verified through the five demonstration scenarios.

The project also includes environment variable secret management — the JWT signing key is loaded from an environment file and the server refuses to start if it is absent — and a restricted CORS configuration that limits cross-origin requests to the server's own origin.

---

### SLIDE 12 — Conclusion

The central conclusion is this.

[PAUSE]

Fake data prevention cannot be achieved with a single cryptographic tool. Authentication alone does not prevent data modification. Encryption alone does not prove authenticity. A digital signature alone does not prevent replay.

Only by combining all four layers — authentication, encryption, digital signature, and nonce — do we achieve a system where every identified attack vector is addressed.

[PAUSE]

This project demonstrates that conventional, standardized cryptographic tools are sufficient to build this protection, and that the architecture to deploy them is achievable at the application level.

Thank you.

---

*End of script — estimated delivery: 5 minutes 15 seconds – 5 minutes 45 seconds*

---

## Anticipated Questions — Short Answers

**"Why use a self-signed certificate rather than Let's Encrypt?"**
A self-signed certificate is appropriate for a localhost demonstration. The TLS encryption is identical. Let's Encrypt would be used in any production deployment.

**"Why is the nonce inside the signature?"**
If the nonce were in an HTTP header or outside the signed payload, an adversary could strip the old nonce and substitute a fresh one, bypassing replay protection entirely. Inside the signature, any nonce modification invalidates the signature.

**"Why bcrypt instead of SHA-256 for passwords?"**
SHA-256 can compute approximately 10 billion hashes per second on consumer GPU hardware. bcrypt at cost factor 10 takes approximately 100 milliseconds per attempt. Brute-forcing one billion passwords would take approximately 3 years rather than 1 second.

**"What happens to the nonce store after a server restart?"**
The store is in-memory for this demonstration. In a production system, Redis with a TTL equal to the JWT expiry window would be used, ensuring nonces persist for exactly as long as the tokens that carried them are valid.

**"Why is HTTPS necessary if you already encrypt the payload with AES?"**
AES encrypts the payload body. Without TLS, the HTTP headers are transmitted in plaintext — including the Authorization header containing the JWT. An eavesdropper could capture the JWT from the header and use it to authenticate as the user. TLS encrypts everything: headers, body, method, and URL.
