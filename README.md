# VeriDecide - Responsible GenAI Governance Platform

VeriDecide is a high-stakes decision assurance platform that treats LLMs as untrusted components. It ensures every AI output is grounded in trusted evidence, validated against organizational policies, and fully auditable.

## 🚀 Key Features

- **Prompt Studio**: Test prompts with custom governance pipelines.
- **Evidence Library**: Manage internal trusted documents for RAG.
- **Decision Audit**: Tamper-proof logging for all AI-assisted decisions.
- **Human-in-the-Loop**: Seamless workflow for manual review of high-risk outputs.
- **Multi-tenant Architecture**: Enterprise-ready isolation and management.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 (React 19, Tailwind CSS 4)
- **Backend**: Supabase (PostgreSQL, pgvector)
- **Governance**: Custom RAG & Policy Enforcement Engine
- **LLM**: Google Gemini (via API)

## 📄 Documentation

Comprehensive documentation, including architecture details and API references, can be found in:
👉 **[docs/DOCUMENTATION.md](docs/DOCUMENTATION.md)** (Local)
_(Note: This folder is ignored in the main Git repository for sensitive deployments, check the `docs` branch or local files for full technical manuals.)_

## 🏁 Quick Start

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Revaldoo24/VeriDecide.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment**:
    Fill in `.env.local` with your Supabase and Gemini credentials.
4.  **Run Locally**:
    ```bash
    npm run dev
    ```

## ⚖️ License

Proprietary - All Rights Reserved.
