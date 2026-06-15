# CURRENT_UI_AUDIT.md
## Fake Data Prevention Demo — Complete UI/UX Audit
**Project:** SEC-PRJ-7E_25 | **Audit Date:** June 2026 | **Scope:** `client/index.html` + `client/app.js`

---

## 1. VISUAL OVERVIEW

### Overall Style

The application is a single-page **cyber-security terminal interface** — a live interactive demo designed to look like a professional security operations console. The aesthetic deliberately evokes hacker films, military security dashboards, and retro CRT terminals.

### Colors and Atmosphere

The page rests on a near-black background (`#050505`). Over it, three fixed layers stack invisibly:

1. **Matrix rain canvas** — columns of falling ASCII + katakana characters rendered in three shades of neon green (`#CCFFDD` flash, `#00FF66` mid, `#00883A` dim) at 11% opacity. Subliminal texture, not distraction.
2. **Horizontal scanlines** — `repeating-linear-gradient` at 4px pitch across the full viewport, simulating a CRT monitor display.
3. **Radial vignette** — corners darkened with a `radial-gradient`, drawing the eye to center content.

The identity is anchored to a single accent: **neon green `#00FF66`**. It appears everywhere — panel borders, headings, the blinking cursor, button glows — always with multi-layer `box-shadow` that makes each element appear to emit light. Secondary text (`#A8FFB8`) is soft mint. Descriptions are `#3a6040` — very dark, barely visible at a glance.

Semantic colors: `#00C8FF` cyan for authentication, `#FF5555` red for vulnerability/danger, `#FFD166` amber for warning/attack, `#CC88FF` purple for tampering, `#00E5CC` teal for replay attack.

### Typography

**Entire page is monospace**. Primary: `JetBrains Mono` (loaded via Google Fonts, weights 400/600/700). Fallback: `IBM Plex Mono`. Applied globally — headings, buttons, log, flow, descriptions. There is no sans-serif or serif text anywhere.

### First Impression

Page load is itself a moment: the matrix rain is already moving, then the header slides up from 10px below while fading in, then four glowing terminal panels materialize with staggered 100ms delays, each framed by corner bracket decorators. A blinking neon cursor pulses at the bottom of the log panel before any interaction occurs. The page communicates: *active, monitored, technical* — appropriate for a live project defense.

---

## 2. PAGE STRUCTURE

### Desktop Layout (~1200px)

```
╔══════════════════════════════════════════════════════════════════╗
║  [FIXED z=0] Matrix rain canvas (11% opacity)                    ║
║  [FIXED z=1] Horizontal scanline overlay (body::before)          ║
║  [FIXED z=1] Radial vignette (body::after)                       ║
╠══════════════════════════════════════════════════════════════════╣
║                        SITE HEADER  (z=2)                        ║
║  SEC-PRJ-7E_25 · SECURE CHANNEL ACTIVE · INTEGRITY MODULE ONLINE ║
║  ════════ FAKE DATA PREVENTION DEMO ════════                      ║
║  RSA-2048 · AES-256-GCM · JWT · TLS · Replay Protection          ║
╠══════════════════════╦═══════════════════════════════════════════╣
║ CARD: Authentication ║ CARD: Vulnerable System                   ║
║ ▸ STEP 0 — AUTH[JWT] ║ ▸ VULNERABLE SYSTEM [NO PROTECTION]       ║
║ [token display box]  ║ > 1 · SEND NORMAL DATA (INSECURE)         ║
║ > AUTHENTICATE BTN   ║   ↳ description                           ║
║   ↳ description      ║ > 2 · TAMPER DATA AND SEND (ATTACK)       ║
║                      ║   ↳ description                           ║
╠══════════════════════╬═══════════════════════════════════════════╣
║  [left col empty]    ║ CARD: Secure System                       ║
║                      ║ ▸ SECURE SYSTEM [CRYPTOGRAPHY]            ║
║                      ║ > 3 · SEND SECURE DATA (SIGNED+ENCRYPTED) ║
║                      ║   ↳ description                           ║
║                      ║ > 4 · TAMPER SIGNED DATA (REJECTED)       ║
║                      ║   ↳ description                           ║
║                      ║ > 5 · REPLAY VALID REQUEST (REJECTED)     ║
║                      ║   ↳ description                           ║
╠══════════════════════╩═══════════════════════════════════════════╣
║ CARD: Live Demo Log  (full width, grid-column: 1 / -1)           ║
║ ▸ LIVE DEMO LOG  ●●●(pulsing green dot)           [Clear]        ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │ [scrollable terminal output, 340px, scanline overlay]        │ ║
║ │ Waiting for demo actions…                                    │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║ [SEC-CONSOLE]$ ▋ ← blinking neon cursor                          ║
╠══════════════════════════════════════════════════════════════════╣
║ THEORY PANEL  (full width, grid-column: 1 / -1)                  ║
║ ▸ HOW THE PROTECTION WORKS                                       ║
║ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    ║
║ │ Problem │ │RSA Sign │ │AES-GCM  │ │  JWT    │ │  TLS   │ ... ║
║ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    ║
║ ──────────────────────────────────────────────────────────        ║
║ ▸ SECURE REQUEST FLOW                                            ║
║ [Login→JWT]→[Sign RSA]→[Encrypt AES]→[POST]→[JWT?]→...→[ACCEPT] ║
╚══════════════════════════════════════════════════════════════════╝
```

