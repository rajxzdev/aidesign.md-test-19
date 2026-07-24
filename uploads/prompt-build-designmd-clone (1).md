# PROMPT — Bangun Web App "DesignMD" Clone dengan Integrasi AI (OpenRouter, 100% Gratis)

> **Cara pakai:** Tempel seluruh dokumen ini sebagai prompt ke AI coding agent kamu (Cursor / Claude Code / v0 / Bolt / Lovable / Windsurf). Bagian yang ada di dalam kurung siku `[...]` boleh kamu sesuaikan.

---

## 1. PERAN KAMU

Kamu adalah senior full-stack engineer. Tugasmu membangun sebuah web app production-ready bernama **[NAMA_APP, misal: "DesignExtract"]** dari nol sampai siap deploy. Ikuti semua spesifikasi di dokumen ini secara ketat. Jika ada keputusan teknis yang tidak disebutkan, pilih opsi paling sederhana, gratis, dan minim maintenance. Jangan menambahkan dependency berbayar atau layanan yang butuh kartu kredit.

## 2. VISI & MISI PRODUK

**Visi:** Membantu developer, desainer, dan AI agent mendapatkan "design system" dari website mana pun secara instan — cukup paste URL, dapatkan file `DESIGN.md` yang rapi, terstruktur, dan siap dipakai untuk handoff, dokumentasi, atau konteks AI.

**Misi / cara kerja (sama seperti designmd.me, tapi ditambah AI):**
1. User paste URL website apa pun (misal `stripe.com`).
2. Sistem mengambil HTML + CSS situs tersebut (di server, bukan di browser, untuk menghindari CORS).
3. Sistem mengekstrak design tokens secara heuristik: **color palette, typography (font family, scale, weight, line-height), spacing, border-radius, shadow, breakpoints/layout, dan pola komponen** (button, card, navbar, form, dll).
4. **AI (via OpenRouter)** menganalisis hasil ekstraksi, memberi nama token yang semantik, menyusun hierarki, menulis deskripsi, dan menghasilkan file **`DESIGN.md`** yang production-ready.
5. User bisa **menyalin (copy to clipboard)** dan **mengunduh (download `.md`)** hasilnya.
6. (Opsional/nilai plus) Sediakan **HTML preview interaktif** yang merender palette, specimen tipografi, dan komponen dengan token yang diekstrak — persis fitur preview designmd.me.

**Prinsip utama:** 100% gratis untuk dioperasikan (free tier semua layanan), tanpa storage berat, tanpa kartu kredit.

## 3. TECH STACK (FIXED — JANGAN DIGANTI)

| Layer | Pilihan | Catatan |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Deploy di Vercel |
| Styling | **Tailwind CSS v4** + `shadcn/ui` (komponen) | UI cepat & konsisten |
| Hosting/Deploy | **Vercel** via **GitHub** (auto deploy on push) | Free tier Hobby |
| AI | **OpenRouter** (1 model utama + 5 fallback, semua `:free`) | API key di env |
| Database/Cache | **Firebase Firestore** (Spark plan, free) | **TIDAK pakai Cloud Storage** |
| Parsing HTML/CSS | `cheerio` (HTML) + `css-tree` atau `postcss` (CSS) | Di server |
| Markdown rendering | `react-markdown` + `remark-gfm` | Preview `.md` |
| Fetching | Native `fetch` di Route Handler (server-side) | + timeout & size limit |

**Env vars yang dibutuhkan (`.env.local` + Vercel):**
```
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_APP_URL=https://...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
```

## 4. INTEGRASI AI — OPENROUTER (1 UTAMA + 5 FALLBACK, SEMUA GRATIS)

### 4.1 Daftar model (verifikasi status gratisnya sebelum deploy!)

> ⚠️ **PENTING:** Katalog model gratis OpenRouter BERUBAH sewaktu-waktu. Sebelum finalize, buka `https://openrouter.ai/models?max_price=0` dan pastikan tiap slug di bawah masih bertanda `(free)` dan `$0/M`. Ganti slug apa pun yang sudah tidak gratis dengan model `:free` lain yang setara. **Jangan pernah memakai model berbayar.**

