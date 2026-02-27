# 🧠 Cortex — AI Second Brain

Save any link from YouTube, Instagram, Twitter or anywhere. Claude AI summarizes and organizes everything for you.

**[Live Demo](https://your-cortex-app.vercel.app)**

---

## What it does

- Paste any link → AI summarizes and categorizes it automatically
- Search, pin, and organize your saved ideas
- Export as PDF, view knowledge graph, chat with your brain
- Works as a mobile app (PWA) — share directly from YouTube/Instagram
- Browser bookmarklet for one-click saving on desktop

## Tech Stack

- **Frontend** — React + Vite + Tailwind CSS
- **Backend** — Node.js + Express
- **AI** — Claude by Anthropic
- **Database** — Supabase
- **Hosting** — Vercel (frontend) + Railway (backend)

## Run Locally

```bash
git clone https://github.com/YOUR_USERNAME/cortex-app.git

# Frontend
cd frontend && npm install && npm run dev

# Backend (new terminal)
cd backend && npm install && npm run dev
```

Create `frontend/.env`:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_BACKEND_URL=http://localhost:5000
```

Create `backend/.env`:
```
ANTHROPIC_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

---

Built by **Ritu Vishwakarma** ❤️