### Mobile Layout (< 700px)

```
╔═════════════════════╗
║    SITE HEADER      ║
╠═════════════════════╣
║  CARD: Auth         ║
╠═════════════════════╣
║  CARD: Vulnerable   ║
╠═════════════════════╣
║  CARD: Secure       ║
╠═════════════════════╣
║  CARD: Log          ║
╠═════════════════════╣
║  THEORY PANEL       ║
╚═════════════════════╝
```

---

## 3. COMPONENT INVENTORY

### A. Site Header

| Property | Value |
|---|---|
| Tag line | `.header-tag`: `SEC-PRJ-7E_25 · SECURE CHANNEL ACTIVE · INTEGRITY MODULE ONLINE` |
| Color | `#00CC55`, 0.65rem, 0.18em tracking, uppercase, 85% opacity |
| Title `h1` | "FAKE DATA PREVENTION DEMO" — `#00FF66`, 1.45rem, 700w, `text-shadow` glow |
| Rule lines | 1px gradient lines flanking title, fade transparent→green, max 220px each |
| Subtitle | `#3a6040`, 0.72rem — RSA/AES/JWT/TLS tech stack list (very dark) |
| Animation | `fadeSlideIn` 0.7s, slides up 10px on load |

### B. Terminal Panels (Cards)

All 4 cards share identical base style:

- **Background:** `#080d08`
- **Border:** `1px solid rgba(0,255,102,0.45)`, radius 3px
- **Box-shadow:** `0 0 12px rgba(0,255,102,0.45), 0 0 28px rgba(0,255,102,0.15)` + faint inset glow
- **Corner brackets:** Four `<span class="cc cc-tl/tr/bl/br">` — 10×10px L-brackets in `rgba(0,255,102,0.7)`, 2px border, positioned just outside the main border at each corner
- **Accent line:** `::before` pseudo — 1px gradient line at top, animated `accentPulse` 4s infinite (opacity 0.3→1→0.3)
- **Hover:** `translateY(-2px)`, glow expands (`0 0 20px` + `0 0 45px`), border brightens (0.35s transition)
- **Card `h2`:** `#00FF66`, 0.78rem, 700, uppercase, 0.12em tracking, `▸ ` prefix via `::before`
- **Entry animation:** `fadeSlideIn` staggered 0s / 0.1s / 0.2s / 0.3s

### C. Badges

| Class | Text | Color | Border |
|---|---|---|---|
| `.badge-info` | JWT | `#00C8FF` | `rgba(0,200,255,0.5)` |
| `.badge-danger` | NO PROTECTION | `#FF5555` | `rgba(255,85,85,0.6)` |
| `.badge-success` | CRYPTOGRAPHY | `#00FF66` | `rgba(0,255,102,0.5)` |

All: 0.58rem, 2px border-radius, transparent bg tint, box-shadow glow, non-interactive.

### D. Buttons (7 total)

All share: transparent bg, 1px colored border, JetBrains Mono 0.76rem 600w, uppercase, `> ` prefix (CSS `::before`), 2px radius.

