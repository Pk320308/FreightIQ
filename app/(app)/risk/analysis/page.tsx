'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import { AlertTriangle, TrendingUp, Bell, ShieldAlert, CheckCircle2, Clock, MapPin, Sparkles, Filter, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/freightiq/common';
import { KpiCard } from '@/components/freightiq/kpi-card';
import { RiskBadge } from '@/components/freightiq/risk-badge';
import { RiskFactorCard } from '@/components/freightiq/risk-factor-card';
import { api } from '@/lib/api';
import type { RiskFactor, RiskTrendPoint, EarlyWarningAlert } from '@/lib/types';
import { dataStore } from '@/lib/data-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { riskFactors as mockRiskFactors, riskTrendData } from '@/lib/mock-data';

export default function RiskAnalysisPage() {
  const [factors, setFactors] = useState<RiskFactor[]>(mockRiskFactors);
  const [trend, setTrend] = useState<RiskTrendPoint[]>(riskTrendData);
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>(dataStore.getEarlyWarnings());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.getRiskFactors(), api.getRiskTrend()]).then(([f, t]) => {
      setFactors(f);
      setTrend(t);
    });

    const unsub = dataStore.subscribe(() => {
      setAlerts(dataStore.getEarlyWarnings());
    });
    return unsub;
  }, []);

  const overallRisk = factors.reduce((acc, f) => acc + f.percentage, 0) / factors.length;

  const radialData = [{ name: 'Overall Risk', value: Math.round(overallRisk), fill: 'hsl(var(--chart-4))' }];

  const filteredAlerts = useMemo(() => {
    if (selectedCategory === 'all') return alerts;
    return alerts.filter((a) => a.category === selectedCategory);
  }, [alerts, selectedCategory]);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Predictive Risk & Early Warning Control Center"
        subtitle="Multi-hazard maritime intelligence covering freight volatility, East Coast port congestion, weather patterns, and idle time"
      />

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Freight Market Volatility" value="Medium (14%)" risk="medium" />
        <KpiCard label="East Coast Congestion" value="High (3.2d wait)" risk="high" />
        <KpiCard label="VLSFO Bunker Risk" value="Low ($620/MT)" risk="low" />
        <KpiCard label="Bay of Bengal Weather" value="Medium (Trough)" risk="medium" />
        <KpiCard label="Early Warnings Active" value={`${criticalCount + warningCount} Signals`} risk={criticalCount > 0 ? 'high' : 'medium'} />
      </div>

      {/* Early Warning Alert Center (SIH26006 Core) */}
      <Card className="bg-card/70 backdrop-blur border-border">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <CardTitle className="text-base font-bold">Maritime Early Warning Alert System</CardTitle>
                <Badge className="bg-rose-500 text-white font-bold text-[10px]">
                  {criticalCount} CRITICAL
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Automated threshold monitoring across trade corridors, port bathymetry, and charter laycan limits
              </CardDescription>
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1 bg-muted/50 p-1 rounded-lg border border-border">
              {['all', 'freight_market', 'port_congestion', 'weather_disruption', 'vessel_idle', 'market_entry_window'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[11px] rounded-md capitalize transition-all ${
                    selectedCategory === cat
                      ? 'bg-background shadow-sm text-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {filteredAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No alerts for this category.</p>
          ) : (
            filteredAlerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-muted/30 border-border'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] uppercase font-bold ${
                            isCritical ? 'bg-rose-500 text-white' :
                            isWarning ? 'bg-amber-500 text-black' :
                            'bg-blue-500 text-white'
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                        <h4 className="font-bold text-sm text-foreground">{alert.title}</h4>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono">
                          {alert.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
                        {alert.message}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono block">{alert.timestamp}</span>
                    </div>
                  </div>

                  {/* Action Required Box */}
                  <div className="mt-2.5 pt-2 border-t border-border/50 flex items-start gap-2 text-xs">
                    <span className="text-[11px] font-bold text-primary shrink-0">Required Mitigation:</span>
                    <span className="text-muted-foreground text-[11px]">{alert.actionRequired}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Risk Trend + Overall Score */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionCard
            title="Composite Risk Trend Analysis (6-Month Trajectory)"
            action={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {['freight', 'congestion', 'fuel', 'weather', 'vesselSupply'].map((k, i) => (
                  <span key={k} className="inline-flex items-center gap-1.5 capitalize">
                    <span className="h-2 w-2 rounded-full" style={{ background: `hsl(var(--chart-${i + 1}))` }} />
                    {k.replace(/([A-Z])/g, ' $1')}
                  </span>
                ))}
              </div>
            }
          >
            <div className="glass rounded-xl border border-border/50 p-5">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="freight" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Freight Volatility" />
                  <Line type="monotone" dataKey="congestion" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Port Congestion" />
                  <Line type="monotone" dataKey="fuel" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} name="Bunker Fuel" />
                  <Line type="monotone" dataKey="weather" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} name="Weather Disruption" />
                  <Line type="monotone" dataKey="vesselSupply" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} name="Vessel Supply" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Macro Risk Exposure Index">
          <div className="glass rounded-xl border border-border/50 p-5">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart innerRadius="65%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-28 text-center">
              <p className="text-3xl font-bold text-foreground">{Math.round(overallRisk)}%</p>
              <p className="mt-1 text-xs text-muted-foreground">Composite Risk Index</p>
            </div>
            <div className="mt-14 flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <RiskBadge level="medium" />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Risk is trending upward. Primary drivers: East Coast coal berth queues and Q4 freight rate firming.
            </p>
          </div>
        </SectionCard>
      </div>

      {/* Risk Factor Cards */}
      <SectionCard title="Individual Risk Factor Decomposition">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {factors.map((factor, i) => (
            <RiskFactorCard key={i} {...factor} />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
