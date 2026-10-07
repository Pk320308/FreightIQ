'use client';

import { useEffect, useState, useMemo } from 'react';
import { Check, X, Anchor, MapPin, Gauge, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/freightiq/common';
import { dataStore } from '@/lib/data-store';
import type { PortInfo } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const vesselSpecs: { type: string; draft: number; loa: number; beam: number; capacity: number }[] = [
  { type: 'Handysize', draft: 10.2, loa: 180, beam: 28, capacity: 35000 },
  { type: 'Supramax', draft: 12.8, loa: 200, beam: 32, capacity: 60000 },
  { type: 'Panamax', draft: 14.2, loa: 225, beam: 32, capacity: 75000 },
  { type: 'Capesize', draft: 17.5, loa: 295, beam: 46, capacity: 180000 },
];

export default function PortConstraintsPage() {
  const [ports, setPorts] = useState<PortInfo[]>(dataStore.getPorts());
  const [portFilter, setPortFilter] = useState<'all' | 'discharge' | 'loading'>('discharge');
  const [selectedPortId, setSelectedPortId] = useState<string>('port_paradip');

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setPorts(dataStore.getPorts());
    });
    return unsub;
  }, []);

  const filteredPorts = useMemo(() => {
    if (portFilter === 'all') return ports;
    return ports.filter((p) => p.portType === portFilter);
  }, [ports, portFilter]);

  const port = useMemo(() => {
    return ports.find((p) => p.id === selectedPortId) || filteredPorts[0] || ports[0];
  }, [ports, selectedPortId, filteredPorts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Port Bathymetry & Vessel Compatibility Constraints"
        subtitle="Detailed draft, LOA, beam, and mechanical cargo discharge rate analysis across Indian East Coast and Overseas Load Terminals"
      />

      {/* Port Type Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur p-3 rounded-xl border border-border">
        <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
          <button
            onClick={() => setPortFilter('discharge')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
              portFilter === 'discharge' ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground'
            }`}
          >
            Indian East Coast Discharge Ports
          </button>
          <button
            onClick={() => setPortFilter('loading')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
              portFilter === 'loading' ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground'
            }`}
          >
            Overseas Loading Ports
          </button>
          <button
            onClick={() => setPortFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
              portFilter === 'all' ? 'bg-background text-foreground shadow-sm font-semibold' : 'text-muted-foreground'
            }`}
          >
            All Terminals
          </button>
        </div>

        <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
          {filteredPorts.length} Ports Configured
        </Badge>
      </div>

      {/* Port Selector Chips */}
      <div className="flex flex-wrap gap-2">
        {filteredPorts.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPortId(p.id)}
            className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-all flex items-center gap-1.5 ${
              port?.id === p.id
                ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                : 'border-border/50 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>{p.name}</span>
            <span className="text-[10px] opacity-70">({p.country})</span>
          </button>
        ))}
      </div>

      {/* Port Summary Stats */}
      {port && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="glass rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground">Max Permissible Draft</p>
            <p className="mt-1 text-xl font-bold text-foreground font-mono">{port.maxDraft} m</p>
            <span className="text-[10px] text-muted-foreground">Chart Datum + Tide</span>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground">Max Length Overall (LOA)</p>
            <p className="mt-1 text-xl font-bold text-foreground font-mono">{port.maxLOA} m</p>
            <span className="text-[10px] text-muted-foreground">Berth length limitation</span>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground">Max Beam</p>
            <p className="mt-1 text-xl font-bold text-foreground font-mono">{port.maxBeam} m</p>
            <span className="text-[10px] text-muted-foreground">Channel navigation width</span>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground">Cargo Handling Rate</p>
            <p className="mt-1 text-xl font-bold text-emerald-500 font-mono">
              {port.cargoHandlingRate ? `${port.cargoHandlingRate.toLocaleString()} MT/d` : `${port.handlingCapacity || 25000} MT/d`}
            </p>
            <span className="text-[10px] text-muted-foreground">Conveyor & Crane Velocity</span>
          </div>
          <div className="glass rounded-xl border border-border/50 p-4">
            <p className="text-xs text-muted-foreground">Terminal Category</p>
            <p className="mt-1 text-base font-bold text-foreground capitalize">{port.portType} Port</p>
            <span className="text-[10px] text-muted-foreground">{port.country}</span>
          </div>
        </div>
      )}

      {/* Constraint Table */}
      {port && (
        <SectionCard title={`Vessel Class Compatibility Matrix — ${port.name} (${port.country})`}>
          <div className="glass rounded-xl border border-border/50 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-left">Vessel Type</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-right">Draft</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-right">LOA</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-right">Beam</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-right">Cargo Capacity</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-center">Draft Check</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-center">LOA Check</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-center">Beam Check</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground uppercase text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {vesselSpecs.map((vs) => {
                  const draftOk = vs.draft <= port.maxDraft;
                  const loaOk = vs.loa <= port.maxLOA;
                  const beamOk = vs.beam <= port.maxBeam;
                  const allOk = draftOk && loaOk && beamOk;

                  return (
                    <tr key={vs.type} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">{vs.type}</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{vs.draft}m</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{vs.loa}m</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{vs.beam}m</td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">{vs.capacity.toLocaleString()} MT</td>
                      <td className="px-4 py-3 text-center">
                        {draftOk ? (
                          <span className="inline-flex items-center text-emerald-500 gap-1 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500 gap-1 font-semibold">
                            <X className="w-3.5 h-3.5" /> Exceeds
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {loaOk ? (
                          <span className="inline-flex items-center text-emerald-500 gap-1 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500 gap-1 font-semibold">
                            <X className="w-3.5 h-3.5" /> Exceeds
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {beamOk ? (
                          <span className="inline-flex items-center text-emerald-500 gap-1 font-semibold">
                            <Check className="w-3.5 h-3.5" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-rose-500 gap-1 font-semibold">
                            <X className="w-3.5 h-3.5" /> Exceeds
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          className={`text-[10px] font-bold ${
                            allOk
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                          variant="outline"
                        >
                          {allOk ? 'COMPATIBLE' : 'RESTRICTED'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
