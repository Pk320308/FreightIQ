'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { DollarSign, Clock, Fuel, Anchor, Sparkles, TrendingUp, ShieldCheck, CheckCircle2, AlertCircle, Ship, ArrowRight, Layers } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/freightiq/common';
import { KpiCard } from '@/components/freightiq/kpi-card';
import { TrendIndicator } from '@/components/freightiq/trend-indicator';
import { RiskBadge } from '@/components/freightiq/risk-badge';
import { FilterPanel, FilterField } from '@/components/freightiq/filter-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { evaluateMultipleVoyageContractStrategy, MultipleVoyageContractComparison } from '@/lib/maritime-engine';
import { VesselType } from '@/lib/types';

const vesselTypes: VesselType[] = ['Panamax', 'Capesize', 'Supramax', 'Handysize'];
const originPorts = [
  'Newcastle',
  'Gladstone',
  'Hay Point / Dalrymple Bay',
  'Richards Bay',
  'Maputo / Beira',
  'Muara Pantai / Tanjung Bara',
  'Baltimore / Norfolk',
  'Taman / Ust-Luga',
];
const destPorts = [
  'Visakhapatnam',
  'Paradip',
  'Dhamra',
  'Gangavaram',
  'Haldia',
  'Kamarajar / Ennore',
  'Krishnapatnam',
];