| ID | Color | Scenario |
|---|---|---|
| `btn-login` | `#00C8FF` cyan | Step 0: Authenticate |
| `btn-insecure` | `#FF5555` red | Scenario 1: Send insecure |
| `btn-tamper-insecure` | `#FFD166` amber | Scenario 2: Tamper insecure |
| `btn-secure` | `#00FF66` green | Scenario 3: Send secure |
| `btn-tamper-signed` | `#CC88FF` purple | Scenario 4: Tamper signed |
| `btn-replay` | `#00E5CC` teal | Scenario 5: Replay attack |
| `btn-clear` | `#2a5030` dim | Clear log (no `> ` prefix) |

**Hover:** Glow expands (color-matched 18px + 35px rings), border fully solid, faint fill overlay (6% opacity).
**Active:** `scale(0.985)` + 12% fill overlay.

Below each action button: `.btn-description` paragraph at `#2e5535`, 0.7rem — technical explanation of what the button does.

### E. Token Display (`#token-display`)

- **Default:** "No token yet — click Login first." — `#2a5030` (near-invisible), `#040904` bg, `1px solid #1a3520` border
- **After login** (mutated by `app.js`): text changes to `JWT: eyJhbG...` (first 40 chars), `tokenEl.style.color` set to `#b7e4c7` mint, smooth `0.3s` color transition

### F. Live Demo Log Panel

**Header:** Title + traffic light dots (red/yellow/green, green dot has `dotPulse` 2.5s breathing animation) + Clear button

**Scrollable area (`#log`):**
- `#020602` bg, `1px solid #1a4525` border, 340px fixed height
- JetBrains Mono 0.78rem, line-height 1.65, deep inner shadow
- 4px custom scrollbar (`#1a4525` thumb)
- `.log-wrapper::before` scanline overlay on top

**Log entry colors (injected inline by `app.js`):**

| Type | Color | Usage |
|---|---|---|
| `title` | `#ffd60a` gold | Scenario banner (━━ SCENARIO N ━━) |
| `info` | `#a0c4ff` powder blue | Status messages |
| `success` | `#b7e4c7` mint | Accepted results |
| `error` | `#ffb3b3` soft red | Rejections, failures |
| `warning` | `#ffd166` amber | Tampering, replay messages |
| `data` | `#cdb4db` lavender | Raw values (tokens, signatures) |

**Dividers:** `1px solid #444` lines between scenarios

**Footer:** `[SEC-CONSOLE]$` in `#2a6030` + blinking 7×13px neon green block cursor (`blink` 1s `step-end` infinite, `box-shadow: 0 0 5px #00FF66`)

### G. Theory Section

Full-width panel (same styling as cards). Contains:
1. **6 theory item cards** in `auto-fit` grid (min 220px cols): dark `#040904` bg, `#1a3a20` borders, hover brightens
2. **`<hr>`** separator
3. **9-step flow diagram** — flex row, wraps on narrow screens. Each step: dark border, dim `#4a8050` text, hover reveals `#A8FFB8`. Final step (ACCEPT/REJECT) highlighted with full green border + glow.

---

## 4. USER FLOW

```
Open https://localhost:3000
↓ Accept self-signed TLS certificate (Chrome: Advanced → Proceed)
↓ Page loads — matrix rain, staggered panel animations, blinking cursor
↓
[Step 0] Click > AUTHENTICATE
  → POST /login {username:"demo", password:"password123"}
  ← JWT received, stored in jwtToken variable
  ← Token display updates to mint green truncated JWT
  ← Log: [info] Authenticating... [success] JWT issued. [data] Token...
↓
[Scenario 1] Click > 1 · SEND NORMAL DATA (INSECURE)
  → POST /send-insecure {amount:100, from:"Alice", to:"Bob"} (no auth)
  ← Server ACCEPTS without verification
  ← Log: [title] SCENARIO 1 [info] Sending... [success] ACCEPTED [warning] Observation
↓
[Scenario 2] Click > 2 · TAMPER DATA AND SEND (ATTACK)
  → POST /send-insecure {amount:99999, from:"Alice", to:"Attacker"}
  ← Server ACCEPTS tampered data (no integrity check)
  ← Log: [title] SCENARIO 2 [warning] Modified payload [error] ACCEPTED [data] Received
↓
[Scenario 3] Click > 3 · SEND SECURE DATA (requires login)
  → POST /sign-data (Bearer JWT) → signature
  → POST /encrypt-data (Bearer JWT) → encrypted payload
  → POST /send-secure {encryptedPayload, signature} (Bearer JWT)
  ← Server ACCEPTS — all 4 checks pass (JWT + AES + RSA + nonce)
  ← lastSecureRequest stored for Scenario 5
  ← Log: [title] SCENARIO 3 [data] nonce... [data] signature... [success] ACCEPTED
↓
[Scenario 4] Click > 4 · TAMPER SIGNED DATA (requires login)
  → POST /sign-data for ORIGINAL data → signature
  → POST /encrypt-data for TAMPERED data (amount:99999)
  → POST /send-secure {encryptedTamperedPayload, originalSignature}
  ← Server REJECTS — signature mismatch
  ← Log: [title] SCENARIO 4 [warning] Tampering... [error] REJECTED [success] Conclusion
↓
[Scenario 5] Click > 5 · REPLAY VALID REQUEST (requires Scenario 3 first)
  → POST /send-secure with EXACT same lastSecureRequest object
  ← Server REJECTS — nonce already recorded
  ← Log: [title] SCENARIO 5 [warning] Replaying... [error] REJECTED [success] Conclusion
↓
User scrolls to Theory section — reads 6 explanations + flow diagram
User may click [Clear] at any time — log wiped, "Log cleared." appended
```

