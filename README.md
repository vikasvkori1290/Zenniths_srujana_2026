# ⚡ AURUMFLOW — Predictive Cash Flow Management & Smart Voice Ledger for SMBs

A production-grade, full-stack financial platform designed specifically for Indian Retailers, Kiranas, and SMBs to eliminate cash-flow blind spots. It bridges real-time revenue collection, multilingual voice-powered credit bookkeeping (**eKhata**), automated 15-day liability tracking, and an **AI-driven Predictive Cash Runway Engine**.

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
│                           AURUMFLOW FINANCIAL ENGINE                              │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  [ Opening Buffer ] ──┐                                                           │
│  (₹40,000 in Hand)    │                                                           │
│                       ├──► [ Liquid Cash Buffer ]                                 │
│  [ Realized Sales ] ──┘    (₹48,000 Liquid Capital)                               │
│  (₹8,000: ₹5k+₹3k)                                  │                             │
│                                                     ▼                             │
│  [ Monthly Fixed ] ──► (÷30d) ──► Fixed Burn   ──┐  ┌──────────────────────────┐  │
│  (₹30,000 / month)                (₹1,000/day)   │  │  Predictive Runway Days  │  │
│                                                  ├──┤                          │  │
│  [ 15d Payables  ] ──► (÷15d) ──► Upcoming Burn──┘  │      41 Days (SAFE)      │  │
│  (₹20,000 vendor)                 (₹1,333/day)   ▲  └──────────────────────────┘  │
│                                                  │                                │
│  [ Customer Udhar] ──► (÷15d) ──► Inflow Velocity│                                │
│  (₹10,000 credit)                 (₹667/day)     │                                │
│                                                  │                                │
│  [ Baseline Sales] ─────────────► Inflow Velocity│                                │
│  (₹8,000 sales)                   (₹8,000/day)   │                                │
│                                                  │                                │
│  Net Flow Rate: Δ = Vin - Bout = +₹6,334/day (Surplus ──► 50% Stress-Tested)     │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Liquid Cash Buffer
Total accessible, immediate liquid capital available to the merchant today:

