import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const supabase = createServerClient(req);

  const [
    { data: rateData },
    { data: routesData },
    { data: portsData },
    { data: insightsData },
  ] = await Promise.all([
    supabase.from('freight_rates').select('*').order('created_at', { ascending: true }),
    supabase.from('routes').select('*').order('created_at', { ascending: true }),
    supabase.from('ports').select('*').order('created_at', { ascending: true }),
    supabase.from('market_insights').select('*').order('created_at', { ascending: true }),
  ]);

  const kpis = [
    { label: 'Current Freight Rate', value: '$27.40', unit: '/ MT', change: '+2.1%', trend: 'increasing' },
    { label: '30-Day Forecast', value: '$29.10', unit: '/ MT', change: '+6.2%', trend: 'increasing' },
    { label: 'Market Trend', value: 'Increasing', change: 'Bullish', trend: 'increasing' },
    { label: 'Market Volatility', value: '12.4%', change: '+1.2%', trend: 'increasing', risk: 'medium' },
    { label: 'Overall Risk', value: 'Medium', risk: 'medium' },
  ];

  return NextResponse.json({
    kpis,
    freightRates: rateData,
    routes: routesData,
    ports: portsData,
    insights: insightsData,
  });
}
