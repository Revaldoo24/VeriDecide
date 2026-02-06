# VeriDecide - Responsible GenAI Governance Platform

**Repository**: [https://github.com/Revaldoo24/VeriDecide.git](https://github.com/Revaldoo24/VeriDecide.git)

VeriDecide is an enterprise-grade platform designed to make Generative AI **safe, legal, and trusted** for high-stakes decision-making. Unlike standard AI chatbots, VeriDecide treats the AI model as an "untrusted intern"—it checks every fact, enforces strict rules, and records every step for future audits.

---

## 🚀 Key Features (What does it do?)

### 1. Trusted Answers Only (RAG)

It doesn't just "guess". It finds answers from:

- **Internal Documents**: Your company's verified PDF policies.
- **Official Open Source**: Validated government or educational sites (e.g., `.gov`, `.edu`).
- _Feature_: If the AI can't find proof, it refuses to answer.

### 2. "Fact-Checker" Bot (Validation Engine)

Automatically detects **hallucinations** (lies/errors).

- **Green**: "Grounded" - Every sentence matches the provided documents.
- **Red**: "Hallucinated" - The AI made something up.
- _UI_: You see a clear "Traffic Light" score (Low/Medium/High Risk) on every answer.

### 3. Human Gatekeeper (Human-in-the-Loop)

No dangerous decision goes live without human approval.

- **Review Dashboard**: A human expert sees the AI's answer side-by-side with the original law/policy.
- **Forced Justification**: The underlying system **forces** the human to type _why_ they approved it (e.g., "Verified against Clause 5a").

### 4. Forensic Audit Trail (The "Black Box" Recorder)

Every action is cryptographically locked.

- "Who submitted the prompt?"
- "Which AI model answered?"
- "Which documents were used?"
- "Who approved it?"
- _Result_: A tamper-proof timeline that holds up in a legal audit.

---

## 🛠️ Technology Stack (Under the Hood)

We use modern, robust technologies to ensure security and speed.

| Component     | Technology                | Why we chose it (Layman explanation)                                                                                                                        |
| :------------ | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework** | **Next.js 15 (React)**    | The "chassis" of the car. It builds the website you see, handles the buttons, and runs the logic for connecting everything.                                 |
| **Language**  | **TypeScript**            | The "strict grammar" code. It prevents bugs by ensuring data moving around is exactly what we expect (e.g., numbers are numbers, text is text).             |
| **Database**  | **Supabase (PostgreSQL)** | The "filing cabinet". It stores trustable documents, audit logs, and user data. It uses **RLS (Row Level Security)** so User A never sees User B's secrets. |
| **AI Brain**  | **Gemini (Google)**       | The "engine". It understands language and drafts the text, but VeriDecide acts as the "brakes and steering" to keep it safe.                                |
| **Search**    | **pgvector**              | The "librarian". It converts text into math (vectors) to find the _exact_ paragraph relevant to your question, even if you use different words.             |
| **Audit**     | **SHA-256 Hashing**       | The "digital wax seal". It fingerprints every record. If someone sneaks into the database and changes a log, the seal breaks, alerting the system.          |

---

## 🔌 API Documentation (Simplified)

The system exposes "endpoints" (digital doors) for other apps to talk to VeriDecide.

### 1. The Decision Pipeline (`POST /api/pipeline`)

This is the main door. You throw a question in, and it runs the entire governance process.

- **Input (What you send):**
  ```json
  {
    "prompt": "What is the max loan amount?",
    "domain": "Finance"
  }
  ```
- **Output (What you get back):**
  ```json
  {
    "answer": "The max loan is $50,000...",
    "risk_score": "LOW",
    "proof": ["[Source: Loan Policy v2, Page 5]"],
    "status": "PENDING_REVIEW"
  }
  ```
  _Meaning: "Here is the answer, it's low risk, I found proof on Page 5, but a human still needs to double-check it."_

### 2. The Audit Log (`GET /api/audit`)

This door lets auditors see the history.

- **Output:**
  ```json
  [
    { "time": "10:00 AM", "action": "AI Generated Draft", "hash": "abc123..." },
    { "time": "10:05 AM", "action": "Human Approved", "hash": "xyz789..." }
  ]
  ```
  _Meaning: A chronological list of everything that happened, stamped with a code that proves it hasn't been changed._

---

## 💻 Quick Start (Developer Setup)

### 1. Configure Supabase

Run the SQL migrations in `supabase/migrations/` using your Supabase SQL editor. This sets up the database tables and security rules.

### 2. Configure Environment

Create a `.env.local` file with your keys:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
```

### 3. Run the App

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to see the **VeriDecide Dashboard**.

---

### Folder Structure

- `src/app/` - The User Interface (pages you see).
- `src/lib/governance/` - The "Police" logic (validators, policy checkers).
- `src/lib/audit/` - The "Recorder" logic (hashing, logging).
- `supabase/migrations/` - The Database blueprints.
