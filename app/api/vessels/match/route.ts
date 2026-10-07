import { NextRequest, NextResponse } from 'next/server';
import { evaluateVesselMatching } from '@/lib/maritime-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const destinationPort = body.destinationPort || 'Visakhapatnam';
    const originPort = body.originPort || 'Newcastle';
    const cargoQuantity = Number(body.cargoQuantity) || 75000;
    const cargoType = body.cargoType || 'Coal';
    const fuelPrice = Number(body.fuelPrice) || 580;

    // Use full physics & port constraint engine
    const results = evaluateVesselMatching({
      destinationPort,
      originPort,
      cargoQuantity,
      cargoType,
      fuelPrice,
    });

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to match vessels' },
      { status: 500 }
    );
  }
}