$$\text{Liquid Cash Buffer} = \text{Starting Balance} + \sum \text{Today's Realized Income}$$

* **Starting Balance**: Initial working capital in hand and primary current account (default seed: **₹40,000**).
* **Today's Realized Income**: Real-time sum of all sales recorded today across Cash, UPI QR, and settled credit receipts (default seed: **₹8,000** = ₹5,000 Cash + ₹3,000 UPI).
* **Calculation**:
  $$\text{Liquid Buffer} = 40,000 + 8,000 = \mathbf{₹48,000}$$
* **Verification**: Real-time reactive updates whenever a new sale is logged or customer Udhar is settled.

---

### 2. Daily Outflow Burn Rate ($B_{\text{out}}$)
Amortized daily cash burn required to service ongoing recurring commitments and near-term vendor liabilities:

$$B_{\text{out}} = B_{\text{fixed}} + B_{\text{upcoming}} = \left(\frac{\sum \text{Monthly Fixed Commitments}}{30\text{ days}}\right) + \left(\frac{\sum \text{15-Day Scheduled Liabilities}}{15\text{ days}}\right)$$

#### A. Daily Fixed Burn ($B_{\text{fixed}}$)
* Monthly commitments: Commercial Store Rent (₹10,000) + Machinery EMI (₹10,000) + Staff Salaries (₹7,000) + Electricity & Utilities (₹3,000) = **₹30,000 / month**.
* Amortized over standard 30-day billing cycle:
  $$B_{\text{fixed}} = \frac{₹30,000}{30} = \mathbf{₹1,000 /day}$$

#### B. Daily Upcoming Burn ($B_{\text{upcoming}}$)
* Near-term liabilities due within $\le 15$ days (e.g. Raw Material Batch #42: ₹12,500 + GST Filing: ₹7,800 + Packaging: ₹2,450 $\approx$ ₹20,000).
* Amortized over 15-day liability horizon:
  $$B_{\text{upcoming}} = \frac{₹20,000}{15} \approx \mathbf{₹1,333 /day}$$

#### C. Total Daily Burn:
$$B_{\text{out}} = 1,000 + 1,333 = \mathbf{₹2,333 /day}$$

---

### 3. Daily Inflow Velocity ($V_{\text{in}}$)
The velocity at which incoming liquidity is generated per operational day:

$$V_{\text{in}} = \text{Baseline Daily Sales} + V_{\text{collection}}$$

* **Baseline Daily Sales**: Operational revenue floor or actual sales realized today:
  $$\text{Baseline Daily Sales} = \max\left(\sum \text{Today's Sales},\ \text{Daily Floor (₹8,000)}\right)$$
* **Customer Credit Collection Velocity ($V_{\text{collection}}$)**: Expected recovery pace of outstanding customer Udhar over a standard 15-day collection cycle:
  $$V_{\text{collection}} = \frac{\sum \text{Eligible Customer Udhar}}{15\text{ days}} = \frac{₹10,000}{15} \approx \mathbf{₹667 /day}$$
* **Total Daily Inflow**:
  $$V_{\text{in}} = 8,000 + 667 = \mathbf{₹8,667 /day}$$

---

### 4. Net Daily Cash Flow Rate ($\Delta$)
Measures whether the business is expanding reserves or burning liquid capital on a daily basis:

$$\Delta = V_{\text{in}} - B_{\text{out}}$$

* **With User's Seed Numbers**:
  $$\Delta = 8,667 - 2,333 = \mathbf{+₹6,334 /day}\quad (\text{Operating Cash Surplus})$$
* **Interpretation**:
  * **$\Delta > 0$ (Surplus)**: Daily inflows exceed burn. Liquid buffer expands over time.
  * **$\Delta < 0$ (Deficit)**: Outflows exceed inflows. Merchant consumes liquid reserves to stay afloat.

---

### 5. Predictive Cash Runway Horizon & Health Status
The number of days the business can survive while honoring all payment obligations:

#### Case A: Self-Sustaining Surplus ($\Delta \ge 0$)
Because inflows exceed outflows, standard naive formulas ($\frac{\text{Buffer}}{\Delta}$) yield infinite days, which gives merchants a false sense of security. AurumFlow applies a **50% Stress-Test Scenario** (evaluating how long the merchant survives on liquid cash alone if revenue drops by 50% or customer collections freeze):

$$\text{Runway Days} = \min\left(90,\ \text{round}\left(\frac{\text{Liquid Cash Buffer}}{B_{\text{out}} \times 0.5}\right)\right)$$

* **Calculation**:
  $$\text{Runway Days} = \text{round}\left(\frac{48,000}{2,333 \times 0.5}\right) = \text{round}\left(\frac{48,000}{1,166.5}\right) = \mathbf{41\text{ Days}}$$

#### Case B: Deficit Burn ($\Delta < 0$)
When burn exceeds inflow velocity, runway is determined by the depletion rate of the liquid buffer:

$$\text{Runway Days} = \max\left(1,\ \left\lfloor\frac{\text{Liquid Cash Buffer}}{|\Delta|}\right\rfloor\right)$$

#### Health Status Classification:
| Status | Threshold | Visual Indicator | Advisory Action |
| :--- | :--- | :--- | :--- |
| **`SAFE`** | $\ge 30$ Days | 🟢 Emerald Shield | Inflows comfortably service operations. Good time to negotiate bulk supplier discounts. |
| **`CAUTION`** | $15 - 30$ Days | 🟡 Amber Warning | Near-term payables risk draining liquid reserves. Send WhatsApp payment reminders to Udhar customers. |
| **`CRITICAL`** | $< 15$ Days | 🔴 Red Alert | High risk of bounced payments. Defer non-essential expenses and collect urgent receivables immediately. |

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

---

## 🗺️ Information Architecture & Routing

| Route | View Component | Core Business Capabilities |
| :--- | :--- | :--- |
| **`/`** | [`HomePage.jsx`](client/src/pages/HomePage.jsx) | **The Core Cash Operations Hub**: Combines **Predictive Runway Engine**, **Upcoming Payables (15d)**, and **Customer Udhar Receivables** on one screen. |
| **`/income`** | [`IncomePage.jsx`](client/src/pages/IncomePage.jsx) | **Daily Sales Tracking**: Real-time sales breakdown (Cash, UPI QR, Invoices) and interactive target achievement progress bar. |
| **`/fixed-expenses`** | [`FixedExpensesPage.jsx`](client/src/pages/FixedExpensesPage.jsx) | **Recurring Commitments**: Store lease, machinery loan EMIs, staff salaries, electricity bills, and receipt voucher uploads. |
| **`/ekhata`** | [`EKhataLedgerPage.jsx`](client/src/pages/EKhataLedgerPage.jsx) | **AI Voice Ledger**: Multilingual speech parsing, customer transaction histories, and 1-click WhatsApp payment reminders. |
| **`/profile`** | [`ProfilePage.jsx`](client/src/pages/ProfilePage.jsx) | **Merchant Identity & Executive Overview**: Operator details, GSTIN compliance, UPI VPA configuration, KYC status, and executive summary KPI radar. |
| **`/login`** | [`AuthPage.jsx`](client/src/pages/AuthPage.jsx) | **Authentication Portal**: Secure JWT login, new merchant registration, and 1-Click Instant Demo Login. |

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router v7
* **Backend**: Node.js (ESM), Express.js, MongoDB Atlas (Mongoose)
* **AI & Voice Engine**: Groq LPU (Whisper Large v3 for audio speech-to-text, LLaMA 3.3 70B for intent parsing)
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

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
