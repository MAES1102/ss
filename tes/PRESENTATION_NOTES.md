# Presentation Speaker Notes
## SEC-PRJ-7E_25 — Fake Data Prevention with Conventional Cryptographic Tools

Detailed notes for each slide. Times are approximate.

---

## Slide 1 — Title (0:00 – 0:20)

**On screen:** Title, project code, course name, student name.

**Say:**
"Good morning / afternoon. My name is [Name]. This presentation covers project SEC-PRJ-7E_25: Fake Data Prevention with Conventional Cryptographic Tools. The project was developed for the System Security course."

**Notes:**
- Keep this brief. The title slide should last no more than 20 seconds.
- Make eye contact with the panel before starting.
- Speak clearly and at a measured pace.

---

## Slide 2 — The Security Problem (0:20 – 0:55)

**On screen:** The transaction tampering example.

**Say:**
"The problem I want to address is this: when a client sends data to a server over a network, what prevents an adversary from intercepting that request and modifying its contents? Consider a simple financial transaction: the client sends amount 100 to Bob. Without integrity controls, an adversary positioned between the client and server can modify the amount to 99999 and redirect the funds to a different account. The server receives the modified data and accepts it — because it has no mechanism to distinguish a legitimate request from a fabricated one. This is the core vulnerability."

**Notes:**
- Point to the `amount = 100` → `amount = 99999` example on screen.
- Emphasize: "The server cannot tell the difference." This is the key point.
- Keep the language concrete. Professors appreciate specific, non-abstract examples.
- If asked: this attack is called a man-in-the-middle attack or, at the application layer, a data injection attack.

---

## Slide 3 — Security Objectives (0:55 – 1:30)

**On screen:** Table of five security properties.

**Say:**
"To solve this problem, we need to satisfy five security properties. Authentication ensures only authorized users can submit requests. Confidentiality ensures the data cannot be read in transit. Integrity ensures any modification to the data is detected. Replay protection ensures that even a captured valid request cannot be retransmitted. And transport security protects the underlying communication channel. Each of these properties requires a different cryptographic tool — which I will cover on the next slide."

**Notes:**
- Reference the table on screen as you go through each row.
- Do not read the table verbatim — say it naturally.
- If a professor interrupts to ask why all five are needed, say: "Each property addresses a different attack. I demonstrate this explicitly in the scenarios."

---

## Slide 4 — System Architecture (1:30 – 2:15)

**On screen:** Mermaid flowchart of the four-layer architecture.

**Say:**
"The architecture implements four sequential verification layers on the protected endpoint. First, the JWT is verified — the server checks the token's cryptographic signature and expiry. Second, the AES-256-GCM ciphertext is decrypted — the built-in authentication tag automatically rejects any tampered ciphertext. Third, the RSA digital signature is verified against the decrypted payload. Fourth, the nonce is checked against a server-side record of previously used nonces. If any one of these four layers fails, the request is immediately rejected with a specific error message identifying which layer failed."

**Notes:**
- Walk through the diagram top to bottom with your hand or a pointer.
- Emphasize: "Any single layer failure means immediate rejection."
- If asked about the client side: "The client sends a JWT in the Authorization header, an AES-encrypted payload, and an RSA signature. The nonce is embedded inside the payload."
- The four layers correspond exactly to the four verification steps in `server/index.js`.

---

## Slide 5 — Technologies Used (2:15 – 2:55)

**On screen:** Technology table with standards and purposes.

**Say:**
"Let me briefly describe each technology. TLS uses a self-signed X.509 certificate for this demonstration — the encryption strength is identical to a CA-issued certificate; the only difference is browser trust establishment. The JWT uses HMAC-SHA256 for signing. AES-256-GCM is an authenticated encryption scheme — it provides both confidentiality and a 128-bit authentication tag in a single operation. RSA-2048 with SHA-256 produces the digital signature. The nonce is a UUID version 4 — embedded inside the RSA-signed payload, so it cannot be replaced without invalidating the signature. bcrypt with cost factor 10 replaces plain-text password storage."