export default function CharterAnalysisPage() {
  const [cargoQuantity, setCargoQuantity] = useState('75000');
  const [selectedVessel, setSelectedVessel] = useState<VesselType>('Panamax');
  const [origin, setOrigin] = useState('Newcastle');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [spotRate, setSpotRate] = useState('27.40');

  const [comparison, setComparison] = useState<MultipleVoyageContractComparison>(() =>
    evaluateMultipleVoyageContractStrategy({
      cargoQuantityMT: 75000,
      vesselType: 'Panamax',
      originPort: 'Newcastle',
      destinationPort: 'Visakhapatnam',
      currentSpotFreightPerMT: 27.40,
    })
  );

  const handleRecalculate = () => {
    const qty = parseFloat(cargoQuantity) || 75000;
    const rate = parseFloat(spotRate) || 27.40;
    const res = evaluateMultipleVoyageContractStrategy({
      cargoQuantityMT: qty,
      vesselType: selectedVessel,
      originPort: origin,
      destinationPort: destination,
      currentSpotFreightPerMT: rate,
    });
    setComparison(res);
  };

  const chartData = [
    {
      name: 'Spot (1 Voyage)',
      'Freight Cost': Math.round(comparison.options.spot.estimatedFreightCost / 1000),
      'Port Dues': Math.round(comparison.options.spot.portCost / 1000),
      'Demurrage/Delay': Math.round(comparison.options.spot.demurrageAndIdleCost / 1000),
      costPerMT: comparison.options.spot.costPerMT,
    },
    {
      name: '3-Month (3 Voyages)',
      'Freight Cost': Math.round(comparison.options.shortTerm3M.estimatedFreightCost / 1000 / 3),
      'Port Dues': Math.round(comparison.options.shortTerm3M.portCost / 1000 / 3),
      'Demurrage/Delay': Math.round(comparison.options.shortTerm3M.demurrageAndIdleCost / 1000 / 3),
      costPerMT: comparison.options.shortTerm3M.costPerMT,
    },
    {
      name: '6-Month (6 Voyages)',
      'Freight Cost': Math.round(comparison.options.mediumTerm6M.estimatedFreightCost / 1000 / 6),
      'Port Dues': Math.round(comparison.options.mediumTerm6M.portCost / 1000 / 6),
      'Demurrage/Delay': Math.round(comparison.options.mediumTerm6M.demurrageAndIdleCost / 1000 / 6),
      costPerMT: comparison.options.mediumTerm6M.costPerMT,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multiple-Voyage Charter Strategy & Economics Optimizer"
        subtitle="Shift from reactive single spot fixtures to hedged 3-Month and 6-Month multi-voyage bulk contracts"
      />

      {/* Top Strategic KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Spot Baseline Landed Cost" value={`$${comparison.options.spot.costPerMT.toFixed(2)}`} unit="/MT">
          <TrendIndicator trend="increasing" value="High Daily Volatility" />
        </KpiCard>
        <KpiCard label="3-Month Multi-Voyage Cost" value={`$${comparison.options.shortTerm3M.costPerMT.toFixed(2)}`} unit="/MT">
          <TrendIndicator trend="decreasing" value="-$1.64/MT Discount" />
        </KpiCard>
        <KpiCard label="6-Month Multi-Voyage Cost" value={`$${comparison.options.mediumTerm6M.costPerMT.toFixed(2)}`} unit="/MT">
          <TrendIndicator trend="decreasing" value="-$2.46/MT Discount" />
        </KpiCard>
        <KpiCard label="Recommended Strategy" value="3-Month Multi-Voyage" risk="low">
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
            Optimal Risk-Hedging
          </Badge>
        </KpiCard>
      </div>

      {/* Interactive Optimization Parameters */}
      <FilterPanel title="Contract Parameters & Route Simulation">
        <FilterField label="Loading Port">
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {originPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Discharge Port">
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {destPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Vessel Class">
          <Select value={selectedVessel} onValueChange={(v) => setSelectedVessel(v as VesselType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {vesselTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Parcel Size per Voyage (MT)">
          <Input type="number" value={cargoQuantity} onChange={(e) => setCargoQuantity(e.target.value)} />
        </FilterField>
        <FilterField label="Current Spot Market Rate ($/MT)">
          <Input type="number" step="0.1" value={spotRate} onChange={(e) => setSpotRate(e.target.value)} />
        </FilterField>
        <div className="flex items-end">
          <Button onClick={handleRecalculate} className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Sparkles className="h-4 w-4" />
            Recalculate Strategy
          </Button>
        </div>
      </FilterPanel>

      {/* 3-Way Strategy Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Spot Card */}
        <Card className={`bg-card/70 backdrop-blur border ${comparison.recommendedOption === 'SPOT' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="text-[10px] mb-1">TRADITIONAL</Badge>
                <CardTitle className="text-base font-bold">{comparison.options.spot.label}</CardTitle>
              </div>
              <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px]">
                High Risk
              </Badge>
            </div>
            <CardDescription className="text-xs">Single voyage commitment with spot index exposure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>Freight Rate:</span>
                <span className="text-foreground font-semibold">${comparison.options.spot.freightRatePerMT.toFixed(2)}/MT</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Port Dues:</span>
                <span className="text-foreground">${(comparison.options.spot.portCost / 1000).toFixed(0)}k</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Demurrage Exposure:</span>
                <span className="text-rose-400">${(comparison.options.spot.demurrageAndIdleCost / 1000).toFixed(0)}k</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between font-bold text-foreground">
                <span>Total Landed / MT:</span>
                <span className="text-base text-rose-400">${comparison.options.spot.costPerMT.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {comparison.options.spot.recommendationRationale}
            </p>
          </CardContent>
        </Card>

        {/* 3-Month Multi-Voyage Card (Recommended) */}
        <Card className={`bg-card/70 backdrop-blur border ${comparison.recommendedOption === 'SHORT_TERM_3M' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5' : 'border-border'}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <Badge className="bg-emerald-500 text-black font-bold text-[10px] mb-1">RECOMMENDED</Badge>
                <CardTitle className="text-base font-bold">{comparison.options.shortTerm3M.label}</CardTitle>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                Low Risk
              </Badge>
            </div>
            <CardDescription className="text-xs">3 consecutive voyages with fixed rate lock &amp; scheduled berthing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-500/10 rounded-lg space-y-1.5 font-mono border border-emerald-500/20">
              <div className="flex justify-between text-muted-foreground">
                <span>Hedged Freight Rate:</span>
                <span className="text-emerald-400 font-semibold">${comparison.options.shortTerm3M.freightRatePerMT.toFixed(2)}/MT</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Cargo (3 Trips):</span>
                <span className="text-foreground">{comparison.options.shortTerm3M.totalCargoMT.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Savings vs Spot:</span>
                <span className="text-emerald-400 font-bold">+${(comparison.options.shortTerm3M.expectedSavingsVsSpot / 1000).toFixed(0)}k USD</span>
              </div>
              <div className="border-t border-emerald-500/20 pt-1.5 flex justify-between font-bold text-foreground">
                <span>Total Landed / MT:</span>
                <span className="text-base text-emerald-400">${comparison.options.shortTerm3M.costPerMT.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-foreground font-medium leading-relaxed">
              {comparison.options.shortTerm3M.recommendationRationale}
            </p>
          </CardContent>
        </Card>

        {/* 6-Month Multi-Voyage Card */}
        <Card className={`bg-card/70 backdrop-blur border ${comparison.recommendedOption === 'MEDIUM_TERM_6M' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="text-[10px] mb-1">MEDIUM-TERM</Badge>
                <CardTitle className="text-base font-bold">{comparison.options.mediumTerm6M.label}</CardTitle>
              </div>
              <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">
                Volume Discount
              </Badge>
            </div>
            <CardDescription className="text-xs">6 consecutive voyages with maximum scale economies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>Hedged Freight Rate:</span>
                <span className="text-blue-400 font-semibold">${comparison.options.mediumTerm6M.freightRatePerMT.toFixed(2)}/MT</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Cargo (6 Trips):</span>
                <span className="text-foreground">{comparison.options.mediumTerm6M.totalCargoMT.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total Savings vs Spot:</span>
                <span className="text-emerald-400 font-bold">+${(comparison.options.mediumTerm6M.expectedSavingsVsSpot / 1000).toFixed(0)}k USD</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between font-bold text-foreground">
                <span>Total Landed / MT:</span>
                <span className="text-base text-blue-400">${comparison.options.mediumTerm6M.costPerMT.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {comparison.options.mediumTerm6M.recommendationRationale}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Chart */}
      <SectionCard title="Normalized Cost Components per Single Voyage ($k USD)">
        <div className="glass rounded-xl border border-border/50 p-5">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="k" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover/95 backdrop-blur p-3 rounded-lg border border-border shadow-xl text-xs space-y-1">
                          <p className="font-bold text-foreground">{label}</p>
                          {payload.map((p: any, i: number) => (
                            <p key={i} style={{ color: p.color }}>
                              {p.name}: <span className="font-bold">${p.value}k USD</span>
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="Freight Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Port Dues" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Demurrage/Delay" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </SectionCard>

      {/* Executive Decision Rationale */}
      <SectionCard title="Executive Chartering Advisory & Laycan Protection">
        <div className="glass rounded-xl border border-border/50 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">
                Multiple-Voyage Contract Strategy Rationale
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {comparison.executiveRationale}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