| Peran | Model slug | Alasan | Context |
|---|---|---|---|
| **UTAMA** | `openai/gpt-oss-120b:free` | Model gratis terkuat & paling stabil (multi-provider, kecil risiko dicabut), bagus untuk analisis + penulisan terstruktur | 131K |
| Fallback 1 | `cohere/north-mini-code:free` | Tercepat (~69 tok/s), output hingga 64K token | 256K |
| Fallback 2 | `poolside/laguna-xs-2.1:free` | Coding-agent model, kuat untuk struktur/kode | 262K |
| Fallback 3 | `nvidia/nemotron-3-ultra-550b-a55b:free` | Context 1M — penyelamat kalau input HTML/CSS sangat besar | 1M |
| Fallback 4 | `meta-llama/llama-3.3-70b-instruct:free` | All-rounder stabil, didukung banyak provider | 131K |
| Fallback 5 | `google/gemma-4-31b-it:free` | Multimodal/umum, cadangan terakhir | 256K |

**Model yang HARUS DIHINDARI (per Juli 2026):** `tencent/hy3:free` (masa gratis berakhir 21 Juli 2026) dan `qwen/qwen3-coder:free` (status gratis tidak konsisten/sudah dicabut di beberapa periode).

### 4.2 Logika fallback (WAJIB diimplementasikan)

Buat modul `lib/ai/openrouter.ts` dengan perilaku:
- Simpan daftar model sebagai array berurut: `[UTAMA, F1, F2, F3, F4, F5]`.
- Coba model secara berurutan. Pindah ke model berikutnya jika terjadi: HTTP 429 (rate limit), 5xx, timeout (> 60 detik per percobaan), error "model not found"/"provider unavailable", atau respons kosong/gagal parse.
- **Retry dengan exponential backoff** (misal 1s, 2s, 4s) maksimal 2x per model sebelum lanjut ke model berikutnya.
- Gunakan **`response_format: { type: "json_object" }`** atau instruksi JSON-strict + validasi schema; jika JSON gagal divalidasi 2x, anggap gagal dan pindah model.
- Kirim header: `Authorization: Bearer ${OPENROUTER_API_KEY}`, `HTTP-Referer: ${NEXT_PUBLIC_APP_URL}`, `X-Title: "[NAMA_APP]"`.
- Base URL: `https://openrouter.ai/api/v1/chat/completions`.
- Log model mana yang berhasil (untuk analytics Firestore) tapi jangan pernah log isi konten lengkap (hemat kuota tulis Firestore).
- Jika **semua** model gagal, kembalikan error ramah: "Semua model AI sedang sibuk/limit. Coba lagi sebentar lagi." — jangan crash.

**Pseudocode yang diharapkan:**
```ts
const MODELS = [
  "openai/gpt-oss-120b:free",
  "cohere/north-mini-code:free",
  "poolside/laguna-xs-2.1:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-4-31b-it:free",
];

export async function generateDesignMD(extraction: ExtractedDesign): Promise<{ markdown: string; model: string }> {
  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await callOpenRouter(model, buildPrompt(extraction));
        const parsed = validateAndParse(res); // harus valid
        return { markdown: parsed, model };
      } catch (e) {
        lastError = e;
        if (isRetryable(e)) await sleep(1000 * 2 ** attempt);
        else break; // error non-retryable, langsung ganti model
      }
    }
  }
  throw new UserFacingError("Semua model AI sedang tidak tersedia. Coba lagi nanti.");
}
```

### 4.3 Hemat kuota (OpenRouter free ≈ 50 request/hari per key tanpa top-up)

- **Cache hasil per URL** di Firestore (key = hash URL + versi parser). Jika URL yang sama diminta lagi dalam 24 jam, kembalikan hasil cache tanpa memanggil AI.
- Batasi ekstraksi awal ke maksimal ~150 KB HTML dan ~300 KB CSS (trim sebelum dikirim ke AI) agar muat di context kecil.
- Pasang rate limit per IP (misal maks 5 generate/jam/IP) via Firestore counter atau Vercel KV-free approach (Firestore `Increment`).

## 5. ARSITEKTUR & ALUR (PIPELINE)

```
[User paste URL]
      │
      ▼
POST /api/analyze { url }
      │
      ├─ 1. Validasi URL (harus http/https, public, bukan localhost/IP privat)
      ├─ 2. Cek cache Firestore (hash URL) → kalau ada & < 24 jam, return cache
      ├─ 3. Server-side fetch HTML (timeout 10s, max 1MB, hormati robots.txt secara best-effort)
      ├─ 4. Parse HTML (cheerio): ambil <link rel=stylesheet>, <style>, inline style, struktur komponen
      ├─ 5. Fetch & parse CSS (css-tree/postcss): ekstrak warna, font, spacing, radius, shadow, breakpoints
      ├─ 6. Heuristic extractor → objek `ExtractedDesign` (JSON terstruktur)
      ├─ 7. Panggil OpenRouter (utama → fallback) dengan system+user prompt → `DESIGN.md`
      ├─ 8. Simpan hasil ke Firestore (cache + riwayat anonim)
      └─ 9. Return { markdown, tokens, model }
      ▼
[UI render preview .md + tombol Copy & Download]
```

