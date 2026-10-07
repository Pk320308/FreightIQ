'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Ship,
  Anchor,
  AlertTriangle,
  Activity,
  DollarSign,
  Gauge,
} from 'lucide-react';
import { KpiCard } from '@/components/freightiq/kpi-card';
import { TrendIndicator } from '@/components/freightiq/trend-indicator';
import { RiskBadge } from '@/components/freightiq/risk-badge';
import { ForecastChart } from '@/components/freightiq/forecast-chart';
import { InsightCard } from '@/components/freightiq/insight-card';
import { PageHeader, SectionCard, SkeletonCard, LoadingState } from '@/components/freightiq/common';
import { DataTable } from '@/components/freightiq/data-table';
import { PortCard } from '@/components/freightiq/port-card';
import { api } from '@/lib/api';
import type { KpiData, FreightRatePoint, RouteInfo, PortInfo, MarketInsight } from '@/lib/types';

import {
  dashboardKpis,
  freightRateData,
  routes as mockRoutes,
  ports as mockPorts,
  marketInsights as mockInsights,
} from '@/lib/mock-data';

const kpiIcons: Record<number, React.ElementType> = {
  0: DollarSign,
  1: TrendingUp,
  2: Activity,
  3: Gauge,
  4: AlertTriangle,
};

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KpiData[]>(dashboardKpis);
  const [rateData, setRateData] = useState<FreightRatePoint[]>(freightRateData);
  const [routes, setRoutes] = useState<RouteInfo[]>(mockRoutes);
  const [ports, setPorts] = useState<PortInfo[]>(mockPorts);
  const [insights, setInsights] = useState<MarketInsight[]>(mockInsights);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getDashboardKpis(),
      api.getFreightRateData(),
      api.getRoutes(),
      api.getPorts(),
      api.getMarketInsights(),
    ]).then(([k, r, rt, p, ins]) => {
      setKpis(k);
      setRateData(r);
      setRoutes(rt);
      setPorts(p);
      setInsights(ins);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Freight Intelligence Dashboard" subtitle="Executive overview of freight market, routes, and port status" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <LoadingState message="Loading dashboard data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Freight Intelligence Dashboard"
        subtitle="Executive overview of freight market, routes, and port status"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, i) => {
          const Icon = kpiIcons[i] ?? Activity;
          return (
            <KpiCard
              key={i}
              label={kpi.label}
              value={kpi.value}
              unit={kpi.unit}
              risk={kpi.risk}
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              {kpi.trend && <TrendIndicator trend={kpi.trend} value={kpi.change} />}
              {!kpi.trend && kpi.change && <span className="text-xs text-muted-foreground">{kpi.change}</span>}
            </KpiCard>
          );
        })}
      </div>

      {/* Freight Rate Forecast Chart */}
      <SectionCard
        title="Freight Rate Forecast"
        action={
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-chart-1" /> Historical
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-chart-2" /> Forecast
            </span>
          </div>
        }
      >
        <div className="glass rounded-xl border border-border/50 p-5">
          <ForecastChart data={rateData} height={380} />
        </div>
      </SectionCard>

      {/* Route Overview + Port Status */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Route Overview">
          <div className="glass rounded-xl border border-border/50 overflow-hidden">
            <DataTable
              data={routes}
              columns={[
                {
                  key: 'route',
                  label: 'Route',
                  render: (r) => (
                    <span className="font-medium text-foreground">
                      {r.originPort} → {r.destinationPort}
                    </span>
                  ),
                },
                {
                  key: 'currentRate',
                  label: 'Current',
                  align: 'right',
                  render: (r) => <span className="text-foreground">${r.currentRate.toFixed(2)}/MT</span>,
                },
                {
                  key: 'forecastRate',
                  label: 'Forecast',
                  align: 'right',
                  render: (r) => <span className="text-primary">${r.forecastRate.toFixed(2)}/MT</span>,
                },
                {
                  key: 'trend',
                  label: 'Trend',
                  align: 'center',
                  render: (r) => <TrendIndicator trend={r.trend} />,
                },
                {
                  key: 'risk',
                  label: 'Risk',
                  align: 'center',
                  render: (r) => <RiskBadge level={r.risk} size="sm" />,
                },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard title="Port Status">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ports.map((port) => (
              <PortCard key={port.id} port={port} />
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Market Insights */}
      <SectionCard title="Market Insights">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
