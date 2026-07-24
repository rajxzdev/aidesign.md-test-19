import { ExtractedDesign } from '@/lib/extract/types';

export const SYSTEM_PROMPT = `You are a design systems engineer expert. You receive a JSON extraction of design tokens (colors, typography, spacing, border-radius, shadows, breakpoints, and component patterns) from a website.

Your task: generate ONE clean, production-ready Markdown document named "DESIGN.md" suitable for design handoff or AI agent context.

Rules:
- Give semantic token names (e.g. --color-brand-500, --font-size-lg)
- Group tokens logically
- Include original values (hex/px/rem)
- Write short descriptions per section
- ONLY include tokens that are present in the data. Mark missing data as "Not detected"
- Output ONLY the Markdown content — no opening/closing statements, no code fences wrapping the output
- Follow the exact structure specified in the user prompt`;

export function buildUserPrompt(extraction: ExtractedDesign): string {
  const json = JSON.stringify(extraction, null, 2);

  return `Here is the extracted design data from ${extraction.url}:

\`\`\`json
${json}
\`\`\`

Generate a DESIGN.md document with this exact structure:

# DESIGN.md — ${extraction.domain}
_Generated ${new Date().toISOString().split('T')[0]} · aidesign.md_

## 1. Overview
Brief impression of the visual style, design tone, and general aesthetic based on the extracted tokens.

## 2. Color Palette
Table with: Token Name | Hex Value | Role
Include categories: Primary, Secondary, Neutral, Semantic (success, warning, error, info)
Mark roles based on usage frequency (most used = primary).

## 3. Typography
- Font families detected (with fallback stacks)
- Type scale (sorted by size, with suggested semantic names like h1, h2, body, caption)
- Font weights available
- Line heights

## 4. Spacing & Layout
- Spacing scale (deduplicated, sorted)
- Grid/container patterns if detected
- Breakpoints/Media queries

## 5. Border Radius & Elevation
- Border-radius tokens
- Box-shadow values (with suggested token names)

## 6. Component Patterns
For each detected component type: description, typical styling, class patterns.

## 7. CSS Custom Properties
\`\`\`css
:root {
  --detected-variable: value;
}
\`\`\`

## 8. Usage Notes
- Implementation recommendations
- What's well-defined vs. what needs clarification
- Any detected limitations (e.g., SPA with JS-rendered CSS)

Only output the Markdown. No extra text.`;
}
