# ⚡ FinSafe — Predictive Cash Flow Management & Smart Voice Ledger for SMBs

[![Hackathon Problem Statement](https://img.shields.io/badge/Hackathon%20Track-F--03%20Predictive%20Cash--Flow%20Management-amber.svg)](PROJECT_REPORT.md)
[![Team](https://img.shields.io/badge/Team-Zenith%20%7C%20Zenniths%20Srujana%202026-black.svg)](PROJECT_REPORT.md)
[![Tests Passing](https://img.shields.io/badge/Unit%20Tests-36%2F36%20Passing-emerald.svg)](client/src/services/__tests__/cashFlow.test.js)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A production-grade, full-stack predictive financial platform designed specifically for Indian Retailers, Kiranas, and SMBs to eliminate cash-flow blind spots. It bridges real-time revenue collection, multilingual voice-powered credit bookkeeping (**eKhata**), automated 15-day liability tracking, native Android push notifications, and an **AI-driven 60-Day Predictive Cash Runway Engine**.

> 📋 **Official Hackathon Documentation**:
> * [**`PROJECT_REPORT.md`**](PROJECT_REPORT.md): The official 15-section comprehensive project report for hackathon evaluation and judges.
> * [**`FEATURES.md`**](FEATURES.md): Granular technical and UI manual detailing every module, algorithm, and AI pipeline.

---

## 🏆 Project & Team Overview

* **Project Title**: **FinSafe** — Predictive Cash Flow Management & Smart Multilingual Voice Ledger for SMBs
* **Team**: **Zenith** (Zenniths Srujana 2026)
  * **Vikas V (Vikas Kori)** — *Team Lead (Full-Stack Architecture & Lead Development)*
  * **Nitish Kumar** — *Team Member (AI Integrations, Mobile Packaging & Story Design)*
* **Theme**: **Fintech / MSME Financial Resilience & Predictive Financial Intelligence**
* **Official Problem Statement**:
  > ### **F-03. Predictive Cash-Flow Management for Small Businesses**
  > **Category**: `BUSINESS FINANCE | FORECASTING`
  >
  > *Develop a solution that enables small-business owners to understand their current liquidity position, anticipate future cash-flow shortages, and evaluate possible measures to maintain financial stability.*
  > *The solution accounts for expected revenue, payment schedules, outstanding receivables, supplier obligations, payroll, loan instalments, operating expenses, and available cash reserves. It distinguishes between expected income and money that has actually been received, while accounting for uncertainty in payment timing and business activity.*

---

## 🎯 The Core Business Problem

Indian SMBs operate under extreme cash asymmetry:
* **Inflows are irregular & delayed**: Counter cash sales, UPI QR transactions, wholesale invoices, and customer credit (**Udhar**) repaid on unpredictable schedules.
* **Outflows are fixed & non-negotiable**: Store rent on the 5th, machinery loan EMIs on the 10th, staff salaries, GST compliance, and supplier purchase bills due within 15 days.
* **Why traditional accounting fails**: Legacy tools (Tally, Vyapar, Khatabook) only record *past* transactions. FinSafe forecasts the *future survival horizon* (**Cash Runway**), alerting merchants before cash runs out to prevent bounced cheques and penalty fees.

---

## 📐 Business Logic Verification & Mathematical Specifications

All business logic across the platform has been audited for mathematical correctness, stability, and edge-case resilience (division-by-zero guards, month-end date transitions, negative cash flows, offline failovers).

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     FINSAFE RETAINED CASH & TIMELINE ENGINE                       │
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

### 1. Daily Retained Cash vs Gross Sales
Shopkeepers do not keep gross sales. Gross sales must replenish inventory and service day-to-day running costs. Every metric in FinSafe uses **Retained Cash**:

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

### 2. Separation of Received Cash vs Expected Receivables
To prevent false liquidity illusions, cash is divided into two distinct channels:
* **Received Cash (Certain / In Hand)**:
  $$\text{Received Cash} = \text{Opening Cash} + \text{Today's Received Sales} = 40,000 + 8,000 = \mathbf{₹48,000}$$
* **Expected Receivables (Khata / Credit)**:
  Total outstanding credit in eKhata (e.g. **₹10,000**).
* **Strict Rule**: Expected receivables are **NEVER** merged with cash in hand. They enter the timeline on their predicted due dates weighted by collection reliability ($w = 0.8$ in Base, $w = 0.4$ in Low).

### 3. Timeline-Based Cash Balance Projection (No Amortized Double Counting)
Rent, EMI, salaries, and supplier dues are **discrete dated events**. They are **NOT** amortized into a daily burn average:

$$\text{balance}[d] = \text{opening\_received\_cash} + \sum_{d' \le d} \text{retained\_cash}[d'] + \sum_{d' \le d} (\text{expected\_receivables\_due}[d'] \times w) - \sum_{d' \le d} \text{dues}[d']$$

* **On Days 1–4**: Zero rent is paid; only daily running costs apply (already netted inside retained cash).
* **On Day 5**: Rent (₹10,000) is deducted as a discrete timeline event.
* **On Day 10**: Machinery EMI (₹10,000) is deducted as a discrete timeline event.
* **On Day 18**: Commercial Electricity (₹3,000) is deducted.
* **Vendor Invoices**: Deducted on their exact calendar `dueDate`.

### 4. Tomorrow Bill Push Notification & Money Arrangement Algorithm
At scheduled intervals, the engine scans all upcoming obligations due tomorrow. If tomorrow's outflow breaches the merchant's safety buffer, FinSafe automatically:
1. Calculates the exact cash deficit gap ($\text{Deficit} = \text{Tomorrow Dues} + \text{Buffer} - \text{Projected Cash}$).
2. Ranks outstanding eKhata credit customers by collection reliability.
3. Dispatches a high-priority push notification with an actionable recovery plan (e.g., *"Action Required: ₹15,000 bill due tomorrow! Collect ₹5,000 from Ramesh to protect your buffer"*).

---

## 🗺️ Multi-Page Information Architecture

| Route | View Component | Core Business Capabilities |
| :--- | :--- | :--- |
| **`/`** | [`HomePage.jsx`](client/src/pages/HomePage.jsx) | **The Core Cash Operations Hub**: Combines **Predictive Runway Engine**, **Upcoming Payables (15d)**, and **Customer Udhar Receivables** on one screen. |
| **`/simulator`** | [`ScenarioSimulatorPage.jsx`](client/src/pages/ScenarioSimulatorPage.jsx) | **Scenario Simulator ("What-If" Analysis)**: Simulate shocks (30% sales drop, 10-day credit delay) and evaluate lowest-cost responses. |
| **`/how-it-works`** | [`HowItWorksPage.jsx`](client/src/pages/HowItWorksPage.jsx) | **Interactive Story Mode**: Complete narrative walkthrough of Nitish Kumar's *Nivika Sweets* shop across baseline, shock, and recovery states. |
| **`/prediction`** | [`PredictionPage.jsx`](client/src/pages/PredictionPage.jsx) | **NVIDIA Nemotron AI CFO**: Business-type working capital diagnosis, sales vs payables velocity analysis, conversational AI CFO talk, and voice narration. |
| **`/income`** | [`IncomePage.jsx`](client/src/pages/IncomePage.jsx) | **Daily Sales Tracking**: Real-time sales breakdown (Cash, UPI QR, Invoices) and interactive target achievement progress bar. |
| **`/fixed-expenses`** | [`FixedExpensesPage.jsx`](client/src/pages/FixedExpensesPage.jsx) | **Recurring Commitments**: Store lease, machinery loan EMIs, staff salaries, electricity bills, and receipt voucher uploads. |
| **`/ekhata`** | [`EKhataLedgerPage.jsx`](client/src/pages/EKhataLedgerPage.jsx) | **AI Voice Ledger**: Multilingual speech parsing in Hindi/Hinglish/English, customer transaction histories, and 1-click WhatsApp payment reminders. |
| **`/profile`** | [`ProfilePage.jsx`](client/src/pages/ProfilePage.jsx) | **Merchant Identity & Executive Overview**: Operator details, GSTIN compliance, UPI VPA configuration, KYC status, and executive summary KPI radar. |
| **`/login`** | [`AuthPage.jsx`](client/src/pages/AuthPage.jsx) | **Authentication Portal**: Secure JWT login, new merchant registration, and **1-Click Verified Demo Login**. |

---

## 🛠️ Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINSAFE PLATFORM STACK                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Frontend:      React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router │
│  Mobile:        Capacitor 7 Android Native Shell (4.6 MB Standalone APK)     │
│  Audio Engine:  Web Speech Synthesis API + MediaRecorder API (WebM/Opus)    │
│  Backend:       Node.js 24 (ESM), Express.js, MongoDB Atlas (Mongoose)      │
│  AI Engine 1:   NVIDIA NIM (meta/llama-3.1-70b-instruct / nemotron-70b)     │
│  AI Engine 2:   Groq Cloud LPU (Whisper Large v3 + LLaMA 3.3 70B)           │
│  Security:      JWT (JSON Web Tokens), Bcrypt.js, Helmet, CORS Isolation    │
│  Testing:       Native Node.js Test Runner (36 unit tests passing)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Automated Unit Test Suite

The platform includes a comprehensive mathematical and business-logic unit test suite (`client/src/services/__tests__/cashFlow.test.js`) executed with the native Node.js test runner:

```bash
cd client
npm test -- --run
```

```
▶ FinSafe Cash-Flow Engine & Retained Cash Specifications (7 tests)
▶ Festival & Context Sales Adjuster Specifications (5 tests)
▶ 60-Day Timeline Due Markers & Vertical Step Specifications (4 tests)
▶ User Explicit Verification Tests (Unified Cash Engine) (5 tests)
▶ Scenario Simulator & Response Comparison Specifications (4 tests)
▶ Stock-Reserve Logic & Auto-Scheduled Restock Specifications (6 tests)
▶ Dynamic Khata Cash-Inflow & Stock Preservation Specifications (2 tests)
▶ Mobile App: Tomorrow Bill Push Notification & Money Arrangement Specifications (3 tests)

✔ 36 tests passed, 0 failed, 8 suites (~2.9s)
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.x, v20.x, or v24.x LTS
* **npm**: v9.0.0 or higher
* **MongoDB**: MongoDB Atlas connection URI or local MongoDB instance

### 2. Environment Configuration

#### Backend (`server/.env`)
```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aurumflow?retryWrites=true&w=majority
JWT_SECRET=finsafe_super_secret_jwt_key_2026
NVIDIA_API_KEY=nvapi_your_nvidia_nim_key_here
GROQ_API_KEY=gsk_your_groq_api_key_here
CLIENT_URL=http://localhost:5174
```

#### Frontend (`client/.env`)
```env
VITE_API_URL=https://zenniths-srujana-2026.vercel.app/api/v1
```

### 3. Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/vikasvkori1290/Zenniths_srujana_2026.git
cd Zenniths_srujana_2026

# 2. Install dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..

# 3. Run unit tests
cd client && npm test -- --run && cd ..

# 4. Start development servers
# Terminal 1: Backend API (Port 5000)
cd server && npm run dev

# Terminal 2: Frontend Client (Port 5174)
cd client && npm run dev
```

### 4. Verified Demo Access (Evaluators & Judges)
* **URL**: `http://localhost:5174/login` (or deployed live URL)
* **Instant 1-Click Access**: Click the **"Demo Login"** button on the sign-in card.
* **Manual Credentials**:
  * **Email**: `nin46642@gmail.com`
  * **Password**: `123456`
  * **Merchant Persona**: Nitish Kumar (*Nivika Sweets*, Sweet & Bakery Retailer with pre-populated transactions, upcoming EMI/rent obligations, and Udhar accounts).

---

## 📱 Mobile APK Download

A pre-compiled native Android APK is included directly in the root repository:
* [**`FinSafe-mobile-app.apk`**](FinSafe-mobile-app.apk) (4.6 MB)
* Features native hardware back button support, offline caching, and automated local push notifications for upcoming bills.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
