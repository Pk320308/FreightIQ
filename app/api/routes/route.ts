import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient(req);
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = data.map((r) => ({
    id: r.id,
    origin: r.origin,
    originPort: r.origin_port,
    destination: r.destination,
    destinationPort: r.destination_port,
    currentRate: parseFloat(r.current_rate),
    forecastRate: parseFloat(r.forecast_rate),
    trend: r.trend,
    risk: r.risk,
    distance: r.distance,
    duration: r.duration,
    congestion: r.congestion,
    coordinates: {
      origin: [r.origin_coords.lat, r.origin_coords.lng],
      destination: [r.destination_coords.lat, r.destination_coords.lng],
    },
  }));

  return NextResponse.json(formatted);
}
