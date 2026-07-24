# 📘 Dokumentasi aidesign.md — Untuk Stitch

**aidesign.md** adalah web app yang bisa **mengekstrak design system dari website manapun** secara otomatis. User tinggal paste URL, sistem bakal ngambil HTML+CSS, parsing semua token desain, terus AI bikin file `DESIGN.md` yang rapi.

---

## 🧠 Core Concept

```
User paste URL → Fetch HTML+CSS → Parse tokens → AI generate → DESIGN.md
```

Bayangin lo mau tau gimana warna, font, spacing yang dipake Stripe atau Linear.app. Biasanya lo buka inspect element manual satu-satu. Di sini, semuanya otomatis — tinggal masukin URL, 30 detik dapet file desain system lengkap.

---

## 🏗️ Tech Stack

| Layer | Pilihan |
|---|---|
| **Framework** | Next.js 15 (App Router) + TypeScript |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Auth** | Firebase Authentication (Google OAuth) |
| **Database** | Firebase Firestore (Spark free plan) |
| **AI** | OpenRouter (free models — `:free` slug) |
| **HTML Parser** | cheerio |
| **CSS Parser** | css-tree |
| **Markdown** | react-markdown + remark-gfm |
| **Deploy** | Vercel (Hobby free) |

---

## 🔐 Auth Flow

### Login (Google OAuth)

1. User klik **"Continue with Google"**
2. Popup Firebase Auth muncul → user pilih akun Google
3. `onAuthStateChanged` trigger → bikin/update doc di Firestore `users/{uid}`
4. Cek email user cocok dengan `NEXT_PUBLIC_ADMIN_EMAIL`? Kalo iya → role `admin`, kalo enggak → `user`
5. Redirect ke halaman utama

### Auth Protection

- **Halaman utama (`/`)** — Wajib login, kalo gak redirect ke `/login`
- **Admin panel (`/admin`)** — Wajib role `admin`, kalo enggak redirect ke `/`
- **API `/api/analyze`** — Wajib `Authorization: Bearer <idToken>` header
- **API `/api/admin/*`** — Wajib token + role admin

---

## 🎨 Pipeline Ekstraksi Design

### Step 1: Fetch HTML (`POST /api/analyze`)
- Validasi URL (harus publik, gak boleh IP privat/localhost/SSRF)
- Fetch HTML + resolve redirect
- Cek Content-Type (harus text/html)
- Limit 1MB, timeout 10s

### Step 2: Parse HTML (`src/lib/extract/html.ts`)
- `cheerio.load(html)` — parsing DOM
- Ambil `<link rel="stylesheet">` → URL CSS external
- Ambil `<style>` → CSS inline
- Ambil `<title>`, `<meta description>` → metadata
- Deteksi pola komponen dari class/selector

### Step 3: Fetch & Parse CSS (`src/lib/extract/css.ts`)
- Fetch semua CSS eksternal (timeout 5s per file)
- Gabung semua CSS (max 300KB)
- `css-tree.parse(css)` → AST
- Ekstrak:
  - **Colors** — hex, rgb, rgba
  - **Font families** — `font-family` declarations
  - **Font sizes** — `font-size`
  - **Font weights** — `font-weight`
  - **Line heights** — `line-height`
  - **Spacing** — margin, padding, gap
  - **Border radius** — `border-radius`
  - **Shadows** — `box-shadow`
  - **Breakpoints** — `@media` queries
  - **CSS variables** — `--custom-properties`

### Step 4: Build `ExtractedDesign` object
```typescript
{
  url: "https://stripe.com",
  domain: "stripe.com",
  colors: [{ hex: "#635bff", count: 42, role: "primary" }, ...],
  typography: {
    fontFamilies: [{ name: "Inter", stack: "Inter, sans-serif", count: 10 }],
    sizes: [{ value: "48px", px: 48 }],
    weights: [400, 500, 600, 700],
    lineHeights: ["1.5", "1.2"],
  },
  spacing: [{ value: "16px", px: 16 }],
  borderRadius: [{ value: "8px", px: 8 }],
  shadows: ["0 4px 6px rgba(0,0,0,0.1)"],
  breakpoints: ["768px", "1024px"],
  components: [{ name: "Button", tag: "button", classes: ["btn","btn-primary"], count: 12 }],
  cssVariables: { "--color-brand": "#635bff" },
  meta: { title: "Stripe", cssSizeKB: 120, htmlSizeKB: 45 }
}
```

