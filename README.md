# Paytm Vyapar-Mind — AI Business Operator

> **Paytm AI Hackathon 2026 · Merchant Growth AI track · Finalist prototype**
> Turning the Paytm Soundbox from a passive payment speaker into a **two-way AI business operator** for Tier-2/Tier-3 Indian merchants.

The merchant doesn't open a dashboard. The merchant **speaks**, and the agent understands the intent, calls the right business tool against the database, and answers back in Hinglish — while payment announcements always take priority over any conversation.

*This is a hackathon prototype. It uses simulated data only and is not connected to any private Paytm infrastructure.*

---

## The core flow

```
MERCHANT VOICE
    ↓
SPEECH-TO-TEXT          (Web Speech API · Sarvam saarika:v2.5 when key configured)
    ↓
INTENT UNDERSTANDING    (multilingual router — Hindi, English, Tamil, Telugu, Kannada)
    ↓
AI AGENT                (orchestrator — never touches SQL directly)
    ↓
BUSINESS TOOLS          (get_today_sales, get_inactive_customers, …)
    ↓
<<<<<<< HEAD
POSTGRESQL / MOCK PAYTM ADAPTER   (Convex tables)
    ↓
RESULT
    ↓
AI RESPONSE             (short, merchant-friendly Hinglish)
    ↓
TEXT-TO-SPEECH          (browser voice · Sarvam bulbul:v2)
=======
CONVEX TABLES / MOCK PAYTM ADAPTER
    ↓
RESULT
    ↓
AI RESPONSE             (short, merchant-friendly, in the selected language)
    ↓
TEXT-TO-SPEECH          (browser voice · Sarvam bulbul:v3)
>>>>>>> 83aa755fc42c97a366a12b446371f7c5ac13ae9c
    ↓
SOUNDBOX RESPONSE
```

## Demo scenarios (seeded merchant: Ramesh General Store, M001)

| # | Say / tap | What happens |
|---|-----------|--------------|
<<<<<<< HEAD
| 1 | “Aaj kitna business hua?” | `get_today_sales` → sales summary with yesterday comparison |
| 2 | “Kaunse customer 30 din se nahi aaye?” | `get_inactive_customers` → list + count |
| 3 | “Unko ₹50 ka offer bhej do.” | Finds inactive customers → suggests offer → **asks approval** → campaign created (simulated WhatsApp) |
| 4 | “Milk ka stock kitna hai?” | `get_product_stock` → reorder warning |
| 5 | “Ramesh ka ₹500 udhaar update kar do.” | Sensitive write → **demo PIN required** (1234) → ledger updated |
| 6 | “Mere liye koi loan offer hai?” | Activity-score based **SIMULATED** credit offer |
| 7 | **SIMULATE PAYMENT** button | Instant announcement that interrupts any conversation |

=======
| 1 | "Aaj kitna business hua?" | `get_today_sales` → sales summary with yesterday comparison |
| 2 | "Kaunse customer 30 din se nahi aaye?" | `get_inactive_customers` → list + count |
| 3 | "Unko ₹50 ka offer bhej do." | Finds inactive customers → suggests offer → **asks approval** → campaign created → handed to the n8n workflow for delivery |
| 4 | "Milk ka stock kitna hai?" | `get_product_stock` → reorder warning |
| 5 | "Ramesh ka ₹500 udhaar update kar do." | Sensitive write → **demo PIN required** (1234) → ledger updated |
| 6 | "Mere liye koi loan offer hai?" | Activity-score based **SIMULATED** credit offer |
| 7 | **SIMULATE PAYMENT** button | Instant announcement that interrupts any conversation |

## Languages

Hindi, English, Tamil, Telugu and Kannada — intent keywords (native script **and** romanized), agent responses, demo utterances, STT/TTS locales and voice all switch with the header picker. Native-script product/customer aliases (e.g. பால் → Milk, రమేష్ → Ramesh) are resolved server-side.

>>>>>>> 83aa755fc42c97a366a12b446371f7c5ac13ae9c
## Security model

