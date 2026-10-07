'use client';

import { useEffect, useState } from 'react';
import { Ship, Clock, DollarSign, MapPin, Navigation, AlertTriangle, Fuel, Cloud, Anchor, Globe } from 'lucide-react';
import { PageHeader, SectionCard, LoadingState } from '@/components/freightiq/common';
import { FilterPanel, FilterField } from '@/components/freightiq/filter-panel';
import dynamic from 'next/dynamic';

const RouteMap = dynamic(
  () => import('@/components/freightiq/route-map').then((m) => m.RouteMap),
  { ssr: false },
);
import { TrendIndicator } from '@/components/freightiq/trend-indicator';
import { RiskBadge } from '@/components/freightiq/risk-badge';
import { RiskFactorCard } from '@/components/freightiq/risk-factor-card';
import { DataTable } from '@/components/freightiq/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import type { RouteInfo, RiskFactor, VesselType, CargoType } from '@/lib/types';

const originPorts = ['Newcastle, AU', 'Gladstone, AU', 'Hay Point, AU'];
const destPorts = ['Paradip', 'Visakhapatnam', 'Gangavaram', 'Dhamra'];
const cargoTypes: CargoType[] = ['Coal', 'Iron Ore', 'Steel', 'Other Bulk Cargo'];
const vesselTypes: VesselType[] = ['Handysize', 'Supramax', 'Panamax', 'Capesize'];

const routeRiskFactors: RiskFactor[] = [
  { name: 'Weather', level: 'medium', percentage: 48, description: 'Monsoon season impacting East Coast India routes with moderate sea state conditions.' },
  { name: 'Port Congestion', level: 'medium', percentage: 55, description: 'Destination port experiencing moderate congestion with 3-5 day average waiting time.' },
  { name: 'Fuel Price', level: 'low', percentage: 28, description: 'Bunker prices stable. IFO 380 at $580/MT in loading region.' },
  { name: 'Geopolitical Risk', level: 'low', percentage: 15, description: 'No active geopolitical disruptions on this route. Stable trade corridor.' },
  { name: 'Vessel Availability', level: 'low', percentage: 22, description: 'Adequate Panamax tonnage available within 5-day reach of loading port.' },
];

import { routes as mockRoutes } from '@/lib/mock-data';

export default function RouteIntelligencePage() {
  const [routes, setRoutes] = useState<RouteInfo[]>(mockRoutes);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(mockRoutes[0]);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState('Newcastle, AU');
  const [destination, setDestination] = useState('Paradip');

  useEffect(() => {
    api.getRoutes().then((data) => {
      setRoutes(data);
      if (!selectedRoute && data.length > 0) {
        setSelectedRoute(data[0]);
      }
    });
  }, []);

  useEffect(() => {
    const matched = routes.find(
      (r) => r.originPort === origin.split(',')[0] && r.destinationPort === destination,
    );
    if (matched) setSelectedRoute(matched);
  }, [origin, destination, routes]);

  if (loading) return <LoadingState message="Loading route intelligence..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route Intelligence"
        subtitle="Interactive maritime route analysis with risk assessment and comparison"
      />

      <FilterPanel>
        <FilterField label="Origin">
          <Select value={origin} onValueChange={setOrigin}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {originPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Destination">
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {destPorts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Cargo">
          <Select defaultValue="Coal">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {cargoTypes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Vessel Type">
          <Select defaultValue="Panamax">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {vesselTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterField>
      </FilterPanel>

      {/* Map */}
      {selectedRoute && (
        <SectionCard title={`Route Map: ${selectedRoute.originPort} → ${selectedRoute.destinationPort}`}>
          <div className="glass rounded-xl border border-border/50 p-2 overflow-hidden" style={{ height: '450px' }}>
            <RouteMap
              origin={selectedRoute.coordinates.origin}
              destination={selectedRoute.coordinates.destination}
              originLabel={`${selectedRoute.originPort}, Australia`}
              destinationLabel={`${selectedRoute.destinationPort}, India`}
              intermediatePoints={[
                [(-32.92 + 20.27) / 2, (151.78 + 86.71) / 2 - 10],
              ]}
            />
          </div>
        </SectionCard>
      )}

      {/* Route Details */}
      {selectedRoute && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SectionCard title="Route Details">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><Navigation className="h-3.5 w-3.5" /><span className="text-xs">Distance</span></div>
                  <p className="mt-2 text-lg font-bold text-foreground">{selectedRoute.distance.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">NM</span></p>
                </div>
                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /><span className="text-xs">Duration</span></div>
                  <p className="mt-2 text-lg font-bold text-foreground">{selectedRoute.duration} <span className="text-xs font-normal text-muted-foreground">days</span></p>
                </div>
                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /><span className="text-xs">Current Freight</span></div>
                  <p className="mt-2 text-lg font-bold text-foreground">${selectedRoute.currentRate.toFixed(2)}<span className="text-xs font-normal text-muted-foreground">/MT</span></p>
                </div>
                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-3.5 w-3.5" /><span className="text-xs">Forecast</span></div>
                  <p className="mt-2 text-lg font-bold text-primary">${selectedRoute.forecastRate.toFixed(2)}<span className="text-xs font-normal text-primary/70">/MT</span></p>
                </div>
                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><AlertTriangle className="h-3.5 w-3.5" /><span className="text-xs">Route Risk</span></div>
                  <div className="mt-2"><RiskBadge level={selectedRoute.risk} /></div>
                </div>
                <div className="glass rounded-xl border border-border/50 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground"><Ship className="h-3.5 w-3.5" /><span className="text-xs">Congestion</span></div>
                  <div className="mt-2"><RiskBadge level={selectedRoute.congestion} /></div>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Route Trend">
            <div className="glass rounded-xl border border-border/50 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Market Direction</span>
                <TrendIndicator trend={selectedRoute.trend} />
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rate Change</span>
                  <span className="font-medium text-success">
                    +{((selectedRoute.forecastRate - selectedRoute.currentRate) / selectedRoute.currentRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost per Day</span>
                  <span className="font-medium text-foreground">${((selectedRoute.currentRate * 75000) / selectedRoute.duration).toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Voyage Cost (75k MT)</span>
                  <span className="font-medium text-foreground">${(selectedRoute.currentRate * 75000).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Route Comparison */}
      <SectionCard title="Route Comparison">
        <div className="glass rounded-xl border border-border/50 overflow-hidden">
          <DataTable
            data={routes}
            columns={[
              {
                key: 'route',
                label: 'Route',
                render: (r) => (
                  <span className="font-medium text-foreground">{r.originPort} → {r.destinationPort}</span>
                ),
              },
              { key: 'currentRate', label: 'Current Rate', align: 'right', render: (r) => `$${r.currentRate.toFixed(2)}/MT` },
              { key: 'forecastRate', label: '30-Day Forecast', align: 'right', render: (r) => <span className="text-primary">${r.forecastRate.toFixed(2)}/MT</span> },
              { key: 'risk', label: 'Risk', align: 'center', render: (r) => <RiskBadge level={r.risk} size="sm" /> },
              { key: 'distance', label: 'Distance', align: 'right', render: (r) => `${r.distance.toLocaleString()} NM` },
              { key: 'trend', label: 'Trend', align: 'center', render: (r) => <TrendIndicator trend={r.trend} /> },
            ]}
            onRowClick={(r) => setSelectedRoute(r)}
          />
        </div>
      </SectionCard>

      {/* Route Risk Factors */}
      <SectionCard title="Route Risk Factors">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routeRiskFactors.map((factor, i) => (
            <RiskFactorCard key={i} {...factor} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
