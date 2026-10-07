import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient(req);
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('generated_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = data.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    route: r.route,
    generatedDate: r.generated_date,
    status: r.status,
    summary: r.summary,
    sections: r.sections,
  }));

  return NextResponse.json(formatted);
}