### State Machine

```
State: UNAUTHENTICATED
  btn-insecure, btn-tamper-insecure → works (no auth required)
  btn-secure, btn-tamper-signed, btn-replay → blocked (logs error, returns)

State: AUTHENTICATED (jwtToken != null)
  All 5 buttons work
  btn-replay → still blocked until Scenario 3 completes

State: SCENARIO 3 DONE (lastSecureRequest != null)
  btn-replay → enabled
  All 5 scenarios fully available
```

---

## 5. DESIGN SYSTEM

### Color Palette

```
CSS Variable     Hex         Role
─────────────────────────────────────────────────────────────
--bg             #050505     Page background
--primary        #00FF66     Primary green: borders, headings, success
--secondary      #00CC55     Header tag text
--text           #A8FFB8     Body text, hover reveals
--danger         #FF5555     Error states, insecure button
--warning        #FFD166     Warning states, attack button, <code>
--panel-bg       #080d08     Card/theory background
--panel-bg2      #040904     Nested background (theory items, token)
--glow           dual green shadow (12px + 28px outer)
─────────────────────────────────────────────────────────────
Static:
#00C8FF   Cyan    btn-login, badge-info
#CC88FF   Purple  btn-tamper
#00E5CC   Teal    btn-replay
#3a6040   Dark    Subtitle, descriptions
#7aaa80   Mint    <strong> in theory

app.js log types:
#ffd60a title · #a0c4ff info · #b7e4c7 success
#ffb3b3 error · #ffd166 warning · #cdb4db data
```

### Typography

```
Font: 'JetBrains Mono', 'IBM Plex Mono', monospace — 100% of page text

Sizes (rem):
  1.45  h1 title
  0.78  card h2, theory h2, log entries
  0.76  buttons
  0.73  theory item h3
  0.72  subtitle, theory p
  0.70  btn-description, token-display
  0.68  btn-clear, log-footer, flow steps
  0.65  header-tag
  0.58  badges

Letter spacing: 0.04–0.18em (higher on headings and tags)
```

### Shadows, Borders, Spacing

```
Panel glow (rest):   0 0 12px rgba(0,255,102,0.45), 0 0 28px rgba(0,255,102,0.15)
Panel glow (hover):  0 0 20px rgba(0,255,102,0.55), 0 0 45px rgba(0,255,102,0.2)
Log inner shadow:    inset 0 0 40px rgba(0,0,0,0.6)
Log cursor glow:     0 0 5px #00FF66

Border-radius: 3px cards/theory · 2px buttons/badges/log/token

Grid gap: 18px (cards) · 12px (theory items)
Body padding: 24px 24px 40px
Card padding: 20px · Theory: 22px · Button: 10px 16px
Log height: 340px fixed

Breakpoint: 700px → single column
```

---

## 6. ANIMATION INVENTORY