### Step 5: AI Generate DESIGN.md (`src/lib/ai/openrouter.ts`)
- System prompt: "Kamu adalah design systems engineer..."
- User prompt: kirim JSON `ExtractedDesign` + template struktur DESIGN.md
- **Magic:** Model gratis, fallback 5 model kalo error/rate limit
- Output: `# DESIGN.md — domain\n## 1. Overview\n## 2. Color Palette\n## 3. Typography\n...`

---

## 🤖 AI Model Strategy

### Model Priority (verified free July 2026)

| # | Model | Context | Kenapa |
|---|---|---|---|
| 1 | `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M | Paling stabil, banyak provider |
| 2 | `openai/gpt-oss-20b:free` | 131K | Cepet, output lurus tanpa reasoning |
| 3 | `cohere/north-mini-code:free` | 256K | Stabil, cocok buat teks terstruktur |
| 4 | `poolside/laguna-xs-2.1:free` | 262K | Cepet, coding-agent model |
| 5 | `openrouter/free` | auto | Auto-routing ke model gratis manapun |

### Fallback Logic
```
for each model:
  try 2x dengan 2s delay antar attempt
  kalo error/429/timeout → lanjut model berikutnya
  kalo semua gagal → "All models busy, coba lagi"
```

### Special Handling: Reasoning Models
Beberapa model gratis (poolside/laguna) adalah "reasoning models" — mereka mikir dulu di field `reasoning` baru output di `content`. Kadang `content` nya null. Kode handle ini manual:
```javascript
if (!content?.trim() && choice?.reasoning) {
  content = choice.reasoning.replace(/^(Okay|Alright|Let me).../i, '')
}
```

---

## 🗄️ Firestore Database

### Collections

#### `users/{uid}`
```json
{
  "email": "user@gmail.com",
  "displayName": "User",
  "photoURL": "https://...",
  "role": "user" | "admin",
  "createdAt": Timestamp,
  "lastActive": Timestamp,
  "totalAnalyses": 5
}
```

#### `cache/{urlHash}`
```json
{
  "markdown": "# DESIGN.md...",
  "domain": "stripe.com",
  "model": "nvidia/nemotron-3-ultra-550b-a55b:free",
  "createdAt": 1784664000000
}
```
- TTL 24 jam
- Hash dari URL (lowercase + version)
- URL yang sama dalam 24 jam → return cache, gak panggil AI lagi

#### `userRatelimits/{uid}`
```json
{
  "lastAnalysisAt": Timestamp
}
```
- Cooldown 20 menit
- Admin skip cooldown

#### `analyses/{autoId}`
```json
{
  "uid": "...",
  "email": "...",
  "url": "https://stripe.com",
  "domain": "stripe.com",
  "model": "nvidia/...",
  "ok": true,
  "ms": 34500,
  "cached": false,
  "createdAt": Timestamp
}
```
- Sampling 33% aja biar hemat Spark plan (20k writes/hari)

### Rate Limits
- **User biasa:** 1x analisis per 20 menit
- **Admin:** Unlimited
- **Cache:** 24 jam, skip rate limit kalo cache hit

---

## 📂 Struktur Folder Lengkap

```
src/
├─ app/
│  ├─ page.tsx                    # Halaman utama (input URL + hasil)
│  ├─ layout.tsx                  # Root layout (SEO, fonts)
│  ├─ providers.tsx               # Client wrapper (Auth + Theme provider)
│  ├─ globals.css                 # CSS variables + iOS glass styles
│  ├─ login/page.tsx              # Halaman login Google
│  ├─ admin/page.tsx              # Dashboard admin (stats)
│  ├─ admin/layout.tsx            # Layout admin (tab navigation)
│  ├─ admin/users/page.tsx        # Manajemen user + role
│  ├─ admin/analyses/page.tsx     # Riwayat analisis
│  └─ api/
│     ├─ analyze/route.ts         # POST pipeline utama
│     ├─ admin/users/route.ts     # GET list users, PATCH role
│     └─ admin/analyses/route.ts  # GET riwayat analisis
├─ components/
│  ├─ AuthProvider.tsx            # Context auth (Google login, role)
│  ├─ UrlForm.tsx                 # Input URL + contoh situs
│  ├─ LoadingState.tsx            # 3-step progress indicator
│  ├─ ResultPanel.tsx             # Tab Preview + Raw + Copy + Download
│  ├─ MarkdownPreview.tsx         # Render DESIGN.md
│  ├─ CopyButton.tsx              # Clipboard API
│  ├─ DownloadButton.tsx          # Blob download
│  ├─ Navbar.tsx                  # Navbar + avatar + admin link
│  ├─ theme/ThemeProvider.tsx     # Dark/light mode context
│  └─ theme/ThemeToggle.tsx       # Toggle button
└─ lib/
   ├─ ai/openrouter.ts            # Fallback chain 5 model
   ├─ ai/prompts.ts               # System + user prompt buat AI
   ├─ extract/html.ts             # cheerio parser (fetch, meta, komponen)
   ├─ extract/css.ts              # css-tree parser (warna, font, spacing, dll)
   ├─ extract/types.ts            # Semua TypeScript interfaces
   ├─ firebase/client.ts          # Firebase Client SDK init
   ├─ firebase/server.ts          # Server-side: verify token, rate limit, cache, log
   └─ utils/ratelimit.ts          # In-memory fallback