**Notes:**
- You do not need to explain every detail. The table is self-explanatory.
- Focus on AES-256-GCM's "authenticated encryption" property — professors often ask about this.
- If asked why RSA and not ECDSA: "RSA-2048 was chosen for clarity and widespread familiarity. ECDSA would provide equivalent security with smaller signatures."
- bcrypt cost factor 10 means approximately 100 milliseconds per verification — mention this if asked about brute-force resistance.

---

## Slide 6 — Demonstration Scenarios (2:55 – 3:20)

**On screen:** Table of five scenarios.

**Say:**
"The demonstration consists of five scenarios run in order. Scenarios 1 and 2 use the unprotected endpoint to establish the baseline and show the attack succeeding. Scenarios 3 through 5 use the protected endpoint. Scenario 3 shows a legitimate request succeeding. Scenario 4 shows a tampered signed request being rejected. Scenario 5 shows a replay attack being rejected. Together they demonstrate the full threat model and the effectiveness of each protection."

**Notes:**
- If you are doing a live demo, transition to the browser here.
- Run: Login → Scenario 1 → 2 → 3 → 4 → 5.
- Each scenario writes its result to the on-screen log panel. Point to the log as you narrate.
- Scenario 5 requires Scenario 3 to run first (it captures the request). Mention this if relevant.

---

## Slide 7 — Scenario 2: Data Tampering Attack (3:20 – 3:55)

**On screen:** Step-by-step attack diagram.

**Say:**
"In Scenario 2, I demonstrate the attack directly. The adversary intercepts the request to the insecure endpoint and modifies the amount field from 100 to 99999. The server accepts the request — status: accepted — because it performs no verification. The root cause is the complete absence of an integrity mechanism. The server cannot distinguish a field value of 100 from a field value of 99999 because no cryptographic binding exists between the client's intent and the received data."

**Notes:**
- This slide should feel like a "this is the problem in action" moment.
- If doing a live demo: show this in the browser log before the slide.
- If asked "why not use HTTPS to prevent this?": "HTTPS encrypts the channel but does not prevent the sender from sending modified data. The threat here is an authorized user or a compromised client, not a passive eavesdropper."

---

## Slide 8 — Scenario 4: Tampering Detection (3:55 – 4:40)

**On screen:** Step-by-step RSA verification diagram.

**Say:**
"In Scenario 4, the adversary attempts the same attack against the protected endpoint. They obtain a legitimate RSA signature for the original payload, then modify the amount field while reusing the original signature. When the server receives the request, it first decrypts the payload successfully. It then computes the SHA-256 hash of the decrypted data and verifies it against the signature using the RSA public key. The hash of the modified payload does not match the hash that was signed — the verification fails. The server returns: signature verification failed. This is the fundamental property of a digital signature: any single-bit modification to the signed data produces a completely different hash."

**Notes:**
- This is the most technically dense slide. Speak slowly.
- The key sentence: "Hash of modified data does not match hash of original signed data."
- If asked about the nonce in this scenario: "The nonce is present and valid — it is not reused. The rejection is caused purely by the signature mismatch on the modified amount field."
- If asked about hash collisions: "SHA-256 has 2^256 possible output values. No practical collision attack exists."

---

## Slide 9 — Scenario 5: Replay Attack Prevention (4:40 – 5:25)

**On screen:** Step-by-step replay detection diagram.

**Say:**
"Scenario 5 addresses a subtler attack. Even a perfectly valid, signed, encrypted request can be captured from the network and retransmitted. In Scenario 3, the legitimate request is accepted and the server records the nonce. In Scenario 5, I retransmit the exact same request — unchanged payload, unchanged ciphertext, unchanged signature, same JWT. The server decrypts successfully, the signature verifies successfully, but when it checks the nonce, it finds it has already been recorded. The request is rejected with: nonce has already been used. The critical design point is that the nonce is embedded inside the RSA signature — an adversary cannot replace it with a fresh nonce without invalidating the signature."