| # | Name | Element | Trigger | Duration | Effect |
|---|---|---|---|---|---|
| 1 | Matrix Rain | `#bg-canvas` | Page load (continuous) | 48ms/frame | Falling chars, 3 green shades, 11% opacity, ghosting trail |
| 2 | `fadeSlideIn` | `.site-header` | Page load | 0.7s ease | Opacity 0→1, translateY 10px→0 |
| 3 | `fadeSlideIn` staggered | `.card` ×4 | Page load | 0.6s ease | Same, delays 0 / 0.1 / 0.2 / 0.3s |
| 4 | `fadeSlideIn` | `.theory` | Page load | 0.9s ease | Same, delay 0.35s |
| 5 | `accentPulse` | `.card::before` `.theory::before` | Continuous | 4s ease-in-out ∞ | Top accent gradient line: opacity 0.3→1→0.3 |
| 6 | Card hover glow | `.card:hover` | Mouse enter | 0.35s ease | translateY(-2px), glow expands, border brightens |
| 7 | `blink` | `.log-cursor` | Continuous | 1s step-end ∞ | 7×13px block: opacity 1→0→1 (hard step, not ease) |
| 8 | `dotPulse` | `.ld-g` (green dot) | Continuous | 2.5s ease ∞ | Green traffic dot glow breathes from 5px→20px shadow |
| 9 | Button hover glow | `.btn:hover` | Mouse enter | 0.2s ease | Color ring expands 8px→18px+35px, border solidifies, 6% fill |
| 10 | Button press | `.btn:active` | Mouse down | 0.15s ease | scale(0.985), 12% fill overlay |
| 11 | Theory item hover | `.theory-item:hover` | Mouse enter | 0.3s ease | Border brightens to rgba(0,204,85,0.5), faint glow |
| 12 | Flow step hover | `.flow-step:hover` | Mouse enter | 0.3s ease | Text #4a8050→#A8FFB8, border brightens |

---

## 7. SCREENSHOT SUBSTITUTE — ASCII Visual Descriptions

### State: Initial Load

```
████████████████████████████████████████████████████████████████
█                    [#050505 — near-black]                     █
█  ░░ matrix rain: faint green chars falling in columns ░░      █
█  ═══════════ subtle horizontal scanlines across page ═══════  █
█                                                               █
█      SEC-PRJ-7E_25 · SECURE CHANNEL ACTIVE (dim green)       █
█    ════ FAKE DATA PREVENTION DEMO (NEON GREEN GLOWING) ════   █
█      RSA-2048 · AES-256-GCM · JWT · TLS (very dark)          █
█                                                               █
█  ╔════════════════════╗  ╔══════════════════════════════════╗ █
█  ║ ▸ STEP 0—AUTH [JWT]║  ║ ▸ VULNERABLE SYSTEM [NO PROTECT]║ █
█  ║ [dim token box]    ║  ║ > 1·SEND NORMAL DATA    [red]   ║ █
█  ║ > AUTHENTICATE     ║  ║   ↳ dim description text        ║ █
█  ║   [cyan glow btn]  ║  ║ > 2·TAMPER DATA          [amber]║ █
█  ║   ↳ dim desc       ║  ║   ↳ dim description text        ║ █
█  ╚════════════════════╝  ╚══════════════════════════════════╝ █
█                          ╔══════════════════════════════════╗ █
█                          ║ ▸ SECURE SYSTEM [CRYPTOGRAPHY]  ║ █
█                          ║ > 3·SEND SECURE DATA   [green]  ║ █
█                          ║ > 4·TAMPER SIGNED DATA [purple] ║ █
█                          ║ > 5·REPLAY VALID REQ   [teal]   ║ █
█                          ╚══════════════════════════════════╝ █
█  ╔══════════════════════════════════════════════════════════╗ █
█  ║ ▸ LIVE DEMO LOG  ● ● ●(green pulsing)       [Clear]    ║ █
█  ║ ─────────────────────────────────────────────────────── ║ █
█  ║ Waiting for demo actions…  (very dark green)            ║ █
█  ║                                                         ║ █
█  ║ [340px scrollable, scanlines, deep inner shadow]        ║ █
█  ╚══════════════════════════════════════════════════════════╝ █
█  [SEC-CONSOLE]$ ▋ ← blinking neon green cursor               █
█                                                               █
█  ╔══════════════════════════════════════════════════════════╗ █
█  ║ ▸ HOW THE PROTECTION WORKS                              ║ █
█  ║ ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌──┐║ █
█  ║ │Problem ││RSA Sig ││AES-GCM ││JWT Auth││TLS Cert││No║║ █
█  ║ │Fake    ││        ││        ││        ││        ││nc║║ █
█  ║ └────────┘└────────┘└────────┘└────────┘└────────┘└──┘║ █
█  ║ ────────────────────────────────────────────────────── ║ █
█  ║ ▸ SECURE REQUEST FLOW                                   ║ █
█  ║ [Login]→[Sign]→[Encrypt]→[POST]→[JWT?]→[Dec]→[★ACCEPT]║ █
█  ╚══════════════════════════════════════════════════════════╝ █
████████████████████████████████████████████████████████████████
```

