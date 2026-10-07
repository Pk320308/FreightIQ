'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { PageHeader, SectionCard, LoadingState } from '@/components/freightiq/common';
import { KpiCard } from '@/components/freightiq/kpi-card';
import { TrendIndicator } from '@/components/freightiq/trend-indicator';
import { InsightCard } from '@/components/freightiq/insight-card';
import { api } from '@/lib/api';
import type { MarketInsight, FreightRatePoint, RouteInfo } from '@/lib/types';

const vesselAvailabilityData = [
  { type: 'Handysize', available: 14, onVoyage: 8, maintenance: 2 },
  { type: 'Supramax', available: 18, onVoyage: 12, maintenance: 3 },
  { type: 'Panamax', available: 22, onVoyage: 15, maintenance: 4 },
  { type: 'Capesize', available: 9, onVoyage: 11, maintenance: 2 },
];

const supplyDemandData = [
  { month: 'May', supply: 320, demand: 280 },
  { month: 'Jun', supply: 315, demand: 295 },
  { month: 'Jul', supply: 310, demand: 310 },
  { month: 'Aug', supply: 305, demand: 325 },
  { month: 'Sep', supply: 300, demand: 340 },
  { month: 'Oct', supply: 298, demand: 355 },
];

const fuelPriceData = [
  { date: 'Jul', ifo380: 545, mgo: 780, vlsfo: 595 },
  { date: 'Aug', ifo380: 560, mgo: 795, vlsfo: 610 },
  { date: 'Sep', ifo380: 580, mgo: 810, vlsfo: 625 },
  { date: 'Oct', ifo380: 575, mgo: 805, vlsfo: 620 },
];

import {
  marketInsights as mockInsights,
  freightRateData,
  routes as mockRoutes,
} from '@/lib/mock-data';

export default function MarketAnalysisPage() {
  const [insights, setInsights] = useState<MarketInsight[]>(mockInsights);
  const [rateData, setRateData] = useState<FreightRatePoint[]>(freightRateData);
  const [routes, setRoutes] = useState<RouteInfo[]>(mockRoutes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getMarketInsights(), api.getFreightRateData(), api.getRoutes()]).then(
      ([ins, rates, rts]) => {
        setInsights(ins);
        setRateData(rates);
        setRoutes(rts);
      },
    );
  }, []);

  const chartData = rateData
    .filter((d) => d.historical !== null)
    .map((d) => ({ date: d.date, rate: d.historical }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Analysis"
        subtitle="Comprehensive freight market analysis with supply-demand dynamics and vessel availability"
      />

      {/* Market KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="BDI (Baltic Dry Index)" value="1,284">
          <TrendIndicator trend="increasing" value="+3.2%" />
        </KpiCard>
        <KpiCard label="Panamax Index" value="1,456">
          <TrendIndicator trend="increasing" value="+5.1%" />
        </KpiCard>
        <KpiCard label="Capesize Index" value="2,108">
          <TrendIndicator trend="decreasing" value="-1.4%" />
        </KpiCard>
        <KpiCard label="Supramax Index" value="1,125">
          <TrendIndicator trend="increasing" value="+2.8%" />
        </KpiCard>
      </div>

      {/* Rate Trend + Supply Demand */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Freight Rate Trend (Historical)">
          <div className="glass rounded-xl border border-border/50 p-5">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="rateArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(222 44% 9%)', border: '1px solid hsl(222 30% 20%)', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => [`$${v.toFixed(2)}/MT`, 'Freight Rate']}
                />
                <Area type="monotone" dataKey="rate" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#rateArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Supply vs Demand (MT Millions)">
          <div className="glass rounded-xl border border-border/50 p-5">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={supplyDemandData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(222 44% 9%)', border: '1px solid hsl(222 30% 20%)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
                <Bar dataKey="supply" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Supply" />
                <Bar dataKey="demand" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Demand" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Vessel Availability + Fuel Prices */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Vessel Availability by Type">
          <div className="glass rounded-xl border border-border/50 p-5">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={vesselAvailabilityData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" horizontal={false} />
                <XAxis type="number" stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="type" stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(222 44% 9%)', border: '1px solid hsl(222 30% 20%)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
                <Bar dataKey="available" stackId="a" fill="hsl(var(--chart-2))" name="Available" radius={[0, 0, 0, 0]} />
                <Bar dataKey="onVoyage" stackId="a" fill="hsl(var(--chart-1))" name="On Voyage" />
                <Bar dataKey="maintenance" stackId="a" fill="hsl(var(--chart-4))" name="Maintenance" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Bunker Fuel Prices ($/MT)">
          <div className="glass rounded-xl border border-border/50 p-5">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={fuelPriceData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 20%)" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(215 20% 50%)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(222 44% 9%)', border: '1px solid hsl(222 30% 20%)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend formatter={(v) => <span className="text-xs text-muted-foreground uppercase">{v}</span>} />
                <Line type="monotone" dataKey="ifo380" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} name="IFO 380" />
                <Line type="monotone" dataKey="mgo" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} name="MGO" />
                <Line type="monotone" dataKey="vlsfo" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} name="VLSFO" />
              </LineChart>
            </ResponsiveContainer>
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
