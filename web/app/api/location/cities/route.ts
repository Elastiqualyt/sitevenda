import { NextRequest, NextResponse } from 'next/server';

type NominatimRow = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    const country = (searchParams.get('country')?.trim() ?? '').toLowerCase();
    const limitRaw = parseInt(searchParams.get('limit') ?? '12', 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(20, Math.max(1, limitRaw)) : 12;

    if (q.length < 2 || country.length !== 2) {
      return NextResponse.json([]);
    }

    const upstream = new URL('https://nominatim.openstreetmap.org/search');
    upstream.searchParams.set('q', q);
    upstream.searchParams.set('countrycodes', country);
    upstream.searchParams.set('format', 'jsonv2');
    upstream.searchParams.set('addressdetails', '1');
    upstream.searchParams.set('limit', String(limit));
    upstream.searchParams.set('dedupe', '1');
    upstream.searchParams.set('featuretype', 'city');

    const res = await fetch(upstream.toString(), {
      headers: {
        'User-Agent': 'Terraplace/1.0 (city autocomplete)',
        Accept: 'application/json',
      },
      // Keeps external API usage controlled for repeated queries.
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json([]);
    }

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) {
      return NextResponse.json([]);
    }

    const seen = new Set<string>();
    const cities: string[] = [];

    for (const row of data as NominatimRow[]) {
      const raw =
        row.address?.city ||
        row.address?.town ||
        row.address?.village ||
        row.address?.municipality ||
        row.address?.county ||
        '';
      const city = raw.trim();
      if (!city) continue;
      const key = city.toLocaleLowerCase('pt-PT');
      if (seen.has(key)) continue;
      seen.add(key);
      cities.push(city);
      if (cities.length >= limit) break;
    }

    return NextResponse.json(cities);
  } catch {
    return NextResponse.json([]);
  }
}