### State: After All 5 Scenarios + Token Active

```
TOKEN DISPLAY: "JWT: eyJhbGciOiJIUzI1NiIsInR5cCI..." [MINT GREEN]

LOG PANEL CONTENT:
────────────────────────────────────────────────────────────────────
[GOLD]    ━━ SCENARIO 1: Baseline — without integrity controls ━━
[BLUE]    Sending: { amount: 100, from: "Alice", to: "Bob" }
[MINT]    Server response: ACCEPTED — no validation was performed.
[AMBER]   Observation: "Data accepted without any signature..."
          ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (divider)
[GOLD]    ━━ SCENARIO 2: Data tampering against unprotected ━━
[BLUE]    Original intent: { amount: 100 }
[AMBER]   Modified payload: { amount: 99999 } ← altered
[RED]     Server response: ACCEPTED — modified data was accepted.
[LAVNDR]  Received: {"amount":99999,"from":"Alice","to":"Attacker"}
[AMBER]   Conclusion: no integrity verification present.
          ─ ─ ─ ─ ─ ─ ─ ─ ─ (divider)
[GOLD]    ━━ SCENARIO 3: JWT + AES-256-GCM + RSA-2048 + nonce ━━
[BLUE]    Preparing data: { amount: 100 ... }
[LAVNDR]  + nonce: 6bc39a71-999e-48a0-926d-5a5450474484
[BLUE]    Requesting RSA-2048 digital signature...
[LAVNDR]  Digital signature received (Base64): Abcd1234...
[BLUE]    Encrypting payload with AES-256-GCM...
[MINT]    Server response: ACCEPTED — all verification layers passed.
[MINT]    "Data integrity verified. Payload accepted."
[LAVNDR]  Note: Request captured for replay (Scenario 5).
          ─ ─ ─ ─ (divider)
[GOLD]    ━━ SCENARIO 4: Tampering against signed payload ━━
[BLUE]    Obtaining legitimate RSA-2048 digital signature...
[AMBER]   Simulating tampering: { amount: 99999, to: "Attacker" }
[AMBER]   Original signature reused without modification.
[RED]     Server response: REJECTED
[RED]     "Signature verification failed."
[MINT]    Conclusion: digital signature verification detected tampering.
          ─ ─ ─ ─ (divider)
[GOLD]    ━━ SCENARIO 5: Replay attack — captured valid request ━━
[AMBER]   Replaying previously accepted payload from Scenario 3...
[AMBER]   Transmitted without modification (network-level attack model).
[RED]     Server response: REJECTED
[RED]     "Nonce already recorded — replay attempt detected."
[MINT]    Conclusion: nonce replay protection confirmed.
────────────────────────────────────────────────────────────────────
[SEC-CONSOLE]$ ▋
```

---

## 8. STRENGTHS

- **Cohesive identity.** Every element — matrix rain, blinking cursor, corner brackets, glow borders, monospace-only text — speaks the same design language. Nothing feels out of place.
- **Semantic color coding.** Each button's unique color maps intuitively to its security meaning: cyan = auth, red = vulnerable, amber = attack, green = secure, purple = tamper, teal = replay. Scannable at a glance during a live demo.
- **Log panel is genuinely impressive.** Scanlines + inner shadow + `[SEC-CONSOLE]$` prompt + blinking cursor + colored log types creates a convincing real terminal appearance when output scrolls during demo.
- **Animation restraint.** Matrix rain at 11% opacity is atmosphere, not noise. Accent pulses and hover glows are slow, smooth, and professional — not cheap or flashy.
- **Staggered load animation.** Cards appearing 100ms apart creates a brief dramatic moment on page load that sets expectations immediately.
- **Confirmed functional correctness.** Server log shows all 5 scenarios completed: login ✓, insecure accept ✓, tamper accept ✓, secure accept ✓, tamper reject ✓, replay reject ✓. Zero regressions.
- **Corner bracket decorators** are a small detail that transforms plain `div`s into HUD-style panels.
- **Typography discipline.** Single font family throughout creates absolute consistency — the page reads like a terminal at all times.

