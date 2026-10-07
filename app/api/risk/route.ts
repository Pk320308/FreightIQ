import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { calculateVoyageCost, VESSEL_SPECS } from '@/lib/maritime-engine';
import type { RiskFactor, VesselType, RiskLevel } from '@/lib/types';
import { riskFactors as mockRiskFactors } from '@/lib/mock-data';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient(req);
    const { data, error } = await supabase
      .from('risk_factors')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return NextResponse.json(mockRiskFactors);
    }

    const formatted = data.map((r) => ({
      id: r.id,
      name: r.name,
      level: r.level,
      percentage: r.percentage,
      description: r.description,
    }));

    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json(mockRiskFactors);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cargoQty = Number(body.cargoQuantity) || 75000;
    const originPort = body.originPort || 'Newcastle';
    const destinationPort = body.destinationPort || 'Visakhapatnam';
    const fuelPrice = Number(body.fuelPrice) || 580;
    const congestion: RiskLevel = body.portCongestion || 'medium';
    const vesselType: VesselType = body.vesselType || 'Panamax';

    const delayDays = congestion === 'high' ? 5.5 : congestion === 'medium' ? 2.5 : 0.8;

    const voyage = calculateVoyageCost({
      originPortName: originPort,
      destinationPortName: destinationPort,
      vesselType,
      cargoQuantityMT: cargoQty,
      fuelPricePerMT: fuelPrice,
      customDelayDays: delayDays,
    });

    const vesselSpec = VESSEL_SPECS[vesselType];
    const idleCost = Math.round(delayDays * vesselSpec.dailyDemurrageUSD);

    let demurrageRisk: RiskLevel = 'low';
    if (delayDays >= 4.0) demurrageRisk = 'high';
    else if (delayDays >= 2.0) demurrageRisk = 'medium';

    let overallRisk: RiskLevel = 'low';
    if (demurrageRisk === 'high' || fuelPrice > 650) overallRisk = 'high';
    else if (demurrageRisk === 'medium' || fuelPrice > 550) overallRisk = 'medium';

    return NextResponse.json({
      estimatedTotalCost: voyage.totalVoyageCostUSD,
      estimatedFreightCost: voyage.dailyHireCostUSD + voyage.bunkerFuelCostUSD,
      expectedDelay: delayDays,
      idleCost,
      demurrageCost: voyage.demurrageCostUSD,
      fuelCost: voyage.bunkerFuelCostUSD,
      portDues: voyage.portDuesUSD,
      costPerMT: voyage.costPerMT_USD,
      co2EmissionsMT: voyage.co2EmissionsTotalMT,
      demurrageRisk,
      overallRisk,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to compute risk simulation' },
      { status: 500 }
    );
  }
}
