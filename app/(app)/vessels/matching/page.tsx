'use client';

import { useState } from 'react';
import { Loader2, Search, CheckCircle2, XCircle, Star, Ship, Fuel, Anchor, Clock, DollarSign } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/freightiq/common';
import { FilterPanel, FilterField } from '@/components/freightiq/filter-panel';
import { VesselCompatibilityBadge } from '@/components/freightiq/vessel-compatibility-badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { VesselMatchResult, VesselType, CargoType } from '@/lib/types';

const originPorts = [
  'Newcastle',
  'Gladstone',
  'Hay Point / Dalrymple Bay',
  'Muara Pantai / Tanjung Bara',
  'Richards Bay',
  'Maputo / Beira',
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
import { evaluateVesselMatching } from '@/lib/maritime-engine';
import { dataStore } from '@/lib/data-store';

export default function VesselMatchingPage() {
  const [portsList, setPortsList] = useState<string[]>(() => {
    const custom = dataStore.getPorts().map((p) => p.name);
    return Array.from(new Set([...destPorts, ...custom]));
  });
  const [origin, setOrigin] = useState('Newcastle');
  const [destination, setDestination] = useState('Visakhapatnam');
  const [cargoType, setCargoType] = useState<CargoType>('Coal');
  const [cargoQty, setCargoQty] = useState('75000');
  const [fuelPrice, setFuelPrice] = useState('580');
  const [requiredDate, setRequiredDate] = useState('2026-10-15');
  const [preferredType, setPreferredType] = useState<VesselType>('Panamax');
  const [results, setResults] = useState<VesselMatchResult[] | null>(() =>
    evaluateVesselMatching({
      originPort: 'Newcastle',
      destinationPort: 'Visakhapatnam',
      cargoType: 'Coal',
      cargoQuantity: 75000,
      fuelPrice: 580,
    })
  );
  const [loading, setLoading] = useState(false);

  const handleMatch = async () => {
    setLoading(true);
    const res = await api.matchVessels({
      originPort: origin,
      destinationPort: destination,
      cargoType,
      cargoQuantity: parseFloat(cargoQty) || 75000,
      fuelPrice: parseFloat(fuelPrice) || 580,
      requiredDate,
      preferredVesselType: preferredType,
    });
    setResults(res);
    setLoading(false);
  };

  const recommended = results?.find((r) => r.suitability === 'recommended');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessel & Port Constraints Optimizer"
        subtitle="Mathematical optimization matching cargo parcels against East Coast port drafts, UKC margins, and vessel economics"
      >
        <Button onClick={handleMatch} disabled={loading} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Evaluating Draft & Physics...' : 'Optimize Vessel Allocation'}
        </Button>
      </PageHeader>

      <FilterPanel title="Shipment & Port Parameters">
        <FilterField label="Origin Port (Overseas)">
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {originPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Destination Port (East Coast India)">
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {portsList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Cargo Commodity">
          <Select value={cargoType} onValueChange={(v) => setCargoType(v as CargoType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cargoTypes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>

        <FilterField label="Cargo Quantity (MT)">
          <Input type="number" value={cargoQty} onChange={(e) => setCargoQty(e.target.value)} placeholder="75000" />
        </FilterField>

        <FilterField label="VLSFO Bunker Fuel ($/MT)">
          <Input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} placeholder="580" />
        </FilterField>

        <FilterField label="Laycan / Required Date">
          <Input type="date" value={requiredDate} onChange={(e) => setRequiredDate(e.target.value)} />
        </FilterField>
      </FilterPanel>

      {!results && !loading && (
        <div className="glass rounded-xl border border-border/50 p-12 text-center">
          <Ship className="mx-auto h-12 w-12 text-primary/50" />
          <h3 className="mt-4 text-base font-semibold text-foreground">Ready for Port & Vessel Optimization</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Click &quot;Optimize Vessel Allocation&quot; to evaluate laden drafts, Under Keel Clearance (UKC), berth limits, and calculate exact ton-mile freight quotes.
          </p>
        </div>
      )}

      {loading && (
        <div className="glass rounded-xl border border-border/50 p-12 text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" />
          <p className="mt-4 text-sm font-medium text-foreground">Evaluating Port Depth, Tidal Windows &amp; Steaming Economics...</p>
          <p className="text-xs text-muted-foreground mt-1">Cross-referencing {destination} permissible draft against vessel classes</p>
        </div>
      )}

      {results && !loading && (
        <>
          {/* Recommendation Card */}
          {recommended && (
            <div className="glass rounded-xl border border-primary/40 bg-primary/10 p-6 ring-1 ring-primary/30">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Star className="h-6 w-6 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-foreground">Optimal Selection: {recommended.vesselType}</h3>
                    <VesselCompatibilityBadge type="suitability" value={recommended.suitability} />
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                      {recommended.compatibilityScore}% Compatibility
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90 font-medium leading-relaxed">
                    {recommended.reasons.join(' ')}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 pt-3 border-t border-primary/20">
                    <div className="flex items-center gap-2.5">
                      <Anchor className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Standard Capacity</p>
                        <p className="text-sm font-bold text-foreground">{recommended.capacity.toLocaleString()} MT</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Ship className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Laden Draft</p>
                        <p className="text-sm font-bold text-foreground">{recommended.draft} m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Discharge Turnaround</p>
                        <p className="text-sm font-bold text-foreground">{recommended.totalPortStayDays} Days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Estimated Freight</p>
                        <p className="text-base font-bold text-primary">${recommended.estimatedFreightRatePerMT} <span className="text-xs font-normal text-muted-foreground">/ MT</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <SectionCard title={`Dual-Port Vessel Class Comparison: ${origin} ➔ ${destination}`}>
            <div className="glass rounded-xl border border-border/50 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    {['Vessel Class', 'Capacity', 'Draft/LOA', 'Load Port Fit', 'Discharge Fit', 'Turnaround', 'Est. Freight', 'Suitability'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {results.map((r, i) => (
                    <tr key={i} className={`hover:bg-muted/10 transition-colors ${r.suitability === 'recommended' ? 'bg-primary/5 font-medium' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap flex items-center gap-2">
                        {r.vesselType}
                        {r.suitability === 'recommended' && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">BEST</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.capacity.toLocaleString()} MT</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.draft}m / {r.loa}m</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.loadingPortCompatibility.compatible ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {r.loadingPortCompatibility.compatible ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {r.loadingPortCompatibility.compatible ? 'Pass' : 'Restricted'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${r.dischargePortCompatibility.compatible ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {r.dischargePortCompatibility.compatible ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          {r.dischargePortCompatibility.compatible ? 'Pass' : 'Restricted'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{r.totalPortStayDays} days</td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono font-semibold">
                        {r.estimatedFreightRatePerMT > 0 ? (
                          <span className="text-foreground">${r.estimatedFreightRatePerMT} <span className="text-xs text-muted-foreground font-normal">/ MT</span></span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><VesselCompatibilityBadge type="suitability" value={r.suitability} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Reasoning Breakdown */}
          <SectionCard title="Port & Maritime Technical Assessment">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {results.map((r, i) => (
                <div key={i} className="glass rounded-xl border border-border/50 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Ship className="h-4 w-4 text-primary" />
                      {r.vesselType} Class Assessment
                    </h4>
                    <VesselCompatibilityBadge type="suitability" value={r.suitability} />
                  </div>
                  <ul className="text-xs text-muted-foreground leading-relaxed pt-1 space-y-1">
                    {r.reasons.map((reason, ri) => (
                      <li key={ri} className="flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
