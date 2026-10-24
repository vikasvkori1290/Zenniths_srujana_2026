# ⚡ AURUMFLOW — Predictive Cash Flow Management & Smart Voice Ledger for SMBs

A production-grade, full-stack financial platform designed specifically for Indian Retailers, Kiranas, and SMBs to eliminate cash-flow blind spots. It bridges real-time revenue collection, multilingual voice-powered credit bookkeeping (**eKhata**), automated 15-day liability tracking, and an **AI-driven Predictive Cash Runway Engine**.

> 📖 **Comprehensive Implementation Manual**: For a granular breakdown of every single feature, UI module, and AI engine implemented across the project, see [**`FEATURES.md`**](FEATURES.md).

---


## 🎯 The Core Business Problem

Indian SMBs operate under extreme cash asymmetry:
* **Inflows are irregular & delayed**: Counter cash sales, UPI QR transactions, wholesale invoices, and customer credit (**Udhar**) repaid on unpredictable schedules.
* **Outflows are fixed & non-negotiable**: Store rent on the 5th, machinery loan EMIs on the 10th, staff salaries, GST compliance, and supplier purchase bills due within 15 days.
* **Why traditional accounting fails**: Legacy tools (Tally, Vyapar, Khatabook) only record *past* transactions. AurumFlow forecasts the *future survival horizon* (**Cash Runway**), alerting merchants before cash runs out to prevent bounced cheques and penalty fees.

---

## 📐 Business Logic Verification & Mathematical Specifications