## 6. STRUKTUR FOLDER

```
/
├─ app/
│  ├─ page.tsx                  # Landing + form URL + hasil
│  ├─ layout.tsx
│  ├─ globals.css
│  └─ api/
│     └─ analyze/route.ts       # POST pipeline utama
├─ components/
│  ├─ UrlForm.tsx               # input URL + tombol Generate
│  ├─ ResultPanel.tsx           # tab: Markdown | Preview | Raw
│  ├─ MarkdownPreview.tsx       # render .md
│  ├─ CopyButton.tsx
│  ├─ DownloadButton.tsx        # unduh DESIGN.md (Blob, client-side)
│  ├─ ExampleChips.tsx          # chip contoh: stripe.com, linear.app, dll
│  └─ LoadingState.tsx          # progress: fetching → parsing → AI
├─ lib/
│  ├─ ai/openrouter.ts          # fallback chain (bagian 4.2)
│  ├─ ai/prompts.ts             # system & user prompt
│  ├─ extract/html.ts           # cheerio extraction
│  ├─ extract/css.ts            # css-tree/postcss extraction
│  ├─ extract/types.ts          # tipe ExtractedDesign
│  ├─ firebase/firestore.ts     # init + cache helpers
│  └─ utils/ratelimit.ts
├─ .env.local.example
├─ next.config.ts
├─ tailwind.config.ts
└─ package.json
```

## 7. SPESIFIKASI UI/UX

- **Landing sederhana & fokus:** headline "Ubah website apa pun jadi DESIGN.md", subjudul, form input URL besar + tombol **Generate**, contoh chip yang bisa diklik.
- **State loading bertahap** (fetching HTML → parsing CSS → AI menyusun) agar user tahu proses berjalan (karena model gratis bisa lambat).
- **Panel hasil** dengan 3 tab: **Markdown** (rendered), **Raw** (teks mentah di `<pre>`), dan tombol selalu terlihat: **📋 Copy** dan **⬇ Download `DESIGN.md`**.
- Tombol Copy memakai Clipboard API dengan feedback "Tersalin!".
- Download membuat `Blob` berisi markdown, filename `DESIGN-[domain].md` — **tanpa** menyimpan file ke server (sesuai "no storage").
- Desain bersih, modern, dark-mode-friendly (terinspirasi designmd.me). Responsif mobile.
- Tampilkan kecil-kecil model AI yang dipakai (misal "Generated via gpt-oss-120b") untuk transparansi — opsional.
- Error state yang jelas & manusiawi (situs tidak bisa diakses, rate limit, semua model sibuk).

## 8. SPESIFIKASI API

`POST /api/analyze`
- Body: `{ "url": string }`
- Validasi: URL valid, protokol http/https, hostname publik. Tolak IP privat/localhost.
- Timeout keseluruhan ~50 detik (limit Vercel hobby = 60s).
- Response sukses: `{ ok: true, markdown: string, domain: string, model: string, cached: boolean }`
- Response error: `{ ok: false, error: string }` dengan HTTP code yang sesuai (400 validasi, 429 rate limit, 502 upstream, 500 lain-lain).

## 9. PROMPT UNTUK AI (di `lib/ai/prompts.ts`)

**System prompt (intinya):**
```
Kamu adalah design systems engineer ahli. Kamu menerima hasil ekstraksi JSON
(warna, tipografi, spacing, radius, shadow, breakpoints, pola komponen) dari
sebuah website. Tugasmu: menghasilkan SATU dokumen Markdown bernama DESIGN.md
yang rapi, production-ready, dan siap dipakai untuk design handoff atau konteks
AI agent. Beri nama token yang semantik (misal --color-brand-500), kelompokkan
logis, sertakan nilai asli (hex/px/rem), dan tulis deskripsi singkat per bagian.
Jangan mengarang token yang tidak ada di data. Jika data kurang, tandai "Not detected".
HANYA output Markdown, tanpa pembuka/penutup, tanpa code fence pembungkus.
```

