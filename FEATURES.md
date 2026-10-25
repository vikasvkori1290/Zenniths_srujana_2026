# 🌟 FINSAFE — Comprehensive Features & Implementation Manual

**FinSafe** is an enterprise-grade financial intelligence, cash-flow forecasting, and smart voice ledger platform built specifically for Indian Kiranas, Retailers, and Small & Medium Businesses (SMBs). 

This document details every feature, mathematical model, AI engine, and architectural workflow implemented across the platform.

---

## 📑 Table of Contents

1. [Architectural Overview & Tech Stack](#1-architectural-overview--tech-stack)
2. [Multi-Page Information Architecture & Routing](#2-multi-page-information-architecture--routing)
3. [Retained Cash & Timeline Cash Flow Engine](#3-retained-cash--timeline-cash-flow-engine)
4. [Cash Flow Onboarding & Margin Assumptions Drawer](#4-cash-flow-onboarding--margin-assumptions-drawer)
5. [Upcoming 15-Day Liabilities & Scheduled Dues Tracking](#5-upcoming-15-day-liabilities--scheduled-dues-tracking)
6. [Customer Credit (Udhar) Ledger & Atomic Settlement](#6-customer-credit-udhar-ledger--atomic-settlement)
7. [Multilingual AI Voice Ledger (eKhata)](#7-multilingual-ai-voice-ledger-ekhata)
8. [NVIDIA Nemotron 70B AI CFO & Voice Narration](#8-nvidia-nemotron-70b-ai-cfo--voice-narration)
9. [Today's Live Income & Target Achievement Tracking](#9-todays-live-income--target-achievement-tracking)
10. [Monthly Fixed Expenses & Receipt Voucher Management](#10-monthly-fixed-expenses--receipt-voucher-management)
11. [Merchant Profile & Executive KPI Radar](#11-merchant-profile--executive-kpi-radar)
12. [Authentication & Security](#12-authentication--security)
13. [Dual-Channel Reactive Event Bus (Real-Time Sync)](#13-dual-channel-reactive-event-bus-real-time-sync)
14. [Automated Unit Test Suite](#14-automated-unit-test-suite)

---

## 1. Architectural Overview & Tech Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINSAFE PLATFORM STACK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend:      React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router │
│  Audio Engine:  Web Speech Synthesis API + MediaRecorder API (WebM/Opus)    │
│  Backend:       Node.js 24 (ESM), Express.js, MongoDB Atlas (Mongoose)      │
│  AI Engine 1:   NVIDIA NIM (nvidia/llama-3.1-nemotron-70b-instruct)         │
│  AI Engine 2:   Groq Cloud LPU (Whisper Large v3 + LLaMA 3.3 70B / Fallback)│
│  Security:      JWT (JSON Web Tokens), Bcrypt.js, Helmet, CORS Isolation    │
│  Testing:       Native Node.js Test Runner (node --test)                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

* **Frontend Theme**: Pure white canvas with sleek neutral borders, high-contrast typography, and gold accent styling (`#FACC15`).
* **Design Philosophy**: Financial numbers are grounded in real merchant cash (retained earnings after restocking and running costs) rather than misleading gross revenue.

---

## 2. Multi-Page Information Architecture & Routing

The application is decomposed into dedicated, modular pages:

| Route | Page File | Core Capabilities |
| :--- | :--- | :--- |
| **`/`** | [`HomePage.jsx`](client/src/pages/HomePage.jsx) | **The Core Cash Radar**: Combines **Daily Retained Cash**, **Cash Horizon / Risk Dates**, **15-Day Scheduled Dues**, and **Udhar Receivables** on one screen. |
| **`/prediction`** | [`PredictionPage.jsx`](client/src/pages/PredictionPage.jsx) | **NVIDIA Nemotron AI CFO**: Business-type working capital diagnosis, sales vs payables velocity comparison, conversational CFO talk, and interactive voice narration. |
| **`/income`** | [`IncomePage.jsx`](client/src/pages/IncomePage.jsx) | **Today's Live Revenue**: Real-time sales breakdown (Counter Cash, UPI QR, Udhar Repayments) and interactive daily target achievement bar. |
| **`/fixed-expenses`**| [`FixedExpensesPage.jsx`](client/src/pages/FixedExpensesPage.jsx)| **Monthly Fixed Commitments**: Store Rent, Machinery Loan EMI, Staff Salaries, Electricity, status toggles ('Paid' vs 'Pending'), and receipt uploads. |
| **`/ekhata`** | [`EKhataLedgerPage.jsx`](client/src/pages/EKhataLedgerPage.jsx) | **AI Voice Ledger**: Multilingual speech-to-ledger parsing, customer ledger accounts, transaction logs, and 1-click WhatsApp payment reminders. |
| **`/profile`** | [`ProfilePage.jsx`](client/src/pages/ProfilePage.jsx) | **Merchant Identity & Executive Overview**: Operator KYC details, GSTIN compliance, UPI VPA configuration, and high-level financial radar. |
| **`/login`** | [`AuthPage.jsx`](client/src/pages/AuthPage.jsx) | **Authentication Portal**: Secure JWT login, merchant registration, and 1-Click Instant Demo Login. |

---

## 3. Retained Cash & Timeline Cash Flow Engine

### The Core Financial Problem Solved
Traditional tools display gross daily sales (e.g. ₹8,000/day) as if the merchant can spend all of it. In reality, the owner keeps only a fraction after replenishing inventory and servicing daily store running costs.

### Mathematical Formulations

#### A. Daily Retained Cash
$$\text{Retained Cash Per Day} = (\text{Received Cash Sales} \times \text{Gross Margin \%}) - \text{Daily Running Cost}$$

* **Worked Example**:
  $$\text{Sales } ₹8,000 \times 25\% \text{ margin} = ₹2,000 \text{ gross profit}$$
  $$\text{Minus daily running cost } ₹500 = \mathbf{+₹1,500 /day \text{ Retained Cash}}$$
* **Restock Spending**: Automatically estimated from margin:
  $$\text{Restock Cost} = \text{Sales} \times (1 - \text{Margin}) = ₹8,000 \times 0.75 = \mathbf{₹6,000}$$

#### B. Separation of Received Cash vs Expected Receivables
* **Received Cash (Certain / In Hand)**:
  $$\text{Received Cash} = \text{Opening Cash } (₹40,000) + \text{Today's Received Sales } (₹8,000) = \mathbf{₹48,000}$$
* **Expected Receivables (Khata / Credit)**:
  Total outstanding credit in eKhata (e.g. **₹10,000**).
* **Strict Separation Rule**: Expected receivables are **NEVER** merged with cash in hand. They enter the timeline on their predicted due dates weighted by collection reliability ($w = 0.8$ in Base, $w = 0.4$ in Low).

#### C. Discrete Timeline Balance Equation (No Amortized Double Counting)
Rent, EMI, salaries, and vendor bills are **discrete dated events**. They hit on their exact due dates and are **NOT** amortized into a daily burn rate:

$$\text{balance}[d] = \text{opening\_received\_cash} + \sum_{d' \le d} \text{retained\_cash}[d'] + \sum_{d' \le d} (\text{expected\_receivables\_due}[d'] \times w) - \sum_{d' \le d} \text{dues}[d']$$

* **Days 1–4**: Zero rent is deducted; only daily running costs apply (already netted inside retained cash).
* **Day 5**: Store Rent (₹10,000) hits as a discrete deduction.
* **Day 10**: Machinery Loan EMI (₹10,000) hits as a discrete deduction.
* **Day 18**: Electricity (₹3,000) hits as a discrete deduction.
* **Vendor Payables**: Hit on their scheduled invoice `dueDate`.

#### D. Safety Buffer & Risk Horizon
* **Safety Buffer**: Defaults to 3 days of daily running costs ($3 \times ₹500 = \mathbf{₹1,500}$).
* **Dynamic Horizon Output**:
  * **When Retained Cash $\ge$ 0**:
    - If $\text{balance}[d] \ge \text{safetyBuffer}$ for all 60 days: displays **`No Shortfall in 60 Days`**.
    - If a lumpy payment breaches buffer: displays **`Next Risk Date: [Date] (in Xd)`** with shortfall details.
  * **When Retained Cash < 0**: displays **`Estimated Cash Runway: X Days`** (days until balance drops below 0).

#### E. Status Badge Classification Matrix
| Status | Condition | Meaning |
| :--- | :--- | :--- |
| **`SAFE`** | $\text{balance}[d] \ge \text{safety\_buffer}$ on every due date in **both** Base ($w=0.8$) and Low ($w=0.4$) scenarios | Operations comfortably absorb all dated obligations with buffer intact. |
| **`WATCH`** | $\text{balance}[d] \ge \text{safety\_buffer}$ in Base, but drops below buffer in Low stress scenario | Normal cash flow covers dues, but delayed Udhar recovery risks breaching safety buffer. |
| **`RISK`** | $\text{balance}[d] < \text{safety\_buffer}$ on **any** due date in the Base scenario | Lumpy payment cliff causes shortfall even under positive daily cash generation. |

---

## 4. Cash Flow Onboarding & Margin Assumptions Drawer

Located directly on the homepage radar card via the **"Cash Flow Assumptions"** button:

* **Interactive Controls**:
  - **Gross Margin (%)**: User-editable slider/input.
  - **Business Type Presets**:
    - 🛒 *Kirana & Provisions*: 20%
    - 🍬 *Sweets & Bakery*: 35%
    - 📚 *Stationery & Books*: 22%
    - 👕 *Garments & Apparel*: 35%
    - 🏪 *Standard Retail*: 25%
  - **Daily Running Costs (₹/day)**: Day-to-day helper wages, transport, petty cash (default: ₹500/day).
  - **Opening Received Cash (₹)**: Initial working capital in hand and current account (default: ₹40,000).
  - **Safety Buffer (₹)**: Auto-calculated as $3 \times \text{daily running costs}$ (editable by owner).
* **Instant Recomputation**: Saving parameters updates `aurum_cashflow_settings`, dispatches reactive events, and recalculates the 60-day timeline across all components without page reloads.

---

## 5. Upcoming 15-Day Liabilities & Scheduled Dues Tracking

Implemented in [`UpcomingExpensesSection.jsx`](client/src/components/UpcomingExpensesSection.jsx) and [`expenseSync.js`](client/src/services/expenseSync.js):

* **15-Day Calendar Windowing**: Evaluates all obligations within $-7 \le \text{diffDays} \le 15$.
* **Automated Fixed Commitment Synchronization**:
  - Monthly fixed bills check their scheduled `dueDay` against `new Date()`.
  - Bills due within $\le 15$ days automatically inject into the Upcoming Payables schedule.
  - Bills marked `'Paid'` advance to next month's cycle and safely drop off the 15-day view if $> 15$ days away.
* **Dynamic Urgency Matrix**:
  - 🔴 **`Urgent`**: $\text{diffDays} \le 2$ or Overdue.
  - 🟠 **`High`**: $3 \le \text{diffDays} \le 7$.
  - 🔵 **`Medium`**: $8 \le \text{diffDays} \le 15$.
* **Deduplication Engine**: Ensures synced fixed liabilities and manual vendor invoices never double-count against the timeline balance.
* **Manual Voucher Creation**: Allows merchants to add one-off supplier invoices, GST filing dates, and packaging purchases.

---

## 6. Customer Credit (Udhar) Ledger & Atomic Settlement

Implemented in [`EKhataReceivablesSection.jsx`](client/src/components/EKhataReceivablesSection.jsx) and [`EKhataPage.jsx`](client/src/components/EKhataPage.jsx):

* **Natural Language Due Date Parser (`evaluateCustomerDueWindow`)**:
  - Supports ISO dates: `2026-11-05`.
  - Supports natural strings: `"28 October"`, `"5 November"`, `"November 30"`.
  - Supports colloquial relative dates: `"kal"`, `"parso"`, `"agle hafte"`.
  - Supports undated credit: marked as `"Undated / On-Demand"`.
* **"Within 15 Days Span" Filter**:
  - Categorizes customer debt due within $\le 15$ days or on-demand as near-term expected liquidity.
* **1-Click Atomic Debt Settlement**:
  1. Reduces customer credit balance in `eKhataCustomers`.
  2. Appends a timestamped transaction record (`type: 'RECEIVED'`, status: `'Paid'`).
  3. Automatically injects an entry into `aurum_today_income` (`category: 'eKhata Received'`).
  4. Pushes the daily income target achievement bar forward in real-time.
* **1-Click WhatsApp Reminders**: Generates a pre-filled WhatsApp message in English/Hindi with the customer's exact balance and store UPI payment details.

---

## 7. Multilingual AI Voice Ledger (eKhata)

Implemented in [`voiceParser.js`](client/src/services/voiceParser.js) and [`groq.routes.js`](server/src/routes/groq.routes.js):

* **Audio Recording**: Browser `MediaRecorder` API captures high-clarity voice input (WebM / Opus).
* **Multilingual Speech Recognition (Groq Whisper Large v3)**:
  - Transcribes spoken Hindi, Kannada, Tamil, English, and Hinglish.
* **Structured Intent Extraction (LLaMA 3.3 70B Versatile)**:
  - Few-shot prompt parses spoken sentences into deterministic CRUD actions:
    - `ADD`: *"Rahul ko 450 ka maal diya udhar pe"* $\rightarrow$ creates customer `#ID` tag, adds ₹450 debt.
    - `SUBTRACT`: *"Rahul ne 200 rupay jama karwaye"* $\rightarrow$ records ₹200 payment.
    - `SETTLE`: *"Rahul ka hisaab chukta kar do"* $\rightarrow$ clears balance.
    - `UPDATE_DUE_DATE`: *"Tarikh 5 November kar do"* $\rightarrow$ updates payment deadline.
    - `DELETE`: *"ID 2 hata do"* $\rightarrow$ removes record.
* **Speech Homophone Normalization**: Resolves speech-to-text ambiguities (e.g. *"ID to"* $\rightarrow$ `ID 2`, *"teen"* $\rightarrow$ `3`, *"chaar"* $\rightarrow$ `4`).
* **Offline Heuristic Engine**: Local regex rules parse voice commands when offline or during network dropouts for zero-downtime ledger entry.

---

## 8. NVIDIA Nemotron 70B AI CFO & Voice Narration

Implemented in [`PredictionPage.jsx`](client/src/pages/PredictionPage.jsx) and [`prediction.routes.js`](server/src/routes/prediction.routes.js):

* **Enterprise AI Model**: Powered by **NVIDIA Nemotron 70B** (`nvidia/llama-3.1-nemotron-70b-instruct`) via **NVIDIA NIM** (`https://integrate.api.nvidia.com/v1`).
* **On-Demand Inference Trigger**: When opening `/prediction`, the page loads active business telemetry instantly without auto-calling the LLM API. Inference is triggered on-demand via the **"Predict using LLM"** button.
* **Live Telemetry Feeder**:

  - Business Model Dynamics (Kirana, Pharmacy, Wholesale, Hardware, Garments, Electronics, Cafe).
  - Daily Sales & Margins: Gross sales, margin %, running costs, and **Daily Retained Cash** (+₹1,500/day).
  - Discrete Timeline Dues: Fixed commitments + 15-day vendor liabilities.
  - Credit Position: Outstanding Udhar (expected only, never merged into cash).
  - Liquidity Status: Received cash in hand (₹48,000) and safety buffer (₹1,500).
* **Conversational CFO "AI Talk"**:
  - The model writes a candid spoken diagnosis addressing the merchant directly by name and store.
* **Interactive Speech Synthesis (Voice Narration)**:
  - Integrated with browser `window.speechSynthesis`.
  - Features **🔊 Listen to Talk**, **Pause**, **Resume**, **Stop**, and an animated audio waveform equalizer.
* **Tactical Action Plan**: 4–5 prioritized recommendations with estimated cash impact (e.g. `+₹5,000 liquidity`, `+4 days`) and urgency ratings.
* **Dual-Tier Failover**: Automatically accepts `NVIDIA_API_KEY` from `.env` or UI; seamlessly routes through the high-speed LPU engine if omitted, guaranteeing zero disruptions.

---

## 9. Today's Live Income & Target Achievement Tracking

Implemented in [`IncomePage.jsx`](client/src/pages/IncomePage.jsx):

* **Real-Time Payment Breakdown**: Logs sales by payment mode:
  - 💵 Counter Cash Sales
  - 📱 UPI QR Payments (PhonePe, Google Pay, Paytm)
  - 📑 Wholesale Tax Invoices
  - 📖 eKhata Credit Repayments
* **Interactive Target Goal Progress**:
  $$\text{Achievement Rate} = \min\left(100,\ \text{round}\left(\frac{\sum \text{Today's Sales}}{\text{Daily Goal}} \times 100\right)\right)$$
  - Default user target: ₹10,000/day.
  - With ₹8,000 realized sales (₹5k Cash + ₹3k UPI): displays **`80% Achieved`** (Remaining gap: **`₹2,000`**).
* **Custom Voucher Entry**: Modal to log new counter receipts with source name, amount, category, and timestamp.

---

## 10. Monthly Fixed Expenses & Receipt Voucher Management

Implemented in [`FixedExpensesPage.jsx`](client/src/pages/FixedExpensesPage.jsx):

* **Fixed Commitments Registry**:
  - Store & Warehouse Lease (e.g. ₹10,000 / month, due 5th)
  - Machinery Loan EMI (e.g. ₹10,000 / month, due 10th)
  - Operating Staff Salaries (e.g. ₹7,000 / month, due 7th)
  - Commercial Electricity & BESCOM Utilities (e.g. ₹3,000 / month, due 18th)
* **Status Management**: Toggle between `'Paid'` and `'Pending'`.
* **Digital Voucher Attachment**: Mock attachment of PDF/image rent receipts and bank EMI confirmation schedules.
* **Real-Time Sync**: Status changes instantly reflect in the 15-day upcoming payables list and update the timeline forecast.

---

## 11. Merchant Profile & Executive KPI Radar

Implemented in [`ProfilePage.jsx`](client/src/pages/ProfilePage.jsx):

* **Merchant Identity**: Operator name, business registration, contact details, store address, GSTIN compliance number, and UPI VPA.
* **Executive Cash Flow Overview**: 4 high-level KPI cards linked directly to their respective operational views:
  1. *Today's Live Income*: ₹8,000 (80% of daily target).
  2. *Cash Horizon & Retained Flow*: `No Shortfall in 60 Days` (Retained: +₹1,500/day).
  3. *Upcoming 15-Day Obligations*: ₹43,000 scheduled dues.
  4. *Customer Udhar Balance*: ₹10,000 pending across credit accounts.
* **Editable Profile Details**: In-place edit modal for updating store name, business category, daily target, and bank UPI ID.

---

## 12. Authentication & Security

Implemented in [`AuthPage.jsx`](client/src/pages/AuthPage.jsx), [`auth.controller.js`](server/src/controllers/auth.controller.js), and [`auth.middleware.js`](server/src/middleware/auth.middleware.js):

* **JWT (JSON Web Tokens)**: Secure token generation on login/signup stored in `localStorage` (`aurum_token`).
* **Password Encryption**: Industry-standard Bcrypt salt-hashing.
* **1-Click Instant Demo Login**: Allows evaluators and merchants to bypass manual sign-up and immediately explore the live dashboard with pre-configured Kirana seed data.
* **Client-Side Protected Route Guard**: Unauthenticated requests to `/`, `/income`, `/fixed-expenses`, `/ekhata`, `/prediction`, or `/profile` redirect to `/login`.

---

## 13. Dual-Channel Reactive Event Bus (Real-Time Sync)

FinSafe synchronizes financial metrics across all open components and browser windows without requiring page reloads:

```
[ Component Action ] ──► localStorage.setItem()
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
  [ Local Custom Events ]                 [ Storage Event ]
  (Same Tab Instant Sync)                 (Cross-Tab Sync)
  - aurum_income_updated                  - window.onstorage
  - aurum_fixed_expenses_updated
  - aurum_expenses_updated
  - aurum_ekhata_updated
  - aurum_cashflow_settings_updated
```

* **Zero Polling**: Component state updates reactively within milliseconds upon transaction recording or settings modification.

---

## 14. Automated Unit Test Suite

Implemented in [`client/src/services/__tests__/cashFlow.test.js`](client/src/services/__tests__/cashFlow.test.js) and executed via native `npm test`:

```bash
npm test
```

### Test Coverage Summary:
1. **Worked Example Test (Requirement 1)**:
   - Verifies sales ₹8,000 at 25% margin minus ₹500 running costs yields exactly **₹1,500/day retained cash**.
2. **Expected vs Received Separation Test (Requirement 2)**:
   - Verifies opening cash (₹40k) + today sales (₹8k) = ₹48k received cash in hand.
   - Verifies ₹10k expected Udhar is strictly isolated and **never** added to cash in hand.
3. **No Double-Counting Test (Requirement 3)**:
   - Verifies rent and EMI appear only as discrete dated events on the timeline, and are not subtracted as an amortized daily burn from retained cash.
4. **15-Day Liabilities vs Buffer Test (Requirements 4 & 6)**:
   - Verifies ₹43,000 due within 15 days against ₹48,000 buffer with ₹1,500/day retained leaves ₹27,500 balance at Day 15, safely above the ₹1,500 buffer (`SAFE`).
5. **Lumpy Due Date Risk Trigger Test (Acceptance Criteria)**:
   - Verifies that a lump-sum payment (e.g. ₹50,000 on Day 2) correctly triggers **`RISK`** even when the daily cash flow average is positive.

---

## 🏁 Quick Verification Checklist

- [x] Homepage displays **Daily Retained Cash: +₹1,500/day** instead of gross sales.
- [x] Gross sales (₹8,000) is shown only as a secondary informative line.
- [x] **Received Cash in Hand** (₹48,000) and **Expected Receivables** (₹10,000) are separate cards.
- [x] 15-day dues (₹43,000) are timeline-based and not deducted as amortized daily burn.
- [x] Timeline engine forecasts 60 days day-by-day and displays **No Shortfall in 60 Days** (`SAFE`).
- [x] **Cash Flow Assumptions** drawer allows editing margin %, daily costs, opening cash, and buffer.
- [x] **Prediction Page** (`/prediction`) runs NVIDIA Nemotron 70B AI CFO analysis with interactive voice narration.
- [x] Native unit test suite passes with 0 failures (`npm test`).