---

## 9. WEAKNESSES

- **Grid imbalance.** Authentication card (left col) and Secure System card (right col) leave opposite columns empty in their rows. The layout feels asymmetric and incomplete at desktop widths.
- **Descriptions are nearly invisible.** `.btn-description` at `#2e5535` and subtitle at `#3a6040` are too dark — on a projector in a bright room, both disappear entirely. The educational content becomes inaccessible.
- **No in-flight loading state.** While async operations run (sign → encrypt → send = 3 sequential requests), there is no visual feedback that anything is happening. Buttons remain fully clickable, allowing accidental double-triggers.
- **Log scrollability is non-obvious.** The 4px custom scrollbar is aesthetically appropriate but nearly invisible. After 5 scenarios, the log is full — users may not realize they can scroll to see earlier entries.
- **Badge size.** At 0.58rem, badges may not be legible from a distance during a projector-based defense. They serve as primary status indicators but are visually small.
- **Theory section body text is unreadably dark.** Theory item paragraphs at `#3a6040` undermine the educational value of the section — the best explanations on the page are also the hardest to read.
- **No server connectivity indicator.** There is no status widget showing whether the HTTPS server is reachable before the user clicks Login. Connection failures only appear in the log after the attempt.
- **Mobile is functional but unoptimized.** Single-column collapse works, but button text may overflow on small screens and the theory grid isn't specifically designed for touch interaction.

---

## 10. REDESIGN OPPORTUNITIES

### Concept A — Cyber Security Operations Center (SOC Dashboard)

**Visual Style:**
A structured multi-panel dashboard inspired by enterprise threat monitoring tools (Splunk, CrowdStrike, Elastic SIEM). Professional, information-dense, corporate. Deep navy backgrounds, electric blue/cyan accents, near-white text for data readability. Less theatrical — more like an actual product being demoed.

**Color System:**
```
Background:  #0a0e1a   (deep navy)
Panel bg:    #0f1526   (dark navy)
Primary:     #0088FF   (security blue)
Secondary:   #00CCFF   (electric cyan)
Text:        #E8EDF5   (near-white)
Success:     #00CC88   (teal-green)
Danger:      #FF4455   (alert red)
Warning:     #FFAA00   (amber)
```

**Layout:**
3-zone dashboard:
1. Top navbar — system status lights, timestamp, project ID, `SECURE CHANNEL ACTIVE` pill badge
2. Left sidebar (220px fixed) — numbered scenario list with status icons (○ pending / ▶ running / ✓ done / ✗ failed); clicking a scenario selects it
3. Main content area — active scenario shown in large format with a **verification pipeline visual**: four sequential check stages (JWT → Decrypt → Signature → Nonce) each animating green ✓ or red ✗ as results arrive

**Animations:**
- Scenario click: sidebar item spins a loading ring (○→▶)
- Pipeline stages light up one by one with 200ms stagger
- `ACCEPTED` → large `✓ VERIFIED` with expanding teal ring
- `REJECTED` → large `✗ BLOCKED` with red pulse warning flash
- Log entries slide in from right instead of appending instantly

**Typography:** `Inter` or `DM Sans` for UI chrome; `JetBrains Mono` only for technical data/log content — mixed typography creates contrast between product UI and terminal content.

**Overall feeling:** Boardroom-ready. Feels like a real product demo, not an academic exercise. Ideal for audiences with industry professionals. More trust-building, less spectacle.

---

### Concept B — Retro Hacker Terminal (CRT Full-Screen)

**Visual Style:**
A single full-screen CRT terminal emulator. The entire viewport is the terminal. Everything is rendered as if on a 1980s amber phosphor or green phosphor display. Think WarGames, Hackers, Mr. Robot Season 1 flashbacks. Maximum theatrical impact.

**Color System:**
```
Two variants:
  Green phosphor: #0D1A00 bg / #33FF33 primary / #1A4400 dim
  Amber phosphor: #1A0D00 bg / #FF8800 primary / #3D1F00 dim
```

