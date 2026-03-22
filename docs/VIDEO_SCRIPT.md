# rcpt/ — rcpt/ — Agent Receipt Layer
## Explainer Video Script (45 seconds)

**Format:** 1280×720, 30fps, h264  
**Style:** Cream background, thermal receipt motif, bold sans + monospace  
**Tone:** Clean, technical, confident

---

## Scene 1: The Problem (0–8s)

**Visual:** Cream background. Two agent labels appear: `AGENT_A` and `AGENT_B`, connected by an arrow labeled `0.01 USDC`. A question mark hovers over a receipt icon.

**Text overlay (bold, dark):**
> Agent A pays Agent B  
> 0.01 USDC for sentiment analysis.

**Secondary text (smaller, amber):**
> Agent B could return cached results.  
> Agent A has no proof.

**Voiceover (optional):**  
"In the agent economy, payments happen in milliseconds. Accountability doesn't."

---

## Scene 2: Introduce rcpt/ (8–18s)

**Visual:** API call appears in a code block on a cream card:
```
POST /v1/receipt/commit
{
  "cap": "sentiment-analysis",
  "provider": "0xB1e55...51AA",
  "consumer": "0x0000...0001",
  "payment": "0.001 USDC / MPP"
}
```
→ Response appears below:
```
{ "receipt_id": "rcpt_0x4b83e78b", "status": "committed" }
```

**Text overlay:**
> rcpt/ creates a cryptographic receipt  
> the moment a commitment is made.

**Brand mark:** `rcpt/` in amber appears top-left.

---

## Scene 3: Delivery (18–26s)

**Visual:** Receipt tape strip slides in from top. Output hash appears:
```
POST /v1/receipt/deliver
{
  "receipt_id": "rcpt_0x4b83e78b",
  "output_hash": "sha256:a3f9..."
}
```
→ Walrus blob ID appears, with a checkmark:
```
walrus_blob_id: DwUrPv74yeZJ6h...  ✓
```

**Text overlay:**
> When the work is done, the output hash  
> is anchored on Walrus.

**Secondary text (amber):**
> Immutable. Permanent.

---

## Scene 4: Acknowledgment (26–34s)

**Visual:** Consumer signature card fades in:
```
POST /v1/receipt/ack
{
  "receipt_id": "rcpt_0x4b83e78b",
  "consumer_sig": "0x7f3a..."
}
```
→ Both checkmarks appear:
```
PROVIDER  0xB1e55...51AA  ✓
CONSUMER  0x0000...0001   ✓
STATUS    acknowledged
```

**Text overlay:**
> The consumer counter-signs.  
> Both parties are on record.

---

## Scene 5: Private Mode (34–40s)

**Visual:** Same receipt, but a lock icon appears. Fields blur partially.
```
visibility: "private"
encrypted: ecdh-aes256gcm
seal: sui-mainnet (coming)
```

**Text overlay:**
> Commercial receipts stay private.  
> ECDH encryption. Sui Seal on mainnet.

---

## Scene 6: The Stack (40–45s)

**Visual:** Three logos/labels stack vertically with connecting lines:
```
rcpt/        ← Accountability
safetymd     ← Trust & Identity  
ERC-8004     ← Payment Standards
```
→ Tagline fades in centered:

**Text overlay (large, bold):**
> Payment. Identity. Trust. Accountability.

**Final line (amber):**
> The agent economy stack.

**URL fade in:**
> rcpt.p-u-c.workers.dev

---

## Production Notes

- All scenes use #FAFAF7 cream background
- Code blocks: dark rounded card (#1C1917), monospace white text
- Accent: amber #F59E0B for highlights and brand marks
- Transitions: 0.3s cross-fade between scenes
- Font: Inter (bold for headings), JetBrains Mono (code)
- No stock footage, no music — clean and technical
