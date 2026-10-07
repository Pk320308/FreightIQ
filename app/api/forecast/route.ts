import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { fetchAIFreightForecast } from '@/lib/ai-bridge';
import type { CargoType, VesselType, ForecastHorizon } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(req);
    const { data, error } = await supabase
      .from('freight_rates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      // Return dynamic baseline if Supabase is offline or empty
      const forecast = await fetchAIFreightForecast({
        originPort: 'Newcastle',
        destinationPort: 'Visakhapatnam',
        cargoType: 'Coal',
        cargoQuantity: 75000,
        vesselType: 'Panamax',
        horizon: '90d',
      });
      return NextResponse.json(forecast.data);
    }

    const formatted = data.map((row) => ({
      date: row.date,
      historical: row.historical,
      forecast: row.forecast,
      upperBound: row.upper_bound,
      lowerBound: row.lower_bound,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    const forecast = await fetchAIFreightForecast({
      originPort: 'Newcastle',
      destinationPort: 'Visakhapatnam',
      cargoType: 'Coal',
      cargoQuantity: 75000,
      vesselType: 'Panamax',
      horizon: '90d',
    });
    return NextResponse.json(forecast.data);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const originPort = body.originPort || 'Newcastle';
    const destinationPort = body.destinationPort || 'Visakhapatnam';
    const cargoType: CargoType = body.cargoType || 'Coal';
    const cargoQuantity: number = body.cargoQuantity || 75000;
    const vesselType: VesselType = body.vesselType || 'Panamax';
    const horizon: ForecastHorizon = body.horizon || '90d';

    // Calls AI Bridge (fetches from Python ML backend if available, or runs intelligent multi-factor fallback)
    const result = await fetchAIFreightForecast({
      originPort,
      destinationPort,
      cargoType,
      cargoQuantity,
      vesselType,
      horizon,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to generate freight forecast' },
      { status: 500 }
    );
  }
}
