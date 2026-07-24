import * as cssTree from 'css-tree';
import { ExtractedColor, ExtractedFontFamily, SpacingValue, TypographyScale } from './types';

const MAX_CSS_SIZE = 300_000; // 300 KB
const CSS_FETCH_TIMEOUT = 5000; // 5 seconds per file

/** Fetch a CSS file, resolving relative URLs against a base */
export async function fetchCss(url: string, baseUrl: string): Promise<string> {
  try {
    const fullUrl = url.startsWith('http') ? url : new URL(url, baseUrl).href;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CSS_FETCH_TIMEOUT);

    const res = await fetch(fullUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; aidesign.md/1.0)',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return '';
    const text = await res.text();
    return text.length > MAX_CSS_SIZE ? text.slice(0, MAX_CSS_SIZE) : text;
  } catch {
    return '';
  }
}

/** Resolve a CSS value to a hex color */
function resolveColorValue(value: string): string | null {
  const trimmed = value.trim().toLowerCase();

  // Already hex
  if (/^#[0-9a-f]{3,8}$/.test(trimmed)) {
    return trimmed;
  }

  // rgb/rgba
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/);
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch;
    return `#${[r, g, b].map((v) => parseInt(v).toString(16).padStart(2, '0')).join('')}`;
  }

  // Named colors (simple mapping)
  const named: Record<string, string> = {
    black: '#000000', white: '#ffffff', red: '#ff0000', blue: '#0000ff',
    green: '#008000', yellow: '#ffff00', gray: '#808080', grey: '#808080',
    transparent: 'transparent', inherit: 'inherit', currentcolor: 'currentColor',
  };
  if (named[trimmed]) return named[trimmed];

  return null;
}

/** Extract colors from a CSS AST */
function extractColors(ast: cssTree.CssNode): ExtractedColor[] {
  const colorMap = new Map<string, number>();

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration') {
      const value = cssTree.generate(node.value);
      const hexMatch = value.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g);
      if (hexMatch) {
        hexMatch.forEach((h) => {
          const normalized = h.toLowerCase();
          // Normalize 3-digit hex
          const fullHex =
            normalized.length === 4
              ? '#' + normalized[1] + normalized[1] + normalized[2] + normalized[2] + normalized[3] + normalized[3]
              : normalized;
          colorMap.set(fullHex, (colorMap.get(fullHex) || 0) + 1);
        });
      }

      // Extract rgb/rgba
      const rgbMatch = value.match(/rgba?\s*\([^)]+\)/gi);
      if (rgbMatch) {
        rgbMatch.forEach((rgb) => {
          const hex = resolveColorValue(rgb);
          if (hex && hex !== 'transparent') {
            colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
          }
        });
      }
    }
  });

  return Array.from(colorMap.entries())
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);
}

/** Extract font families */
function extractFontFamilies(ast: cssTree.CssNode): ExtractedFontFamily[] {
  const fontMap = new Map<string, number>();

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && node.property === 'font-family') {
      const value = cssTree.generate(node.value);
      const families = value.split(',').map((f) => f.replace(/['"]/g, '').trim());
      families.forEach((f) => {
        if (f && f !== 'serif' && f !== 'sans-serif' && f !== 'monospace' && f !== 'cursive' && f !== 'fantasy') {
          fontMap.set(f, (fontMap.get(f) || 0) + 1);
        }
      });
    }
  });

  return Array.from(fontMap.entries())
    .map(([name, count]) => ({
      name,
      stack: name,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

/** Extract font sizes */
function extractFontSizes(ast: cssTree.CssNode): TypographyScale['sizes'] {
  const sizes: TypographyScale['sizes'] = [];

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && node.property === 'font-size') {
      const value = cssTree.generate(node.value);
      const px = parsePxValue(value);
      if (px > 0) {
        sizes.push({ value, px });
      }
    }
  });

  return sizes.sort((a, b) => b.px - a.px).slice(0, 15);
}

/** Extract font weights */
function extractFontWeights(ast: cssTree.CssNode): number[] {
  const weights = new Set<number>();

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && node.property === 'font-weight') {
      const value = cssTree.generate(node.value).trim();
      const num = parseInt(value);
      if (!isNaN(num) && num > 0 && num < 1000) {
        weights.add(num);
      } else {
        // Named weights
        const named: Record<string, number> = {
          thin: 100, extralight: 200, light: 300, normal: 400,
          medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900,
        };
        const w = named[value.toLowerCase()];
        if (w) weights.add(w);
      }
    }
  });

  return Array.from(weights).sort((a, b) => a - b);
}

/** Extract line heights */
function extractLineHeights(ast: cssTree.CssNode): string[] {
  const heights = new Set<string>();

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && node.property === 'line-height') {
      heights.add(cssTree.generate(node.value).trim());
    }
  });

  return Array.from(heights).slice(0, 10);
}

