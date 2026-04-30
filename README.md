# CRM HCP Module – AI-First Log Interaction Screen

A full-stack AI-powered CRM system for Healthcare Professionals (HCP), built for life science field representatives. Allows logging HCP interactions via a **structured form** or a **conversational AI chat** that auto-fills the form.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Redux Toolkit |
| Backend | Python 3.11 + FastAPI |
| AI Agent | LangGraph |
| LLMs | Groq (`gemma2-9b-it`, `llama-3.3-70b-versatile`) |
| Database | MySQL |
| Font | Google Inter |

---

## 📁 Project Structure

```
crm-hcp/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── init_db.py           # DB table creation script
│   ├── requirements.txt
│   ├── .env.example
│   ├── agents/
│   │   └── crm_agent.py     # LangGraph agent + 5 tools
│   ├── models/
│   │   ├── database.py      # SQLAlchemy models
│   │   └── schemas.py       # Pydantic schemas
│   └── routers/
│       ├── interactions.py  # CRUD endpoints
│       └── agent.py         # AI chat endpoint
└── frontend/
    ├── public/index.html
    ├── package.json
    └── src/
        ├── index.js
        ├── App.js           # Main UI (form + chat panel)
        ├── store/index.js   # Redux store
        └── api/index.js     # Axios API calls
```

---

## ⚙️ Setup Instructions

### 1. MySQL Database

```sql
CREATE DATABASE crm_hcp;
```

### 2. Backend Setup

```bash
cd backend

# Copy and fill in your credentials
cp .env.example .env
# Edit .env: set GROQ_API_KEY and DATABASE_URL

# Install dependencies
pip install -r requirements.txt

# Create tables
python init_db.py

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
# Opens at http://localhost:3000
```

---

## 🤖 LangGraph Agent – 5 Tools

| # | Tool Name | Description |
|---|-----------|-------------|
| 1 | `extract_interaction_data` | **Log Interaction** – Parses free-text into structured fields (HCP name, date, topics, sentiment, etc.) using `llama-3.3-70b-versatile` |
| 2 | `edit_interaction_data` | **Edit Interaction** – Takes current form data + natural-language instruction, returns only the changed fields using `gemma2-9b-it` |
| 3 | `suggest_follow_up` | Suggests 2–3 next-best actions (schedule meeting, share study, send sample) based on interaction summary |
| 4 | `summarize_interaction` | Converts verbose field rep notes into a clean 2–3 sentence CRM-ready summary |
| 5 | `analyze_hcp_sentiment` | Infers HCP sentiment (Positive/Neutral/Negative) with reasoning from interaction text |

---

## 🚀 How It Works

1. **Chat to Fill Form**: Type naturally in the AI chat panel, e.g.:
   > "Met Dr. Priya Sharma today, discussed Product X efficacy and side effects. Sentiment was positive. Shared brochures and clinical study. Follow up: schedule demo next week."
   
   → The form auto-populates with extracted fields instantly.

2. **Edit via AI**: With a saved interaction, type an edit instruction:
   > "Change the sentiment to Neutral and add 'Shared samples' to materials"
   
   → Only the changed fields update in the form.

3. **Manual Form**: Fill fields directly and click Save.

4. **History Tab**: View all past interactions, click "Edit" to reload any record.

---

## 🔑 Environment Variables

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/crm_hcp
```

Get your Groq API key at: https://console.groq.com

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agent/chat` | AI agent chat (auto-fills/edits form) |
| POST | `/api/interactions/` | Save interaction |
| GET | `/api/interactions/` | List all interactions |
| PUT | `/api/interactions/{id}` | Update interaction |
| DELETE | `/api/interactions/{id}` | Delete interaction |