**Struktur `DESIGN.md` yang diharapkan (template):**
```
# DESIGN.md — {domain}
_Generated {date} · {NAMA_APP}_

## 1. Overview            (kesan umum, gaya visual, tone)
## 2. Color Tokens        (tabel: nama token, hex, peran; primary/secondary/neutral/semantic)
## 3. Typography          (font families, scale h1–body–caption, weight, line-height)
## 4. Spacing & Layout    (skala spacing, max-width, grid, breakpoints)
## 5. Radius & Elevation  (border-radius, shadow tokens)
## 6. Components          (pola: button, card, navbar, input, badge — ciri khasnya)
## 7. CSS Variables        (blok kode :root { --...: ...; } siap salin)
## 8. Usage Notes          (rekomendasi & catatan)
```

**User prompt:** kirim `ExtractedDesign` sebagai JSON + instruksi template di atas. Minta output Markdown murni.

## 10. FIRESTORE (SPARK PLAN — NO CLOUD STORAGE)

- **Hanya Firestore**, jangan pakai Firebase Storage sama sekali.
- Collections:
  - `cache/{urlHash}` → `{ markdown, domain, model, createdAt }` (TTL 24 jam via Firestore TTL policy atau cek manual).
  - `runs/{id}` → metadata anonim `{ domain, model, ok, ms, createdAt }` untuk analitik ringan (hemat writes: jangan tulis tiap hit jika cache hit).
- Patuhi kuota Spark: ~50k reads & 20k writes/hari, 1 GB storage. Jangan simpan HTML/CSS mentah (besar) — simpan hanya hasil markdown.
- Gunakan `firebase-admin` di server (Route Handler).

## 11. EDGE CASES & ERROR HANDLING

- Situs memblokir fetch (403/Cloudflare) → pesan jelas "Situs ini memblokir akses otomatis."
- Situs SPA tanpa CSS inline (butuh JS render) → tetap ekstrak semampu dari HTML + stylesheet statis; beri catatan di `DESIGN.md` bila token terbatas.
- CSS sangat besar → trim/prioritaskan selector yang relevan.
- Non-ASCII / charset aneh → set `fetch` dengan header `Accept` & decode UTF-8 best-effort.
- Semua model AI limit → error ramah (bagian 4.2).
- robots.txt: hormati `Disallow` secara best-effort sebelum fetch.

## 12. KEAMANAN & ANTI-ABUSE

- Jangan pernah mengekspos `OPENROUTER_API_KEY` ke client — semua panggilan AI di server.
- Rate limit per IP (bagian 4.3).
- Validasi & sanitasi URL; jangan follow redirect ke IP privat (SSRF protection).
- Batasi ukuran response yang diproses.

## 13. DEPLOY CHECKLIST (Vercel + GitHub + Firebase)

1. `git init` → push ke GitHub repo baru.
2. Import repo di Vercel (Hobby, free) → set env vars.
3. Setup Firebase project (Spark) → buat Firestore → generate service account → isi env.
4. Pastikan `firestore.rules` mengunci akses (hanya server via Admin SDK; rules default deny untuk client).
5. Set region Vercel dekat user (misal `sin1` Singapura) untuk latensi rendah ke OpenRouter & Firebase.
6. Uji alur end-to-end: paste `stripe.com` → dapat `DESIGN.md` → copy & download berfungsi.

## 14. DEFINITION OF DONE (kriteria selesai)

- [ ] Paste URL → menghasilkan `DESIGN.md` lengkap sesuai template (bagian 9).
- [ ] Tombol **Copy** dan **Download `.md`** berfungsi (download tanpa storage server).
- [ ] Fallback chain 6 model bekerja: matikan/simulasikan model utama gagal → otomatis pindah ke fallback tanpa user tahu.
- [ ] Semua model bertanda `:free` (diverifikasi di openrouter.ai).
- [ ] Cache Firestore bekerja (URL sama < 24 jam = tanpa panggilan AI).
- [ ] Rate limit per IP aktif.
- [ ] Tidak memakai Cloud Storage; hanya Firestore.
- [ ] Deploy sukses di Vercel via GitHub; env vars terpasang.
- [ ] UI loading bertahap + error state manusiawi + responsif mobile.

## 15. CATATAN PENTING UNTUK ENGINEER (AI)

- Prioritaskan **kesederhanaan & biaya nol**. Jangan over-engineer.
- Karena model gratis OpenRouter lambat & ber-limit, **cache dan fallback adalah fitur inti, bukan afterthought**.
- Kerjakan bertahap: (1) scaffold Next+Tailwind+shadcn, (2) pipeline ekstraksi HTML/CSS, (3) integrasi OpenRouter + fallback, (4) Firestore cache, (5) UI hasil + copy/download, (6) deploy. Tunjukkan hasil tiap tahap.
- Tulis kode TypeScript yang bersih, tipe lengkap, dan komentar singkat di bagian rumit.

**Mulai sekarang dari tahap 1.**
