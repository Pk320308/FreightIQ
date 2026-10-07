import { NextRequest, NextResponse } from 'next/server';
import { evaluateCharteringStrategy } from '@/lib/maritime-engine';
import type { VesselType } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const annualDemandMT = Number(body.annualDemandMT) || 450000;
    const parcelSizeMT = Number(body.parcelSizeMT) || 75000;
    const vesselType: VesselType = body.vesselType || 'Panamax';
    const originPort = body.originPort || 'Newcastle';
    const destinationPort = body.destinationPort || 'Visakhapatnam';
    const currentSpotFreightPerMT = Number(body.currentSpotFreightPerMT) || 27.40;

    const result = evaluateCharteringStrategy({
      annualDemandMT,
      parcelSizeMT,
      vesselType,
      originPort,
      destinationPort,
      currentSpotFreightPerMT,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to evaluate charter strategy' },
      { status: 500 }
    );
  }
}