All business logic across the platform has been audited for mathematical correctness, stability, and edge-case resilience (e.g. division-by-zero guards, month-end date transitions, negative cash flows, offline failovers).

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    AURUMFLOW RETAINED CASH & TIMELINE ENGINE                      │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  [ Today's Sales: ₹8,000 ] ──► (× Margin 25%) ──► Gross Profit: ₹2,000            │
│                                                            │                      │
│  [ Daily Running Cost: ₹500 ] ─────────────────────────────┴──► RETAINED CASH:   │
│  (helper wages, electricity, transport, petty cash)             +₹1,500 /day      │
│                                                                       │           │
│  [ Received Cash in Hand ] = Opening (₹40k) + Today Sales (₹8k) = ₹48,000         │
│  [ Expected Receivables  ] = ₹10,000 Khata (Weighted on Timeline, NEVER merged)  │
│                                                                                   │
│  TIMELINE-BASED PROJECTION (No Amortized Double Counting):                        │
│  balance[d] = opening_cash + Σ retained_cash[d'] + Σ expected[d']×w − Σ dues[d']  │
│                                                                                   │
│  * Rent (₹10k on 5th), EMI (₹10k on 10th), Vendor Invoices hit on exact dates     │
│  * Safety Buffer = 3 days of daily running costs (3 × ₹500 = ₹1,500)              │
│  * Status: SAFE (resilient in base & low scenarios across 60 days)                │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Daily Retained Cash vs Gross Sales
Shopkeepers do not keep gross sales. Gross sales must replenish inventory and service day-to-day running costs. Every metric in AurumFlow uses **Retained Cash**:

$$\text{Retained Cash Per Day} = (\text{Received Cash Sales} \times \text{Gross Margin \%}) - \text{Daily Running Cost}$$

* **Worked Example**:
  $$\text{Sales } ₹8,000 \times 25\% = ₹2,000 \text{ gross profit}$$
  $$\text{Minus daily running cost } ₹500 = \mathbf{+₹1,500 /day \text{ Retained Cash}}$$
* **Restock Cost**: Approximated through gross margin:
  $$\text{Restock Spending} = \text{Sales} \times (1 - \text{Gross Margin \%}) = 8,000 \times 0.75 = \mathbf{₹6,000}$$
* **Default Margins by Business Type**:
  - Kirana & Provisions: 15–20% (default 20%, 25% for worked example)
  - Sweets & Bakery: 30–40% (default 35%)
  - Stationery & Books: 20–25% (default 22%)
  - Garments & Apparel: 30–40% (default 35%)
  - Pharmacy & Healthcare: 20%
  - General Retail: 25%
* **Display Standard**: The homepage displays **₹1,500/day** prominently as the cash inflow, with **₹8,000** displayed only as secondary gross sales text.

---

### 2. Separation of Received Cash vs Expected Receivables
To prevent false liquidity assumptions, cash is divided into two distinct channels:
* **Received Cash (Certain / In Hand)**:
  $$\text{Received Cash} = \text{Opening Cash} + \text{Today's Received Sales} = 40,000 + 8,000 = \mathbf{₹48,000}$$
* **Expected Receivables (Khata / Credit)**:
  Total outstanding credit in eKhata (e.g. **₹10,000**).
* **Strict Rule**: Expected receivables are **NEVER** merged with cash in hand. They enter the timeline on their predicted due dates weighted by collection reliability ($w = 0.8$ in Base, $w = 0.4$ in Low).

---

### 3. Timeline-Based Cash Balance Projection (No Amortized Double Counting)
Rent, EMI, salaries, and supplier dues are **discrete dated events**. They are **NOT** amortized into a daily burn average, preventing obligations from being deducted twice:

$$\text{balance}[d] = \text{opening\_received\_cash} + \sum_{d' \le d} \text{retained\_cash}[d'] + \sum_{d' \le d} (\text{expected\_receivables\_due}[d'] \times w) - \sum_{d' \le d} \text{dues}[d']$$

* **On Days 1–4**: Zero rent is paid; only daily running costs apply (already netted inside retained cash).
* **On Day 5**: Rent (₹10,000) is deducted as a discrete timeline event.
* **On Day 10**: Machinery EMI (₹10,000) is deducted as a discrete timeline event.
* **On Day 18**: Commercial Electricity (₹3,000) is deducted.
* **Vendor Invoices**: Deducted on their exact calendar `dueDate`.

---

### 4. Safety Buffer & Risk Horizon
* **Safety Buffer**: Defaults to 3 days of daily running costs:
  $$\text{Safety Buffer} = 3 \times \text{Daily Running Cost} = 3 \times ₹500 = \mathbf{₹1,500}$$
* **Headline Metric Logic**:
  * **If Retained Cash < 0**: Shows **`Runway: X Days`** (days until balance drops below 0).
  * **If Retained Cash $\ge$ 0**:
    - If `balance[d] < safetyBuffer` on any upcoming date:
      Shows **`Next Risk Date: [Date] (in Xd)`** (e.g. balance drops below buffer due to lumpy payment).
    - If `balance[d] >= safetyBuffer` for all 60 days:
      Shows **`No Shortfall in 60 Days`**.

---

### 5. Status Badge Classification Matrix
Evaluates whether lumpy obligations cause a shortfall under normal and stressed conditions:
| Status | Condition | Description |
| :--- | :--- | :--- |
| **`SAFE`** | $\text{balance}[d] \ge \text{safety\_buffer}$ on every due date in **both** Base ($w=0.8$) and Low ($w=0.4$) scenarios | Operations comfortably absorb all dated obligations with buffer intact. |
| **`WATCH`** | $\text{balance}[d] \ge \text{safety\_buffer}$ in Base, but drops below buffer in Low stress-test scenario | Normal cash flow covers dues, but delayed Udhar recovery risks breaching safety buffer. |
| **`RISK`** | $\text{balance}[d] < \text{safety\_buffer}$ on **any** due date in the Base scenario | Lumpy payment cliff causes shortfall even under positive daily cash generation. |


---

### 6. 15-Day Smart Liability Calendar Windowing (`expenseSync.js`)
Monthly fixed commitments are automatically monitored against today's calendar date:

$$\text{diffDays} = \text{dueDate} - \text{today}$$

* **Evaluation Window**: $-7 \le \text{diffDays} \le 15$
* **Status Filtering**:
  * If status is `'Paid'`, the system automatically projects the *next month's* due date. If that is $> 15$ days away, it safely drops out of the 15-day payables list.
  * If status is `'Pending'` and past the due date ($\text{diffDays} \in [-7, 0)$), it is marked as **Overdue** with **Urgent** priority.
* **Dynamic Urgency Matrix**:
  * **`Urgent`** (Red): $\text{diffDays} \le 2$ or Overdue
  * **`High`** (Orange): $3 \le \text{diffDays} \le 7$
  * **`Medium`** (Blue): $8 \le \text{diffDays} \le 15$

---

### 7. Customer Udhar Windowing & Date Parsing (`EKhataReceivablesSection.jsx`)
Customer credit accounts are dynamically categorized into near-term vs extended obligations:
* **Undated / On-Demand**: `null`, `undefined`, `'Not Specified'`, or `'none'` $\rightarrow$ treated as immediate on-demand credit.
* **Natural Language Parsing**: Supports `'28 October'`, `'5 November'`, `'November 30'`, and relative phrases like `'kal'`, `'parso'`, `'agle hafte'`.
* **ISO Date Matching**: `YYYY-MM-DD` strings calculated against `today.getTime()`.
* **15-Day Near-Term Span**: Any Udhar with $\text{diffDays} \le 15$ or undated is classified as **"Within 15 Days Span"** on the Home screen to reflect near-term collectible liquidity.

---

### 8. What-If Liquidity Simulator Engine
Merchants can toggle the **"Simulate 100% Udhar Collection"** switch on the Home screen to model the exact financial impact of recovering all outstanding customer debt:

$$\text{Simulated Buffer} = \text{Liquid Cash Buffer} + \sum \text{Pending Customer Udhar}$$

$$\Delta \text{Runway} = \text{Runway}(\text{Simulated Buffer}) - \text{Runway}(\text{Current Buffer})$$

* Demonstrates to the merchant in real-time how many extra days of runway (+14 days) are unlocked by collecting customer dues.

---

### 9. Daily Revenue Target Achievement Rate (`IncomePage.jsx`)
Tracks the merchant's daily sales performance against their operational target:

$$\text{Achievement Rate} = \min\left(100,\ \text{round}\left(\frac{\sum \text{Today's Realized Sales}}{\text{Daily Goal Target}} \times 100\right)\right)$$

$$\text{Remaining Gap} = \max\left(0,\ \text{Daily Goal Target} - \sum \text{Today's Realized Sales}\right)$$

* **Default User Target**: ₹10,000 / day
* **Today's Realized Sales**: ₹8,000 (₹5,000 Cash + ₹3,000 UPI)
* **Progress**: $\frac{8,000}{10,000} \times 100 = \mathbf{80\%}$ (Remaining: **₹2,000**)

---

### 10. Atomic Udhar-to-Income Ledger Settlement Flow
When a merchant clicks **"Settle Udhar"** on the Home screen or eKhata page:
1. **Deducts Debt**: The customer's credit balance is atomically reduced by the settlement amount.
2. **Appends Receipt**: A timestamped transaction (`type: 'RECEIVED'`, status: `'Paid'`) is appended to the customer's ledger history.
3. **Injects Income**: An income entry (`category: 'eKhata Received'`) is injected into `aurum_today_income`.
4. **Dispatches Events**: Emits `aurum_ekhata_updated`, `aurum_income_updated`, and `storage` events across all open components and tabs.
5. **Instant Recalculation**: Today's sales bar advances towards the ₹10k goal, and the Runway Engine updates dynamically without a page refresh.

---

## 🔄 Cross-Module Auto-Synchronization Workflows

```
                           [ eKhata AI Voice Ledger ]
                                       │
                      (Spoken in Hindi / Kannada / Tamil / English)
                      (Groq Whisper Large v3 + LLaMA 3.3 70B)
                                       │
                                       ▼
                       [ Customer Credit / Udhar Ledger ]
                                       │
               ┌───────────────────────┴───────────────────────┐
               │ Due ≤ 15 Days & Undated                       │ Click "Settle Udhar"
               ▼                                               ▼
   [ Customer Receivables (Home) ]             [ Today's Live Income (/income) ]
               │                                               │
               │ (Drives Inflow Velocity)                      │ (Pushes Target Goal Bar)
               ▼                                               ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    PREDICTIVE CASH RUNWAY ENGINE                              │
│         Runway Days  •  Daily Burn Rate  •  Liquid Cash Buffer                │
└───────────────────────────────────────────────────────────────────────────────┘
               ▲                                               ▲
               │ (Drives Outflow Burn)                         │ Due Day ≤ 15 Days
               │                                               │
   [ Monthly Fixed Expenses (/fixed-expenses) ] ───────────────┘
   (Store Rent, Loan EMI, Salaries, Utilities)
```

---

## 🎙️ Multilingual AI Voice-to-Ledger Architecture (`voiceParser.js`)

AurumFlow enables non-tech-savvy shopkeepers to record credit transactions hands-free in seconds:

1. **Audio Capture**: Browser `MediaRecorder` API captures high-fidelity microphone input (WebM / Opus).
2. **Multilingual Speech Recognition (Groq Whisper Large v3)**:
   * Transcribes spoken Hindi, Kannada, Tamil, English, and Hinglish.
3. **Structured Intent Extraction (Groq LLaMA 3.3 70B Versatile)**:
   * Few-shot LLM prompts parse customer name, amount, action (`ADD`, `SUBTRACT`, `DELETE`, `RENAME`, `UPDATE_DUE_DATE`, `SETTLE`), and due date into a deterministic JSON schema.
4. **Speech Homophone Normalization**:
   * Resolves common speech-to-text ambiguities (e.g. *"ID to"* $\rightarrow$ `ID 2`, *"teen"* $\rightarrow$ `3`, *"chaar"* $\rightarrow$ `4`).
5. **Offline Smart Heuristic Fallback**:
   * If offline or API rate-limited, local regex and grammar rules parse Hinglish phrases (e.g. *"Ramesh ko 500 udhar diya"*, *"Suresh se 200 mila"*, *"ID 3 hatao"*).

### 11. NVIDIA Nemotron AI CFO & Predictive Business Intelligence (`/prediction`)

The platform features an enterprise-grade AI Financial Intelligence Advisor powered by **NVIDIA Nemotron 70B** (`nvidia/llama-3.1-nemotron-70b-instruct`) via **NVIDIA NIM** (`https://integrate.api.nvidia.com/v1`):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    NVIDIA NEMOTRON 70B AI CFO PIPELINE                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Business Model Classification:                                          │
│     - Retail Kirana & Provisions (Fast FMCG velocity, 8-12% margins)        │
│     - Pharmacy & Healthcare (Strict expiry, regulated credit)               │
│     - Wholesale FMCG (Bulk ticket sizes, high Udhar volume)                 │
│     - Hardware & Electricals (Slow 60d turn, contractor credit lag)         │
│     - Textiles & Apparel (Seasonal working capital lockup)                  │
│                                                                             │
│  2. Telemetry Ingestion Payload:                                            │
│     - Daily Sales: Realized (₹8,000), Cash (₹5,000), UPI (₹3,000)           │
│     - Daily Payables: Fixed Burn (₹1,000/d) + 15d Payables (₹1,333/d)       │
│     - Udhar Credit: ₹10,000 pending across customer accounts                │
│     - Net Cash Rate: +₹6,334/day (Surplus) | Runway: 41 Days (SAFE)         │
│                                                                             │
│  3. NVIDIA NIM Llama-3.1 Nemotron 70B Model Inference:                      │
│     - Working capital cycle & margin diagnostic                             │
│     - Cash velocity comparison: Inflow (₹8,667/d) vs Burn (₹2,333/d)        │
│     - 15-day liability cliff & bottleneck identification                    │
│                                                                             │
│  4. Conversational "AI Talk" & Voice Synthesis:                             │
│     - Direct spoken CFO assessment: "Namaste Vikas! Here is my talk..."     │
│     - Integrated Browser Speech Synthesis (🔊 Play / Pause / Resume)        │
│                                                                             │
│  5. Prioritized Tactical Action Plan:                                       │
│     - 4-5 prioritized recommendations with estimated cash impact & urgency  │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Interactive Voice "AI Talk"**: Merchants can listen to Nemotron read its strategic evaluation aloud using browser speech synthesis, complete with an animated audio waveform.
* **Resilient Dual-Tier Inference**: The backend accepts `NVIDIA_API_KEY` from `server/.env` or direct UI input; if omitted or rate-limited, it automatically fails over to the high-speed LPU engine so the merchant experiences zero downtime.

---

## 🗺️ Information Architecture & Routing

| Route | View Component | Core Business Capabilities |
| :--- | :--- | :--- |
| **`/`** | [`HomePage.jsx`](client/src/pages/HomePage.jsx) | **The Core Cash Operations Hub**: Combines **Predictive Runway Engine**, **Upcoming Payables (15d)**, and **Customer Udhar Receivables** on one screen. |
| **`/prediction`** | [`PredictionPage.jsx`](client/src/pages/PredictionPage.jsx) | **NVIDIA Nemotron AI CFO**: Deep business-type working capital diagnosis, daily sales vs payables velocity analysis, conversational AI talk, and interactive voice narration. |
| **`/income`** | [`IncomePage.jsx`](client/src/pages/IncomePage.jsx) | **Daily Sales Tracking**: Real-time sales breakdown (Cash, UPI QR, Invoices) and interactive target achievement progress bar. |
| **`/fixed-expenses`** | [`FixedExpensesPage.jsx`](client/src/pages/FixedExpensesPage.jsx) | **Recurring Commitments**: Store lease, machinery loan EMIs, staff salaries, electricity bills, and receipt voucher uploads. |
| **`/ekhata`** | [`EKhataLedgerPage.jsx`](client/src/pages/EKhataLedgerPage.jsx) | **AI Voice Ledger**: Multilingual speech parsing, customer transaction histories, and 1-click WhatsApp payment reminders. |
| **`/profile`** | [`ProfilePage.jsx`](client/src/pages/ProfilePage.jsx) | **Merchant Identity & Executive Overview**: Operator details, GSTIN compliance, UPI VPA configuration, KYC status, and executive summary KPI radar. |
| **`/login`** | [`AuthPage.jsx`](client/src/pages/AuthPage.jsx) | **Authentication Portal**: Secure JWT login, new merchant registration, and 1-Click Instant Demo Login. |

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router v7, Web Speech Synthesis API
* **Backend**: Node.js (ESM), Express.js, MongoDB Atlas (Mongoose)
* **AI & LLM Engines**:
  * **NVIDIA NIM**: `nvidia/llama-3.1-nemotron-70b-instruct` (Predictive Financial Intelligence & CFO Talk)
  * **Groq Cloud LPU**: Whisper Large v3 (Multilingual voice ledger) & LPU Inference Engine
* **Security & Auth**: JWT (JSON Web Tokens), Bcrypt password hashing, Helmet, CORS, Environment Isolation


---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: MongoDB Atlas connection string or local MongoDB instance

### 2. Environment Configuration
Create or configure `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aurumflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=gsk_your_groq_api_key_here
NVIDIA_API_KEY=nvapi_your_nvidia_nim_key_here
CLIENT_URL=http://localhost:5173
```


### 3. Installation
```bash
# Install root dependencies
npm install

# Install client and server dependencies
npm run install:all
```

### 4. Running Locally
Run both client and server concurrently:
```bash
npm run dev
```

* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`
* **API Health Check**: `http://localhost:5000/api/v1/health`

### 5. Running Cash-Flow Unit Tests
Execute the native unit tests covering the worked example (₹8k $\rightarrow$ ₹1,500), separation of received vs expected, no double counting, and lumpy due date risk triggers:
```bash
npm test
```


---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