/** Extract spacing values (margin, padding, gap) */
function extractSpacing(ast: cssTree.CssNode): SpacingValue[] {
  const spacingMap = new Map<string, { value: string; px: number; context: string }>();

  const spacingProps = ['margin', 'padding', 'gap', 'margin-top', 'margin-bottom',
    'margin-left', 'margin-right', 'padding-top', 'padding-bottom',
    'padding-left', 'padding-right', 'column-gap', 'row-gap'];

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && spacingProps.includes(node.property)) {
      const value = cssTree.generate(node.value);
      const px = parsePxValue(value);
      if (px > 0 && px < 200) {
        // Only track reasonable spacing values
        const key = `${px}px`;
        if (!spacingMap.has(key)) {
          spacingMap.set(key, { value, px, context: node.property });
        }
      }
    }
  });

  return Array.from(spacingMap.values())
    .sort((a, b) => a.px - b.px)
    .slice(0, 20);
}

/** Extract border-radius */
function extractBorderRadius(ast: cssTree.CssNode): SpacingValue[] {
  const radiusSet = new Map<string, SpacingValue>();

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && node.property === 'border-radius') {
      const value = cssTree.generate(node.value);
      const px = parsePxValue(value);
      if (px > 0) {
        const key = `${px}px`;
        if (!radiusSet.has(key)) {
          radiusSet.set(key, { value, px });
        }
      }
    }
  });

  return Array.from(radiusSet.values()).sort((a, b) => a.px - b.px);
}

/** Extract box-shadow values */
function extractShadows(ast: cssTree.CssNode): string[] {
  const shadows = new Set<string>();

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && node.property === 'box-shadow') {
      shadows.add(cssTree.generate(node.value).trim());
    }
  });

  return Array.from(shadows).slice(0, 10);
}

/** Extract media query breakpoints */
function extractBreakpoints(ast: cssTree.CssNode): string[] {
  const bps = new Set<string>();

  cssTree.walk(ast, (node) => {
    if (node.type === 'Atrule' && node.name === 'media' && node.prelude) {
      const prelude = cssTree.generate(node.prelude);
      const widthMatch = prelude.match(/(\d+\.?\d*)(px|em|rem)/i);
      if (widthMatch) {
        bps.add(widthMatch[0]);
      }
    }
  });

  return Array.from(bps).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return numA - numB;
  });
}

/** Extract CSS custom properties */
function extractCssVariables(ast: cssTree.CssNode): Record<string, string> {
  const vars: Record<string, string> = {};

  cssTree.walk(ast, (node) => {
    if (node.type === 'Declaration' && node.property.startsWith('--')) {
      vars[node.property] = cssTree.generate(node.value).trim();
    }
  });

  return vars;
}

/** Try to parse a CSS value to px */
function parsePxValue(value: string): number {
  value = value.trim();

  const pxMatch = value.match(/^([\d.]+)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);

  const remMatch = value.match(/^([\d.]+)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;

  const emMatch = value.match(/^([\d.]+)em$/);
  if (emMatch) return parseFloat(emMatch[1]) * 16;

  const vhMatch = value.match(/^([\d.]+)vh$/);
  if (vhMatch) return parseFloat(vhMatch[1]) * 4; // rough estimate

  const num = parseFloat(value);
  if (!isNaN(num) && num > 0 && num < 1000) return num;

  return 0;
}

/** Main CSS extraction function */
export function extractDesignFromCss(css: string): {
  colors: ExtractedColor[];
  typography: TypographyScale;
  spacing: SpacingValue[];
  borderRadius: SpacingValue[];
  shadows: string[];
  breakpoints: string[];
  cssVariables: Record<string, string>;
  error?: string;
} {
  try {
    const ast = cssTree.parse(css, {
      positions: false,
      parseAtrulePrelude: false,
      parseRulePrelude: false,
      parseValue: true,
    });

    const colors = extractColors(ast);
    const fontFamilies = extractFontFamilies(ast);
    const sizes = extractFontSizes(ast);
    const weights = extractFontWeights(ast);
    const lineHeights = extractLineHeights(ast);
    const spacing = extractSpacing(ast);
    const borderRadius = extractBorderRadius(ast);
    const shadows = extractShadows(ast);
    const breakpoints = extractBreakpoints(ast);
    const cssVariables = extractCssVariables(ast);

    return {
      colors,
      typography: {
        fontFamilies,
        sizes,
        weights,
        lineHeights,
      },
      spacing,
      borderRadius,
      shadows,
      breakpoints,
      cssVariables,
    };
  } catch (e) {
    return {
      colors: [],
      typography: { fontFamilies: [], sizes: [], weights: [], lineHeights: [] },
      spacing: [],
      borderRadius: [],
      shadows: [],
      breakpoints: [],
      cssVariables: {},
      error: 'Failed to parse CSS: ' + (e instanceof Error ? e.message : 'Unknown error'),
    };
  }
}