**Notes:**
- This is the most conceptually important scenario — it shows that signatures alone are not sufficient.
- Emphasize the phrase "the nonce is inside the signature."
- If asked about the nonce store on server restart: "The store is in-memory for this demo. In production, Redis with a TTL equal to the JWT expiry would be used."
- If asked about the UUID collision probability: "UUID v4 has 122 random bits. The probability of a collision across 1 million requests is approximately 10^-28."

---

## Slide 10 — Security Controls Summary (5:25 – 5:55)

**On screen:** Attack vs. countermeasure table.

**Say:**
"This table summarizes the complete threat model. For each identified attack vector, a specific countermeasure is implemented. None of these controls is redundant — each addresses a distinct threat that the others do not cover. This is the layered security model the project implements."

**Notes:**
- This is a summary slide. Do not over-explain — the table is self-explanatory.
- Useful as a reference if a professor asks "what attacks does your system protect against?"
- If asked about DoS or SQL injection: "Those are outside the scope of this project, which focuses specifically on data integrity and authenticity."

---

## Slide 11 — Results (5:55 – 6:20)

**On screen:** Implementation checklist.

**Say:**
"All eight security controls defined at the project outset have been implemented. The project meets all stated objectives. Additionally, it includes environment variable secret management — the JWT signing key is loaded from an environment file and the server refuses to start if it is absent — and restricted CORS configuration, which limits cross-origin requests to the server's own origin."

**Notes:**
- Keep this brief. The audience has seen the demo.
- If a professor asks about anything not on the list: refer them to DEFENSE_NOTES.md.
- The "eight" count includes CORS and env vars as bonus controls.

---

## Slide 12 — Conclusion (6:20 – 6:55)

**On screen:** Layered property table and final statement.

**Say:**
"The central conclusion is this: fake data prevention cannot be achieved with a single cryptographic tool. The demonstration scenarios show this concretely. A valid JWT does not prevent data modification. A valid signature does not prevent replay. Encryption does not prove authenticity. Only by combining all four layers — authentication, encryption, signature, and nonce — do we achieve a system where every identified attack vector is addressed. This project demonstrates that conventional, standardized cryptographic tools are sufficient to build this protection, and that the architecture to deploy them is achievable at the application level. Thank you."

**Notes:**
- End with a clear, confident statement.
- Pause briefly before "Thank you."
- After the presentation: the panel will likely ask 1–3 questions. Common questions are in DEFENSE_NOTES.md.
- Keep water nearby. Do not rush the conclusion.

---

## Likely Professor Questions

| Question | Brief Answer |
|---|---|
| Why self-signed certificate? | Same encryption strength as CA-signed. CA-signed certificates establish trust with strangers; for localhost, self-signed is correct. |
| Why not ECDSA instead of RSA? | RSA-2048 chosen for familiarity. Both provide equivalent security. ECDSA would give smaller signatures. |
| Why bcrypt and not SHA-256? | SHA-256 is 10^9 hashes/sec on GPU. bcrypt at cost 10 is ~100ms/attempt — brute force takes years. |
| What happens if the server restarts? | Nonce store cleared. In production: Redis with TTL. JWT expiry is 1 hour, so nonces only need to survive that window. |
| What if an attacker steals the JWT? | They can call the API but cannot produce a valid signature (no private key) and cannot replay Scenario 3 (nonce used). TLS prevents JWT from being captured. |
| Is the nonce cryptographically random? | Yes. `crypto.randomUUID()` uses the Web Crypto API, which sources entropy from the OS CSPRNG. |
| What is AEAD? | Authenticated Encryption with Associated Data. AES-256-GCM provides both confidentiality and a 128-bit authentication tag in one operation. |

---

*Total estimated presentation time: 5 minutes 30 seconds – 6 minutes 55 seconds*