- **Read operations** (sales, inventory, customer insights) run directly.
- **Sensitive writes** (udhaar updates, campaigns) are enqueued in a `pending_actions` table; the agent *cannot* execute them. The merchant must approve with a demo PIN (verified as SHA-256 server-side, never stored plaintext, never sent to the client).
- The LLM never writes SQL. Architecture: `LLM → tool request → backend validation → authorization → DB → result → response`.

<<<<<<< HEAD
=======
## n8n campaign delivery

Approved win-back campaigns are handed to an **n8n Cloud** workflow:

1. Convex fires the campaign to the workflow webhook (`N8N_WEBHOOK_URL`) with an `x-vyapar-secret` header — fire-and-forget, so n8n can never block the merchant's approval.
2. The workflow fans out one simulated message per customer (drop real WhatsApp/Email/AI nodes in its place later).
3. The workflow POSTs the result to the `/n8n/callback` HTTP route, flipping the campaign to `completed (n/n)` — visible live in the Agent Activity panel.

Import the ready-made workflow from [`n8n/vyapar-mind-campaign-delivery.json`](n8n/vyapar-mind-campaign-delivery.json), set your shared secret in its callback node, activate, and add the env vars below. Without `N8N_WEBHOOK_URL` configured, delivery stays simulated in-app and nothing else changes.

>>>>>>> 83aa755fc42c97a366a12b446371f7c5ac13ae9c
## Observability

Every agent turn is logged (intent, tool, latency, success) and surfaced in the **Agent Activity** panel — visible proof that answers come from real tool calls, not hallucination.

## Tech stack

- **Frontend:** React 19 + Vite + Tailwind v4 + shadcn/ui, light-glassmorphism theme, Framer Motion
- **Backend:** Convex (functions + PostgreSQL-style tables + auth), seeded demo dataset
<<<<<<< HEAD
- **Voice:** dual-provider adapter — browser Web Speech API (default) with a clean Sarvam AI path (`saarika:v2.5` STT, `bulbul:v2` TTS) that activates server-side when a key exists
=======
- **Voice:** dual-provider adapter — browser Web Speech API (default) with a clean Sarvam AI path (`saarika:v2.5` STT, `bulbul:v3` TTS) that activates server-side when keys exist. STT and TTS keys are independent (`SARVAM_STT_API_KEY` / `SARVAM_TTS_API_KEY`); a combined `SARVAM_AI_API_KEY` also works.
- **Automation:** n8n Cloud webhook for campaign delivery, with shared-secret-verified callbacks
>>>>>>> 83aa755fc42c97a366a12b446371f7c5ac13ae9c
- **Paytm adapter:** `PaytmMerchantAdapter` interface with `MockPaytmMerchantAdapter` implementation so mock methods can be swapped for real Paytm sandbox APIs later

## Running locally

```bash
bun install
bun dev            # frontend
bun convex dev     # backend (separate terminal)
```

The demo merchant auto-seeds on first load. Demo PIN for sensitive actions: **1234**.

## Environment variables

| Variable | Where | Required | Purpose |
|----------|-------|----------|---------|
| `VITE_CONVEX_URL` | client env | yes (pre-configured) | Convex deployment URL |
<<<<<<< HEAD
| `SARVAM_AI_API_KEY` | Convex env | no | Enables Sarvam STT/TTS (voice still works without it via Web Speech API) |

---

*Not affiliated with or endorsed by Paytm. Built for the Paytm AI Hackathon 2026.*
=======
| `SARVAM_STT_API_KEY` | server env | no | Sarvam speech-to-text (`saarika:v2.5`) |
| `SARVAM_TTS_API_KEY` | server env | no | Sarvam text-to-speech (`bulbul:v3`) |
| `N8N_WEBHOOK_URL` | server env | no | n8n campaign-delivery workflow webhook (production URL) |
| `N8N_SHARED_SECRET` | server env | no | Shared secret for the n8n webhook + `/n8n/callback` verification |

Voice works without any keys via the browser Web Speech API; campaign delivery works without n8n (simulated in-app).
>>>>>>> 83aa755fc42c97a366a12b446371f7c5ac13ae9c
