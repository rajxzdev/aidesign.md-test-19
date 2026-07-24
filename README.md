# aidesign.md 🎨

Turn any website into a structured **DESIGN.md** document — colors, typography, spacing, components, and CSS variables. AI-powered, instant.

by rajxzdev

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Set these in Vercel:

```
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_ADMIN_EMAIL=your@email.com
```

## Features

- 🔐 Google OAuth login
- ⏱ 20-min rate limit per user (admins unlimited)
- 👑 Admin panel with user monitoring
- 🎨 Design token extraction (colors, typography, spacing, shadows)
- 🤖 AI analysis via OpenRouter
- 💾 Firestore cache (24h TTL)
- 📋 Copy & download DESIGN.md