```

---

## 🔄 API Flow Lengkap

```
[Browser]                          [Next.js Server]              [OpenRouter]        [Firestore]
    │                                    │                            │                   │
    ├─ POST /api/analyze ──────────────► │                            │                   │
    │  { url: "stripe.com" }             │                            │                   │
    │  Authorization: Bearer token       │                            │                   │
    │                                    ├─ Verify ID Token ──────────┼──────────────────► │
    │                                    │◄─ { uid, email, role } ───┼─────────────────── │
    │                                    │                            │                   │
    │                                    ├─ Check rate limit ────────┼──────────────────► │
    │                                    │◄─ allowed / 429 ──────────┼─────────────────── │
    │                                    │                            │                   │
    │                                    ├─ Check cache ─────────────┼──────────────────► │
    │                                    │◄─ cached markdown / null ─┼─────────────────── │
    │                                    │                            │                   │
    │                                    ├─ Fetch HTML ─────────────► │                   │
    │                                    │◄─ HTML ────────────────── │                   │
    │                                    │                            │                   │
    │                                    ├─ Parse CSS ───────────────► │                   │
    │                                    │◄─ Tokens ──────────────── │                   │
    │                                    │                            │                   │
    │                                    ├─ Call OpenRouter ──────────┼──────────────────► │
    │                                    │◄─ DESIGN.md ──────────────┼─────────────────── │
    │                                    │                            │                   │
    │                                    ├─ Save cache ──────────────┼──────────────────► │
    │                                    ├─ Log analysis ────────────┼──────────────────► │
    │                                    │                            │                   │
    │◄─ { ok, markdown, domain, model } ─┤                            │                   │
```

---

## 🔧 Environment Variables (Vercel)

```
# Wajib
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=1:xxx:web:xxx
NEXT_PUBLIC_APP_URL=https://aidesign.vercel.app

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=rajxzdev@gmail.com
```

---

## 🚀 Fitur Utama

1. **Paste URL → Dapat DESIGN.md** — Inti produk
2. **Copy & Download** — Clipboard API + Blob download, tanpa server storage
3. **Cache 24 Jam** — URL yang sama gak bayar AI 2x
4. **Rate Limit 20 Menit** — Per user, admin unlimited
5. **Google OAuth** — Login sekali klik
6. **Admin Panel** — Monitoring user + analisis, manage role
7. **Dark/Light Mode** — Toggle di navbar
8. **AI Fallback Chain** — 5 model gratis, auto-switch kalo error
9. **Firestore Spark Plan** — Gratis, 50k reads/20k writes per hari

---

## 📋 Output DESIGN.md

File yang dihasilkan AI punya format:

```markdown
# DESIGN.md — domain
_Generated 2026-07-22 · aidesign.md_

## 1. Overview
## 2. Color Palette (tabel: Token | Hex | Role)
## 3. Typography (font, scale, weights, line-height)
## 4. Spacing & Layout (spacing scale, breakpoints)
## 5. Border Radius & Elevation
## 6. Component Patterns
## 7. CSS Custom Properties (:root { ... })
## 8. Usage Notes
```

---

## 🔜 Yang Perlu Didesign Ulang (Tunggu File)

Ini komponen yang masih pake styling basic dan pengen lo kasi referensi:

| Komponen | Halaman |
|---|---|
| Hero + Form URL | `/` |
| Loading animation | `/` |
| Result panel (Preview/Raw) | `/` |
| Login card | `/login` |
| Navbar | Semua halaman |
| Admin dashboard | `/admin` |
| Admin users table | `/admin/users` |
| Admin analyses table | `/admin/analyses` |

---

Dokumen ini siap dikasih ke **Stitch** atau siapa pun yang perlu paham arsitektur lengkap aidesign.md 🚀