**Layout:**
No cards. No grid. One terminal viewport:
```
┌─────────────────────────────────────────┐
│ FAKE-DATA-PREV v2.5.0 [SEC-PRJ-7E_25]  │
│ Logged in as: OPERATOR | TLS: ACTIVE   │
│ ─────────────────────────────────────  │
│ MENU:                                  │
│  [1] Login                             │
│  [2] Send insecure data                │
│  [3] Tamper insecure data              │
│  [4] Send secure data                  │
│  [5] Tamper signed data                │
│  [6] Replay valid request              │
│  [C] Clear log                         │
│ > _                                    │
│ ─────────────────────────────────────  │
│ OUTPUT:                                │
│ > AUTHENTICATING... OK                 │
│ > SIGNATURE RECEIVED: A1B2C3...        │
│ > NONCE VERIFIED. REQUEST ACCEPTED.    │
│ > _                                    │
└─────────────────────────────────────────┘
```

**Visual Effects:**
- CSS `border-radius` on the outermost container creates a CRT screen curve illusion
- `box-shadow: inset 0 0 100px rgba(0,0,0,0.4)` adds barrel distortion shadow
- Horizontal scanlines at higher intensity (0.15 opacity)
- Text rendering with subtle `text-shadow: 0 0 3px currentColor` phosphor bleed
- A slow `@keyframes flicker` on the whole terminal (opacity 1→0.97→1) every 8s simulating CRT instability
- **Typing effect**: output lines appear character-by-character at ~40 chars/sec using JS interval

**Typography:** `VT323` or `Share Tech Mono` (authentic terminal fonts) at larger size (14–16px) for genuine readability on the "CRT"

**Theory section:** Hidden by default — accessible via a `[?] HELP` menu command, rendered as scrolling terminal text, not a grid of cards

**Overall feeling:** Maximum "hacker movie" impact. Unforgettable during a defense. Highest theatrical value. Best for impressing a technical audience that appreciates the reference.

---

### Concept C — Modern Enterprise Security Dashboard

**Visual Style:**
Clean, minimalist, ultra-modern. White/light mode with deep dark panels for code/log sections only. Inspired by Vercel, Linear, or Stripe's developer documentation — beautiful, fast-feeling, professional. No retro references. No glow effects. Pure design craft.

**Color System:**
```
Background:   #F8FAFC   (off-white)
Panel bg:     #FFFFFF   (white)
Dark panels:  #0F172A   (near-black, log/code only)
Primary:      #6366F1   (indigo)
Success:      #10B981   (emerald)
Danger:       #EF4444   (red)
Warning:      #F59E0B   (amber)
Text:         #0F172A   (slate-900)
Muted text:   #64748B   (slate-500)
Border:       #E2E8F0   (slate-200)
```

**Layout:**
Two-column layout with a completely different hierarchy:
- Left column (40% width): **control panel** — login status at top as a pill chip (green = authenticated, gray = not), then three labeled sections: "Authentication", "Attack Surface", "Defense Layer" — each containing its buttons as clean outlined action cards with icon + label + description visible at all times
- Right column (60% width): **live output pane** — top half is a dark `#0F172A` log terminal (the only dark element); bottom half is a **request/response inspector** showing the last request's payload in formatted JSON, and a verification checklist (4 items, each with ✓/✗ icon)

**Typography:**
- Headings: `Geist` or `Inter Display`, 600 weight, proper font hierarchy (18px / 14px / 12px)
- Code/log: `Geist Mono` or `JetBrains Mono` — monospace only where appropriate
- Body: `Inter`, 400 weight, proper line-height and contrast

**Animations:**
- Page load: simple 300ms fade (no slide, no matrix)
- Button click: brief `background-color` flash (100ms), no transform
- Log entries: fade in with `opacity: 0 → 1` over 150ms
- `ACCEPTED` status: emerald badge with a single 400ms scale pulse
- `REJECTED` status: red badge with a 400ms horizontal shake (`translateX(-4px, 4px, -2px, 2px, 0)`)
- Verification checklist items animate in with 100ms stagger

**Overall feeling:** The most likely to be confused for a real product. Communicates engineering maturity and design sophistication. Best for audiences from software engineering, product, or VC backgrounds. Zero "student project" appearance — looks like something that ships.
