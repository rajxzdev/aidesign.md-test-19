import { NextRequest, NextResponse } from 'next/server';
import { validateUrl, fetchHtml, extractCssUrls, extractInlineCss, extractMeta, extractComponents } from '@/lib/extract/html';
import { fetchCss, extractDesignFromCss } from '@/lib/extract/css';
import { ExtractedDesign } from '@/lib/extract/types';
import { generateDesignMD, UserFacingError } from '@/lib/ai/openrouter';
import { getCache, setCache, logAnalysis, isServerReady, verifyToken, checkUserRateLimit, touchUser } from '@/lib/firebase/server';
import { checkRateLimitFallback } from '@/lib/utils/ratelimit';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const fb = isServerReady();

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  let user: { uid: string; email: string; role: string } | null = null;

  try {
    const ah = request.headers.get('authorization');
    if (!ah?.startsWith('Bearer ')) return NextResponse.json({ ok: false, error: 'Login required.' }, { status: 401 });
    const token = ah.slice(7);
    if (fb) { try { user = await verifyToken(token); } catch { return NextResponse.json({ ok: false, error: 'Session expired.' }, { status: 401 }); } }
    else user = { uid: 'dev-user', email: 'dev@local.host', role: 'admin' };

    let body: any; try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 }); }
    if (!body?.url) return NextResponse.json({ ok: false, error: 'URL required' }, { status: 400 });
    const uv = validateUrl(body.url);
    if (!uv.valid) return NextResponse.json({ ok: false, error: uv.error! }, { status: 400 });
    const url = body.url.startsWith('http') ? body.url : 'https://' + body.url;
    const domain = uv.hostname!;

    const rl = fb ? await checkUserRateLimit(user.uid, user.role) : checkRateLimitFallback(user.uid);
    if (!rl.allowed) return NextResponse.json({ ok: false, error: rl.reason || 'Cooldown.' }, { status: 429 });

    if (fb) {
      const cached = await getCache(url);
      if (cached) return NextResponse.json({ ok: true, markdown: cached.markdown, domain: cached.domain, model: cached.model, cached: true });
    }

    // Fetch
    let html: string, finalUrl: string;
    try { const r = await fetchHtml(url); html = r.html; finalUrl = r.finalUrl; }
    catch (e: any) { return NextResponse.json({ ok: false, error: e.message || 'Fetch failed' }, { status: 502 }); }

    // CSS (parallel)
    const meta = extractMeta(html);
    const urls = extractCssUrls(html).slice(0, 3);
    let allCss = extractInlineCss(html).join('\n');
    if (urls.length) { const results = await Promise.allSettled(urls.map(u => fetchCss(u, finalUrl))); results.forEach(r => { if (r.status === 'fulfilled' && r.value) allCss += '\n' + r.value; }); }
    if (allCss.length > 300_000) allCss = allCss.slice(0, 300_000);

    const css = extractDesignFromCss(allCss);
    const comps = extractComponents(html);
    const extraction: ExtractedDesign = {
      url: finalUrl, domain, colors: css.colors, typography: css.typography,
      spacing: css.spacing, borderRadius: css.borderRadius, shadows: css.shadows,
      breakpoints: css.breakpoints, components: comps, cssVariables: css.cssVariables,
      meta: { title: meta.title, description: meta.description, cssSizeKB: Math.round(allCss.length / 1024), htmlSizeKB: Math.round(html.length / 1024) },
    };

    // AI (streaming — never timeouts)
    let markdown: string, model: string;
    try { const r = await generateDesignMD(extraction); markdown = r.markdown; model = r.model; }
    catch (e: any) { return NextResponse.json({ ok: false, error: e instanceof UserFacingError ? e.message : 'AI failed. Try again.' }, { status: 503 }); }

    const ms = Date.now() - t0;
    if (fb) { await Promise.allSettled([setCache(url, { markdown, domain, model, createdAt: Date.now() }), touchUser(user.uid), logAnalysis({ uid: user.uid, email: user.email, url, domain, model, ok: true, ms, cached: false })]); }

    return NextResponse.json({ ok: true, markdown, domain, model, cached: false });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Server error' }, { status: 500 });
  }
}
