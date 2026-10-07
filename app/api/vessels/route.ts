import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { vessels as mockVessels } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(req);
    const { data, error } = await supabase
      .from('vessels')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json(mockVessels);
    }

    const formatted = data.map((v) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      capacity: v.capacity,
      draft: parseFloat(v.draft),
      loa: parseFloat(v.loa),
      beam: parseFloat(v.beam),
      speed: parseFloat(v.speed),
      availability: v.availability,
      status: v.status,
      location: v.location,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(mockVessels);
  }
}
