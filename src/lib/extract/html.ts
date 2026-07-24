import * as cheerio from 'cheerio';
import { ComponentPattern, ExtractedFontFamily } from './types';

const MAX_HTML_SIZE = 2_000_000; // 2 MB
const FETCH_TIMEOUT = 10_000; // 10 seconds

/** Check if hostname is a private/reserved IP */
function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  const privatePatterns = [
    'localhost',
    '127.0.0.1',
    '::1',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
  ];
  // Also check for IP addresses that might be private
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [_, a, b, c, d] = ipv4Match.map(Number);
    if (a === 127 || a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0 || a === 169 && b === 254) return true;
  }
  return privatePatterns.some((p) => lower.startsWith(p));
}

/** Validate and sanitize URL */
export function validateUrl(url: string): { valid: boolean; error?: string; hostname?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let parsed: URL;
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'Only http and https URLs are supported' };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, error: 'Cannot access private or local network addresses' };
  }

  return { valid: true, hostname: parsed.hostname };
}

/** Fetch HTML content from a URL */
export async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; aidesign.md/1.0; +https://aidesign.md)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('This site blocks automated access (HTTP ' + response.status + ').');
      }
      if (response.status === 404) {
        throw new Error('Page not found (404).');
      }
      if (response.status >= 500) {
        throw new Error('Server error (' + response.status + ') on the target website.');
      }
      throw new Error(`Failed to fetch: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error('URL does not point to an HTML page (Content-Type: ' + contentType + ')');
    }

    const text = await response.text();
    if (text.length > MAX_HTML_SIZE) {
      throw new Error('Website HTML is too large. Please try a simpler site.');
    }

    return { html: text, finalUrl: response.url };
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract CSS URLs from HTML */
export function extractCssUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const urls: string[] = [];

  // External stylesheets
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) urls.push(href);
  });

  // Preload stylesheets
  $('link[rel="preload"][as="style"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) urls.push(href);
  });

  return urls;
}

/** Extract inline styles from HTML */
export function extractInlineCss(html: string): string[] {
  const $ = cheerio.load(html);
  const styles: string[] = [];

  $('style').each((_, el) => {
    const css = $(el).html();
    if (css) styles.push(css);
  });

  return styles;
}

/** Extract page metadata */
export function extractMeta(html: string): { title: string; description?: string } {
  const $ = cheerio.load(html);
  const title =
    $('title').text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    'Untitled';

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    undefined;

  return { title: title.trim(), description };
}

/** Detect component patterns from HTML */
export function extractComponents(html: string): ComponentPattern[] {
  const $ = cheerio.load(html);
  const patterns: ComponentPattern[] = [];
  const map = new Map<string, { tag: string; classes: string[]; styles: Record<string, string>; count: number }>();

  // Common component selectors
  const componentSelectors = [
    'button', 'a[class]', 'nav', 'header', 'footer',
    '[class*="btn"]', '[class*="button"]', '[class*="card"]',
    '[class*="nav"]', '[class*="navbar"]', '[class*="menu"]',
    '[class*="form"]', '[class*="input"]', '[class*="search"]',
    '[class*="modal"]', '[class*="dialog"]', '[class*="badge"]',
    '[class*="chip"]', '[class*="tag"]', '[class*="alert"]',
    '[class*="banner"]', '[class*="hero"]', '[class*="section"]',
    '[class*="container"]', '[class*="wrapper"]',
    '[class*="avatar"]', '[class*="profile"]',
    '[class*="icon"]', '[class*="logo"]',
    '[class*="list"]', '[class*="item"]',
    '[class*="tab"]', '[class*="tabs"]',
    '[class*="table"]',
  ];

  componentSelectors.forEach((selector) => {
    $(selector).each((_, el) => {
      const tag = 'tagName' in el ? (el as any).tagName.toLowerCase() : 'div';
      const classes = $(el).attr('class')?.split(/\s+/).filter(Boolean) || [];
      if (classes.length === 0) return;

      const key = tag + '.' + classes.sort().join('.');
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        const styles: Record<string, string> = {};
        const styleAttr = $(el).attr('style');
        if (styleAttr) {
          styleAttr.split(';').forEach((decl) => {
            const [prop, val] = decl.split(':').map((s) => s.trim());
            if (prop && val) styles[prop] = val;
          });
        }
        map.set(key, { tag, classes, styles, count: 1 });
      }
    });
  });

  // Name the patterns
  const componentNames = new Map([
    ['button', 'Button'], ['a', 'Link/Button'],
    ['nav', 'Navigation'], ['header', 'Header'], ['footer', 'Footer'],
  ]);

  map.forEach((value, key) => {
    // Derive name from classes
    let name = componentNames.get(value.tag) || 'Component';
    const classMatch = value.classes.find((c) =>
      /btn|button|card|nav|navbar|menu|form|input|modal|badge|chip|tag|alert|hero|avatar|tab/i.test(c)
    );
    if (classMatch) {
      const match = classMatch.match(/(btn|button|card|nav|navbar|menu|form|input|modal|badge|chip|tag|alert|hero|avatar|tab)/i);
      if (match) name = match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase();
    }

    patterns.push({
      name,
      tag: value.tag,
      classes: value.classes,
      styles: value.styles,
      count: value.count,
    });
  });

  return patterns.sort((a, b) => b.count - a.count).slice(0, 30);
}
