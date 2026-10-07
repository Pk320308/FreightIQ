import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ports as mockPorts } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(req);
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json(mockPorts);
    }

    const formatted = data.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      congestion: p.congestion,
      maxDraft: parseFloat(p.max_draft),
      maxLOA: parseFloat(p.max_loa),
      maxBeam: parseFloat(p.max_beam),
      handlingCapacity: parseFloat(p.handling_capacity),
      avgWaitTime: parseFloat(p.avg_wait_time),
      vesselCompatibility: p.vessel_compatibility,
      coordinates: [p.coordinates?.lat ?? 17.68, p.coordinates?.lng ?? 83.21],
      location: p.location,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(mockPorts);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServerClient(req);
    const { data, error } = await supabase
      .from('ports')
      .select('*')
      .eq('id', body.id)
      .maybeSingle();

    if (error || !data) {
      const fallback = mockPorts.find((p) => p.id === body.id) || mockPorts[0];
      return NextResponse.json(fallback);
    }

    const formatted = {
      id: data.id,
      name: data.name,
      status: data.status,
      congestion: data.congestion,
      maxDraft: parseFloat(data.max_draft),
      maxLOA: parseFloat(data.max_loa),
      maxBeam: parseFloat(data.max_beam),
      handlingCapacity: parseFloat(data.handling_capacity),
      avgWaitTime: parseFloat(data.avg_wait_time),
      vesselCompatibility: data.vessel_compatibility,
      coordinates: [data.coordinates?.lat ?? 17.68, data.coordinates?.lng ?? 83.21],
      location: data.location,
    };

    return NextResponse.json(formatted);
  } catch {
    const fallback = mockPorts.find((p) => p.id === req.nextUrl?.searchParams?.get('id')) || mockPorts[0];
    return NextResponse.json(fallback);
  }
}
