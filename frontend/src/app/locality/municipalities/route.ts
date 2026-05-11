import { NextRequest, NextResponse } from 'next/server';

const UPSTREAM = 'https://tn-municipality-api.vercel.app/api/municipalities';

/**
 * Same-origin proxy for Tunisian municipality data (avoids browser CORS on the upstream API).
 * Lives outside `/api/*` so `next.config` rewrites to the wear backend do not intercept it.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name');
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'Missing required query: name' }, { status: 400 });
  }

  const qs = request.nextUrl.searchParams.toString();
  const upstreamUrl = `${UPSTREAM}?${qs}`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
  }
}
