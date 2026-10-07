'use client';

import { useEffect, useState } from 'react';
import { MapPin, Anchor, Ruler, Clock, Layers, Gauge } from 'lucide-react';
import { PageHeader, SectionCard, LoadingState } from '@/components/freightiq/common';
import { PortCard } from '@/components/freightiq/port-card';
import { RiskBadge } from '@/components/freightiq/risk-badge';
import { api } from '@/lib/api';
import type { PortInfo } from '@/lib/types';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(
  () => import('@/components/freightiq/route-map').then((m) => m.RouteMap),
  { ssr: false },
);

import { ports as mockPorts } from '@/lib/mock-data';

export default function PortOverviewPage() {
  const [ports, setPorts] = useState<PortInfo[]>(mockPorts);
  const [selected, setSelected] = useState<PortInfo | null>(mockPorts[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPorts().then((data) => {
      setPorts(data);
      if (!selected && data.length > 0) {
        setSelected(data[0]);
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Port Overview"
        subtitle="Real-time port status, congestion monitoring, and operational intelligence for Indian East Coast ports"
      />

      {/* Map */}
      <SectionCard title="Indian East Coast Ports">
        <div className="glass rounded-xl border border-border/50 p-2 overflow-hidden" style={{ height: '420px' }}>
          <RouteMap
            origin={[ports[0].coordinates[0], ports[0].coordinates[1] - 2]}
            destination={[ports[ports.length - 1].coordinates[0], ports[ports.length - 1].coordinates[1] + 2]}
            originLabel="Southern Ports"
            destinationLabel="Northern Ports"
            intermediatePoints={ports.slice(1, -1).map((p) => p.coordinates)}
          />
        </div>
      </SectionCard>

      {/* Port Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ports.map((port) => (
          <PortCard
            key={port.id}
            port={port}
            selected={selected?.id === port.id}
            onClick={() => setSelected(port)}
          />
        ))}
      </div>

      {/* Port Details */}
      {selected && (
        <SectionCard title={`Port Details: ${selected.name}`}>
          <div className="glass rounded-xl border border-border/50 p-5">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Overview */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Port Overview</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Location</span>
                    <span className="text-sm text-foreground">{selected.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Anchor className="h-3.5 w-3.5" /> Status</span>
                    <RiskBadge level={selected.congestion} size="sm" label={selected.status.charAt(0).toUpperCase() + selected.status.slice(1)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Avg Wait Time</span>
                    <span className="text-sm text-foreground">{selected.avgWaitTime} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Gauge className="h-3.5 w-3.5" /> Congestion</span>
                    <RiskBadge level={selected.congestion} size="sm" />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Specifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Layers className="h-3.5 w-3.5" /> Max Draft</span>
                    <span className="text-sm text-foreground">{selected.maxDraft}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Ruler className="h-3.5 w-3.5" /> Max LOA</span>
                    <span className="text-sm text-foreground">{selected.maxLOA}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Ruler className="h-3.5 w-3.5" /> Max Beam</span>
                    <span className="text-sm text-foreground">{selected.maxBeam}m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground"><Gauge className="h-3.5 w-3.5" /> Handling Capacity</span>
                    <span className="text-sm text-foreground">{selected.handlingCapacity}M MT/yr</span>
                  </div>
                </div>
              </div>

              {/* Vessel Compatibility */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Vessel Compatibility</h4>
                <div className="flex flex-wrap gap-2">
                  {(['Handysize', 'Supramax', 'Panamax', 'Capesize'] as const).map((vt) => {
                    const compatible = selected.vesselCompatibility.includes(vt);
                    return (
                      <span
                        key={vt}
                        className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium ${
                          compatible
                            ? 'bg-success/15 text-success border-success/30'
                            : 'bg-danger/10 text-danger border-danger/20'
                        }`}
                      >
                        {compatible ? '✓' : '✕'} {vt}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
