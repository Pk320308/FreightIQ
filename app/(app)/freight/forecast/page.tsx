'use client';

import { useState } from 'react';
import { Sparkles, Info, Loader2, Download, CheckCircle2, Cpu } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/freightiq/common';
import { FilterPanel, FilterField } from '@/components/freightiq/filter-panel';
import { ForecastSummary } from '@/components/freightiq/forecast-summary';
import { ForecastChart } from '@/components/freightiq/forecast-chart';
import { ForecastFactorCard } from '@/components/freightiq/risk-factor-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { ForecastResult, CargoType, VesselType, ForecastHorizon } from '@/lib/types';

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

const cargoTypes: CargoType[] = ['Coal', 'Iron Ore', 'Steel', 'Other Bulk Cargo'];
const vesselTypes: VesselType[] = ['Panamax', 'Capesize', 'Supramax', 'Handysize'];
const horizons: { value: ForecastHorizon; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '60d', label: '60 Days' },
  { value: '90d', label: '90 Days' },
];

import { freightRateData, forecastFactors } from '@/lib/mock-data';

export default function FreightForecastPage() {
  const [origin, setOrigin] = useState('Newcastle');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [cargoType, setCargoType] = useState<CargoType>('Coal');
  const [cargoQty, setCargoQty] = useState('75000');
  const [vesselType, setVesselType] = useState<VesselType>('Panamax');
  const [horizon, setHorizon] = useState<ForecastHorizon>('90d');
  const [result, setResult] = useState<(ForecastResult & { source?: string }) | null>({
    currentRate: 27.40,
    forecast7d: 28.10,
    forecast30d: 29.10,
    forecast60d: 29.98,
    forecast90d: 31.40,
    trend: 'increasing',
    volatility: 'medium',
    confidence: 84,
    data: freightRateData,
    factors: forecastFactors,
    explanation: 'Forecast projects a bullish freight trend for Coal via Panamax from Newcastle to Visakhapatnam. Strong coal import demand from Indian steel mills and firming bunker benchmarks are primary drivers.',
    source: 'Deterministic Maritime Model',
  });
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const res = await api.generateForecast({
      originPort: origin,
      destinationPort: destination,
      cargoType,
      cargoQuantity: parseFloat(cargoQty) || 75000,
      vesselType,
      horizon,
    });
    setResult(res);
    setLoading(false);
  };

  const handleExportCSV = () => {
    if (!result || !result.data) return;
    const headers = ['Date', 'Historical Rate ($/MT)', 'Forecast Rate ($/MT)', 'Lower 95% Bound', 'Upper 95% Bound'];
    const rows = result.data.map((d) => [
      d.date,
      d.historical ?? '',
      d.forecast ?? '',
      d.lowerBound ?? '',
      d.upperBound ?? '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freight-forecast-${origin.toLowerCase()}-${destination.toLowerCase()}-${horizon}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intelligent Freight Rate Forecasting"
        subtitle="AI/ML-powered probabilistic freight curve projections with confidence bands & macroeconomic feature importance"
      >
        <div className="flex gap-2">
          {result && (
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
          <Button onClick={handleGenerate} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? 'Executing Inference...' : 'Generate AI Forecast'}
          </Button>
        </div>
      </PageHeader>

      <FilterPanel title="Forecast Parameters & Corridor Selection">
        <FilterField label="Overseas Origin Port">
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {originPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Indian Discharge Port">
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {destPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Bulk Commodity Type">
          <Select value={cargoType} onValueChange={(v) => setCargoType(v as CargoType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cargoTypes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Parcel Quantity (MT)">
          <Input type="number" value={cargoQty} onChange={(e) => setCargoQty(e.target.value)} placeholder="75000" />
        </FilterField>
        <FilterField label="Vessel Class">
          <Select value={vesselType} onValueChange={(v) => setVesselType(v as VesselType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {vesselTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Forecast Time Horizon">
          <Select value={horizon} onValueChange={(v) => setHorizon(v as ForecastHorizon)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {horizons.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterPanel>

      {!result && !loading && (
        <div className="glass rounded-xl border border-border/50 p-12 text-center">
          <Cpu className="mx-auto h-12 w-12 text-primary/50" />
          <h3 className="mt-4 text-base font-semibold text-foreground">AI Freight Forecasting Model Ready</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Select route corridors and commodity parameters above, then click &quot;Generate AI Forecast&quot; to compute multi-variable probabilistic freight trajectories.
          </p>
        </div>
      )}

      {loading && (
        <div className="glass rounded-xl border border-border/50 p-12 text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-foreground">Executing ML Model &amp; Ingesting Market Indices...</p>
          <p className="text-xs text-muted-foreground mt-1">Analyzing Baltic indices, bunker fuel trends, and East Coast port queues</p>
        </div>
      )}

      {result && !loading && (
        <>
          {/* Model Status Badge */}
          <div className="flex items-center justify-between px-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Model Engine: {result.source || 'AI/ML Forecasting Service (Active)'}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Confidence Score: <span className="font-bold text-foreground">{result.confidence}%</span>
            </div>
          </div>

          {/* Forecast Summary */}
          <SectionCard title="Freight Rate Trajectory Summary">
            <ForecastSummary
              items={[
                { label: 'Spot Benchmark Rate', value: `$${result.currentRate.toFixed(2)}`, unit: '/MT' },
                { label: '7-Day Forward Rate', value: `$${result.forecast7d.toFixed(2)}`, unit: '/MT', trend: 'increasing', highlight: true },
                { label: '30-Day Forward Rate', value: `$${result.forecast30d.toFixed(2)}`, unit: '/MT', trend: 'increasing' },
                { label: '90-Day Forward Rate', value: `$${result.forecast90d.toFixed(2)}`, unit: '/MT', trend: 'increasing' },
                { label: 'Volatility Index', value: 'Moderate (12.4%)', risk: result.volatility },
                { label: 'Model Confidence', value: `${result.confidence}%` },
              ]}
            />
          </SectionCard>

          {/* Forecast Chart */}
          <SectionCard
            title={`Projected Freight Rate Curve: ${origin} ➔ ${destination}`}
            action={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-chart-1" /> Historical Rate</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-chart-2" /> AI Forecast</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm bg-chart-2/30" /> 95% Confidence Interval</span>
              </div>
            }
          >
            <div className="glass rounded-xl border border-border/50 p-5">
              <ForecastChart data={result.data} height={400} />
            </div>
          </SectionCard>

          {/* Forecast Factors */}
          <SectionCard title="Key Macroeconomic & Supply Drivers (SHAP Importance)">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {result.factors.map((factor, i) => (
                <ForecastFactorCard key={i} factor={factor} />
              ))}
            </div>
          </SectionCard>

          {/* Model Explanation */}
          <SectionCard title="Executive AI Rationale & Procurement Guidance">
            <div className="glass rounded-xl border border-border/50 p-5">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Decision Support Summary</h4>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">{result.explanation}</p>
                  <p className="text-xs text-muted-foreground">
                    💡 <strong>Actionable Procurement Recommendation:</strong> For steel plant procurement managers, forward rate projections indicate firming prices. Securing 60-day forward coverage or locking a 1-year Time Charter prior to mid-quarter demand peaks will minimize ton-mile expense.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
