'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Loader2, Play, DollarSign, Clock, AlertTriangle, TrendingDown, ShieldCheck, Fuel, Anchor, Leaf } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/freightiq/common';
import { FilterPanel, FilterField } from '@/components/freightiq/filter-panel';
import { ScenarioResultCard } from '@/components/freightiq/scenario-result-card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { api } from '@/lib/api';
import type { SimulationResult, VesselType, RiskLevel } from '@/lib/types';

const originPorts = ['Newcastle', 'Gladstone', 'Hay Point / Dalrymple Bay', 'Richards Bay', 'Muara Pantai / Tanjung Bara', 'Baltimore / Norfolk'];
const destPorts = ['Visakhapatnam', 'Paradip', 'Dhamra', 'Gangavaram', 'Haldia'];
const vesselTypes: VesselType[] = ['Panamax', 'Capesize', 'Supramax', 'Handysize'];

interface ExtendedSimulationResult extends SimulationResult {
  demurrageCost?: number;
  fuelCost?: number;
  portDues?: number;
  costPerMT?: number;
  co2EmissionsMT?: number;
}

export default function ScenarioSimulatorPage() {
  const [origin, setOrigin] = useState('Newcastle');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [cargoQty, setCargoQty] = useState('75000');
  const [freightRate, setFreightRate] = useState('27.40');
  const [fuelPrice, setFuelPrice] = useState('580');
  const [congestion, setCongestion] = useState<RiskLevel>('medium');
  const [vesselType, setVesselType] = useState<VesselType>('Panamax');
  const [voyageDuration, setVoyageDuration] = useState(21);
  const [result, setResult] = useState<ExtendedSimulationResult | null>({
    estimatedTotalCost: 2075000,
    estimatedFreightCost: 2055000,
    expectedDelay: 2.5,
    idleCost: 21250,
    demurrageRisk: 'medium',
    overallRisk: 'medium',
    demurrageCost: 37500,
    fuelCost: 420000,
    portDues: 85000,
    costPerMT: 27.66,
    co2EmissionsMT: 1280,
  });
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    const res = await api.runSimulation({
      cargoQuantity: parseFloat(cargoQty) || 75000,
      freightRate: parseFloat(freightRate) || 27.40,
      fuelPrice: parseFloat(fuelPrice) || 580,
      portCongestion: congestion,
      vesselType,
      voyageDuration,
    });
    setResult(res as ExtendedSimulationResult);
    setLoading(false);
  };

  const simulationChart = result ? [
    { day: 'Day 1', base: Math.round(result.estimatedTotalCost * 0.94), optimistic: Math.round(result.estimatedTotalCost * 0.88), pessimistic: Math.round(result.estimatedTotalCost * 1.05) },
    { day: 'Day 5', base: Math.round(result.estimatedTotalCost * 0.96), optimistic: Math.round(result.estimatedTotalCost * 0.90), pessimistic: Math.round(result.estimatedTotalCost * 1.08) },
    { day: 'Day 10', base: Math.round(result.estimatedTotalCost * 0.98), optimistic: Math.round(result.estimatedTotalCost * 0.92), pessimistic: Math.round(result.estimatedTotalCost * 1.11) },
    { day: 'Day 15', base: Math.round(result.estimatedTotalCost * 1.00), optimistic: Math.round(result.estimatedTotalCost * 0.94), pessimistic: Math.round(result.estimatedTotalCost * 1.15) },
    { day: 'Day 20', base: Math.round(result.estimatedTotalCost * 1.02), optimistic: Math.round(result.estimatedTotalCost * 0.96), pessimistic: Math.round(result.estimatedTotalCost * 1.19) },
    { day: 'Day 25', base: Math.round(result.estimatedTotalCost * 1.05), optimistic: Math.round(result.estimatedTotalCost * 0.98), pessimistic: Math.round(result.estimatedTotalCost * 1.24) },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic What-If & Risk Simulator"
        subtitle="Simulate fuel price surges, port berth congestion delays, demurrage penalties, and carbon footprint"
      >
        <Button onClick={handleSimulate} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {loading ? 'Simulating Logistics Shocks...' : 'Run What-If Simulation'}
        </Button>
      </PageHeader>

      <FilterPanel title="Simulation Parameters & Market Shocks">
        <FilterField label="Origin Port">
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {originPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Discharge Port (East Coast)">
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {destPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Cargo Quantity (MT)">
          <Input type="number" value={cargoQty} onChange={(e) => setCargoQty(e.target.value)} placeholder="75000" />
        </FilterField>

        <FilterField label="Bunker Fuel Price ($/MT)">
          <Input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} placeholder="580" />
        </FilterField>

        <FilterField label="Port Berth Congestion Level">
          <Select value={congestion} onValueChange={(v) => setCongestion(v as RiskLevel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (1-2 days wait)</SelectItem>
              <SelectItem value="medium">Medium (2-3 days wait)</SelectItem>
              <SelectItem value="high">High (&gt;4 days demurrage risk)</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Vessel Class">
          <Select value={vesselType} onValueChange={(v) => setVesselType(v as VesselType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {vesselTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label={`Voyage Duration: ${voyageDuration} steaming days`}>
          <Slider
            value={[voyageDuration]}
            onValueChange={(v) => setVoyageDuration(v[0])}
            min={10}
            max={35}
            step={1}
            className="mt-2"
          />
        </FilterField>
      </FilterPanel>

      {!result && !loading && (
        <div className="glass rounded-xl border border-border/50 p-12 text-center">
          <Play className="mx-auto h-12 w-12 text-primary/50" />
          <h3 className="mt-4 text-base font-semibold text-foreground">Interactive Risk & Shock Simulator Ready</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Adjust bunker prices, port congestion levels, and steaming days above to simulate total procurement expenditure, demurrage penalties, and financial risk profiles.
          </p>
        </div>
      )}

      {loading && (
        <div className="glass rounded-xl border border-border/50 p-12 text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-foreground">Computing Multi-Variable Monte Carlo Cost Outcomes...</p>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Result Cards */}
          <SectionCard title="Simulation Economic Impact">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ScenarioResultCard
                label="Total Projected Voyage Cost"
                value={`$${result.estimatedTotalCost.toLocaleString()}`}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <ScenarioResultCard
                label="Effective Freight / MT"
                value={result.costPerMT ? `$${result.costPerMT} / MT` : `$${(result.estimatedTotalCost / (parseFloat(cargoQty) || 1)).toFixed(2)} / MT`}
                icon={<TrendingDown className="h-4 w-4" />}
              />
              <ScenarioResultCard
                label="Port Waiting / Laytime Delay"
                value={`${result.expectedDelay}`}
                unit="days"
                icon={<Clock className="h-4 w-4" />}
              />
              <ScenarioResultCard
                label="Demurrage Penalty & Idle Risk"
                value={`$${result.idleCost.toLocaleString()}`}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <ScenarioResultCard
                label="Demurrage Risk Exposure"
                value={result.demurrageRisk.charAt(0).toUpperCase() + result.demurrageRisk.slice(1)}
                risk={result.demurrageRisk}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
              <ScenarioResultCard
                label="Overall Route Risk"
                value={result.overallRisk.charAt(0).toUpperCase() + result.overallRisk.slice(1)}
                risk={result.overallRisk}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
            </div>
          </SectionCard>

          {/* Cost Projection Chart */}
          <SectionCard title="Sensitivity Projection: Base vs. Market Stress Scenarios">
            <div className="glass rounded-xl border border-border/50 p-5">
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={simulationChart} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(2)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(222 44% 9%)', border: '1px solid hsl(222 30% 20%)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                  />
                  <ReferenceLine y={result.estimatedTotalCost} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: 'Simulation Base', fill: 'hsl(var(--primary))', fontSize: 10, position: 'right' }} />
                  <Line type="monotone" dataKey="base" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={false} name="Simulated Baseline" />
                  <Line type="monotone" dataKey="optimistic" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Optimistic (Zero Congestion)" />
                  <Line type="monotone" dataKey="pessimistic" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="5 3" dot={false} name="Pessimistic (+Fuel Surge & Monsoon Delay)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Cost Breakdown */}
          <SectionCard title="Voyage Expenditure & Sustainability Breakdown">
            <div className="glass rounded-xl border border-border/50 p-5">
              <div className="space-y-4">
                {[
                  { label: 'Charter Hire / Freight Baseline', value: result.estimatedFreightCost, color: 'bg-chart-1' },
                  { label: 'Bunker Fuel Expenditure (VLSFO & MGO)', value: result.fuelCost || Math.round((parseFloat(fuelPrice) || 580) * voyageDuration * 30), color: 'bg-chart-2' },
                  { label: 'Port Congestion Idle & Demurrage', value: result.idleCost, color: 'bg-chart-3' },
                ].map((item) => {
                  const pct = Math.min(100, (item.value / result.estimatedTotalCost) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold text-foreground">${item.value.toLocaleString()} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
