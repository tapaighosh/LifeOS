# 🧠 LifeOS — Personal AI-Powered Life Operating System

> Stop wondering "what should I do today" — let AI plan your day across work, wellness, and growth, then adapt when life happens.

---

## 🎯 What is LifeOS?

LifeOS is a personal productivity app that uses AI (Claude + Gemini) to generate realistic, adaptive daily plans across three life pillars:

| Pillar | Purpose | Examples |
|--------|---------|----------|
| 💰 **Money Making** | Career growth, income-related learning | Interview prep, system design, certifications |
| 🔥 **For My Soul** | Activities that restore and energise | Trekking, gym, cooking, walking, rest |
| 🧠 **For My Curiosity** | Intellectual growth, no monetary goal | AI updates, reading, language practice |

**Core Loop:** Morning plan generation → Day execution → Night check-in → Weekly review

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Database | MongoDB Atlas / Local MongoDB |
| ODM | Mongoose |
| AI Primary | Anthropic Claude API |
| AI Fallback | Google Gemini API |
| Auth | NextAuth.js (credentials) |
| Styling | Tailwind CSS v3 |
| State | Zustand + SWR |
| Hosting | Vercel |
| Dev Tools | Graphify |

---

## 📦 Module-by-Module Development

This project is built incrementally using step-by-step module prompts. **Run one prompt at a time.**

👉 **Full prompt guide: [`MODULE_PROMPTS.md`](MODULE_PROMPTS.md)**

| # | Module | Phase | Status |
|---|--------|-------|--------|
| 0 | Project Setup & Scaffolding | Phase 1 | ✅ Completed |
| 1 | Task CRUD & Master List | Phase 1 | ✅ Completed |
| 2 | Recharge Library | Phase 1 | ✅ Completed |
| 3 | User Settings & Preferences | Phase 1 | ✅ Completed |
| 4 | Daily Plan Generation (Rule-Based) | Phase 1 | ✅ Completed |
| 5 | Night Check-In Flow | Phase 1 | ✅ Completed |
| 6 | Event Blocks & Calendar | Phase 1 | ✅ Completed |
| 7 | AI Integration (Claude/Gemini) | Phase 1 | ✅ Completed |
| 8 | Spaced Repetition System | Phase 1 | ✅ Completed |
| 9 | Weekly Review & Insights | Phase 1 | ✅ Completed |
| 10 | PWA, Notifications & Deploy | Phase 1 | ⬜ Not Started |
| P2-A | Challenge System | Phase 2 | ✅ Completed |
| P2-B | Responsive Navigation | Phase 2 | ✅ Completed |
| P2-C | Time-Aware Dashboard | Phase 2 | ✅ Completed |
| P3-A | Topic Queue System | Phase 3 | ✅ Completed |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local) or MongoDB Atlas account
- Anthropic API key (for AI features)
- Google AI API key (for Gemini fallback — optional)

### Local Development

```bash
# Clone the repo
git clone <your-repo-url>
cd LifeOS

# Install dependencies (after Module 0 scaffolding)
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Start development server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

```env
# Database (choose one)
MONGODB_URI=mongodb://localhost:27017/lifeos          # Local
MONGODB_URI=mongodb+srv://user:pass@cluster/lifeos    # Atlas

# Auth
NEXTAUTH_SECRET=your-random-32-char-string
NEXTAUTH_URL=http://localhost:3000

# AI
ANTHROPIC_API_KEY=sk-ant-your-key
GOOGLE_AI_API_KEY=your-gemini-key
AI_PROVIDER=claude    # claude | gemini | claude-dev | gemini-dev

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🗄️ MongoDB Atlas Setup

### Option 1: Local MongoDB (Development)

```bash
# Using Docker
docker run -d --name lifeos-mongo -p 27017:27017 mongo:7

# Set env var
MONGODB_URI=mongodb://localhost:27017/lifeos
```

### Option 2: MongoDB Atlas (Production)

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) → Create a free M0 cluster
2. **Database Access**: Create a user with read/write permissions
3. **Network Access**: Add your IP (or `0.0.0.0/0` for development, Vercel IPs for production)
4. **Connect**: Click "Connect your application" → Copy the connection string
5. Replace `<password>` in the connection string with your database user's password
6. Set `MONGODB_URI` in `.env.local` (local) and Vercel environment variables (production)

```env
MONGODB_URI=mongodb+srv://lifeos-user:<password>@cluster0.xxxxx.mongodb.net/lifeos?retryWrites=true&w=majority
```

**Atlas Tips:**
- M0 free tier gives 512MB — plenty for personal use
- Enable automated daily backups (default on M0)
- Set cost alerts to avoid surprise charges

---

## 🔍 Graphify — Knowledge Graph

This project uses **Graphify** to build a knowledge graph of the codebase, enabling the AI agent to navigate architecture and dependencies intelligently.

### Setup

```bash
# Install Graphify globally (if not already)
npm install -g @anthropic/graphify

# Build the knowledge graph
graphify init .
graphify build .
```

### Usage

```bash
# Ask architecture questions
graphify query "How does the AI layer connect to plan generation?"

# Trace module dependencies
graphify path "Task" "DailyPlan"

# Explain a concept
graphify explain "spaced repetition"

# Update graph after code changes (no API cost)
graphify update .
```

### Agent Integration

The AI agent is configured to use Graphify automatically (see `.agents/rules/graphify.md`):
- Before answering architecture questions, the agent reads `graphify-out/GRAPH_REPORT.md`
- If the Graphify MCP server is active, it uses `query_graph`, `get_node`, `shortest_path` tools
- After modifying code, it runs `graphify update .` to keep the graph current

---

## 🤖 Agent Configuration

This project uses a structured agent setup for AI-assisted development:

```
.agents/
├── rules/
│   ├── production-standards.md    # Coding standards (Next.js, MongoDB, AI layer)
│   ├── .agentignore               # Files the agent should skip
│   ├── auto-log.md                # Auto-log all interactions
│   └── graphify.md                # Graphify knowledge graph rules
└── workflows/
    ├── module-implement.md        # Step-by-step module building
    ├── code-review.md             # Standardized code review
    └── generate-tests.md          # Test generation

.ai-context/
├── project_context.md             # Product overview
├── architecture.md                # DB schemas, API routes, AI layer
├── BRD.md                         # Business Requirements Document
├── test_cases.md                  # Master test scenarios
├── prompt_history.md              # Auto-generated session log
└── prompts.md                     # Quick prompt reference
```

---

## 📝 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL, ANTHROPIC_API_KEY, etc.
```

### Production Checklist
- [ ] Set all environment variables in Vercel
- [ ] Configure MongoDB Atlas IP whitelist for Vercel IPs
- [ ] Set `NEXTAUTH_URL` to your Vercel deployment URL
- [ ] Set `AI_PROVIDER=claude` for production
- [ ] Set Anthropic API cost cap ($10/month recommended)
- [ ] Enable Vercel Analytics (optional)

---

## 📄 License

Personal project — not open source.
