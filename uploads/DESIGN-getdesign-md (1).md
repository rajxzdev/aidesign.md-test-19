# DESIGN.md — getdesign.md
_Generated 2026-07-21 · DesignExtract_

## 1. Overview
The site uses a dark‑mode foundation with heavy reliance on translucent black overlays (`#0000001a`) for depth and layering. Accent colors are vibrant pinks (`#ffb1ee`) and greens (`#3dd68c`), while neutrals span a full grayscale scale. Typography leans on the Geist family system with a flexible type scale built from rem‑based values. Spacing and breakpoints follow a typical 4‑step scale, and component patterns reveal a utility‑first approach with many reusable button/link variants.

## 2. Color Palette
| Token Name | Hex Value | Role |
|------------|-----------|------|
| `--color-primary` | `#0000001a` | Primary (most frequent overlay) |
| `--color-secondary` | `#ffffff` | Secondary (base white) |
| `--color-secondary-2` | `#ededed` | Secondary (light gray) |
| `--color-secondary-3` | `#c9d1d9` | Secondary (blue‑gray) |
| `--color-gray-100` | `#1a1a1a` | Neutral (dark) |
| `--color-gray-200` | `#1f1f1f` | Neutral |
| `--color-gray-300` | `#292929` | Neutral |
| `--color-gray-400` | `#2e2e2e` | Neutral |
| `--color-gray-500` | `#454545` | Neutral |
| `--color-gray-600` | `#666666` | Neutral |
| `--color-gray-700` | `#878787` | Neutral |
| `--color-gray-800` | `#8f8f8f` | Neutral |
| `--color-gray-900` | `#a0a0a0` | Neutral |
| `--color-gray-950` | `oklch(13% .028 261.692)` | Neutral (very dark) |
| `--color-success` | `#3dd68c` | Semantic (success) |
| `--color-warning` | `#e3971c` | Semantic (warning) |
| `--color-error` | `#f87171` | Semantic (error) |
| `--color-info` | `#ffb1ee` | Semantic (info/accent) |
| `--color-accent` | `#ffb1ee` | Accent (matches info) |
| `--color-background` | `#000000` | Background (black) |
| `--color-foreground` | `#ededed` | Foreground (light) |
| `--color-muted` | `#1a1a1a` | Muted text |
| `--color-muted-foreground` | `#878787` | Muted foreground |
| `--color-border` | `#242424` | Border |
| `--color-card` | `#111111` | Card background |
| `--color-card-foreground` | `#ededed` | Card text |
| `--color-fx-canvas` | `#0f1013` | Special canvas |
| `--color-l1` | `#3dd68c` | Accent highlight |
| `--color-l3` | `#f87171` | Accent highlight |

## 3. Typography
**Font families detected**  
- `var(--font-sans)` → `"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`  
- `var(--default-font-family)` → `var(--font-sans)` (fallback)  
- `ui-sans-serif`  
- `system-ui`  
- `Apple Color Emoji`  
- `Segoe UI Emoji`  
- `Segoe UI Symbol`  
- `Noto Color Emoji`  
- `var(--default-mono-font-family)` → `var(--font-mono)`  
- `ui-monospace`  
- `SFMono-Regular`  
- `Menlo`  
- `Monaco`  
- `Consolas`  
- `Liberation Mono`  
- `Courier New`  
- `monospace`  
- `var(--font-display)` → `"GeistPixel-Line", monospace`  
- `var(--font-mono)` → `"Geist Mono", "SFMono-Regular", Menlo, monospace`  
- `Geist`  
- `Geist Mono`  
- `GeistPixel-Line`  
- `GeistPixel-Circle`  
- `GeistPixel-Square`

**Type scale** (sorted by pixel value, with suggested semantic names)

| Suggested Name | Value (px) | Original Value |
|----------------|------------|----------------|
| `--font-size-h1` | 80 | `80%` |
| `--font-size-h2` | 75 | `75%` |
| `--font-size-h3` | 48 | `48px` |
| `--font-size-h4` | 40 | `2.5rem` |
| `--font-size-h5` | 36 | `36px` |
| `--font-size-h6` | 32 | `2rem` / `32px` |
| `--font-size-lg` | 30 | `30px` |
| `--font-size-md` | 29 | `29px` |
| `--font-size-sm` | 28 | `28px` |
| `--font-size-xs` | 26 | `26px` |
| `--font-size-xxs` | 24 | `1.5rem` |

**Font weights available**  
`100, 400, 500, 600, 700`

**Line heights detected**  
`1.5, 0, 1, 1.4, 1.3, 1.2, 1.15, 1.1, 1.6, var(--tw-leading,var(--text-2xl--line-height))`

## 4. Spacing & Layout
**Spacing scale** (deduplicated, sorted)

| Token Name | Value |
|------------|-------|
| `--spacing-1` | `.25rem` (4px) |
| `--spacing-2` | `.5rem` (8px) |
| `--spacing-3` | `.75rem` (12px) |
| `--spacing-4` | `1rem` (16px) |
| `--spacing-6` | `1.5rem` (24px) |
| `--spacing-8` | `2rem` (32px) |
| `--spacing-10` | `2.5rem` (40px) |
| `--spacing-12` | `3rem` (48px) |
| `--spacing-16` | `4rem` (64px) |
| `--spacing` (base) | `.25rem` |

*Detected raw spacing values*: `1px`, `3px`, `7px`, `16px`, `84px` (used for gaps,