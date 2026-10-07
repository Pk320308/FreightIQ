'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Anchor,
  Ship,
  TrendingDown,
  Navigation,
  Compass,
  DollarSign,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  CheckCircle2,
  Share2,
  Download,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dataStore } from '@/lib/data-store';
import { IdleScenario, VesselType } from '@/lib/types';
import { evaluateIdleAndRepositioning } from '@/lib/maritime-engine';

export default function IdleManagementPage() {
  const [scenarios, setScenarios] = useState<IdleScenario[]>(dataStore.getIdleScenarios());
  const [selectedScenario, setSelectedScenario] = useState<IdleScenario | null>(null);

  // Simulation controls for interactive scenario analysis
  const [simVesselType, setSimVesselType] = useState<VesselType>('Capesize');
  const [simDischargePort, setSimDischargePort] = useState<string>('Paradip');
  const [simIdleDays, setSimIdleDays] = useState<number>(7);
  const [simFuelPriceUSD, setSimFuelPriceUSD] = useState<number>(620); // VLSFO per MT

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setScenarios(dataStore.getIdleScenarios());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scenarios.length > 0 && !selectedScenario) {
      setSelectedScenario(scenarios[0]);
    }
  }, [scenarios, selectedScenario]);

  // Live simulation calculated via maritime-engine
  const liveSimResult = useMemo(() => {
    return evaluateIdleAndRepositioning({
      vesselType: simVesselType,
      dischargePort: simDischargePort,
      expectedIdleDays: simIdleDays,
    });
  }, [simVesselType, simDischargePort, simIdleDays]);

  // Aggregate stats across active fleet
  const totalIdleDays = scenarios.reduce((sum, s) => sum + s.expectedIdleDays, 0);
  const totalIdleCost = scenarios.reduce((sum, s) => sum + s.totalIdleCostUSD, 0);
  const totalPotentialSavings = scenarios.reduce((sum, s) => sum + s.netSavingsUSD, 0);
  const totalDeadheadReductionNM = scenarios.reduce((sum, s) => sum + Math.round(s.deadheadDistanceNM * 0.4), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Fleet Idle-Time Reduction & Triangulated Positioning</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Proactive alternative employment corridors, ballast deadhead minimization, and post-discharge turnaround optimization
              </p>
            </div>
          </div>
        </div>

        <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border-emerald-500/30 self-start md:self-auto">
          SIH26006 Core Engine Active
        </Badge>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Fleet Idle Days</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalIdleDays} Days</h3>
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 inline" /> Post-discharge waiting on East Coast
              </p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Idle Cost Drain</p>
              <h3 className="text-2xl font-bold text-rose-500 mt-1">${(totalIdleCost / 1000).toFixed(0)}k USD</h3>
              <p className="text-xs text-muted-foreground mt-1">Capital holding & berth demurrage</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Optimization Net Savings</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">+${(totalPotentialSavings / 1000).toFixed(0)}k USD</h3>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 inline" /> Via backhaul & triangle routing
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ballast Deadhead Cut</p>
              <h3 className="text-2xl font-bold text-blue-400 mt-1">{totalDeadheadReductionNM.toLocaleString()} NM</h3>
              <p className="text-xs text-muted-foreground mt-1">Direct bunker fuel savings</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Navigation className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Interactive Simulator & Live Fleet Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Repositioning Simulator */}
        <Card className="bg-card/70 backdrop-blur border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Repositioning Simulator
            </CardTitle>
            <CardDescription className="text-xs">
              Test alternative cargo corridors from Indian East Coast discharge ports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Vessel Class</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Capesize', 'Panamax', 'Supramax'] as VesselType[]).map((vt) => (
                  <button
                    key={vt}
                    onClick={() => setSimVesselType(vt)}
                    className={`py-1.5 px-2 rounded border text-center font-medium transition-all ${
                      simVesselType === vt
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background/60 border-border hover:bg-muted'
                    }`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Discharge Port on East Coast India</label>
              <select
                value={simDischargePort}
                onChange={(e) => setSimDischargePort(e.target.value)}
                className="w-full bg-background/80 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Paradip">Paradip Port (OD)</option>
                <option value="Visakhapatnam">Visakhapatnam Port (AP)</option>
                <option value="Dhamra">Dhamra Port (OD)</option>
                <option value="Gangavaram">Gangavaram Port (AP)</option>
                <option value="Haldia">Haldia Port (WB)</option>
                <option value="Krishnapatnam">Krishnapatnam Port (AP)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-muted-foreground font-medium">Post-Discharge Idle Lag</label>
                <span className="font-bold text-foreground">{simIdleDays} Days</span>
              </div>
              <input
                type="range"
                min="2"
                max="14"
                value={simIdleDays}
                onChange={(e) => setSimIdleDays(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
            </div>

            {/* Live Calculated Output Box */}
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase text-emerald-400">Recommended Corridor</span>
                <Badge className="bg-emerald-500 text-black font-bold text-[10px]">
                  Optimal
                </Badge>
              </div>

              <div>
                <p className="font-bold text-sm text-foreground">{liveSimResult.recommendedRepositioning}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Route: {liveSimResult.alternativeRoute}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/20">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Deadhead Ballast:</span>
                  <span className="font-bold text-foreground">{liveSimResult.deadheadDistanceNM} NM</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Bunker Fuel Cost:</span>
                  <span className="font-bold text-foreground">${liveSimResult.deadheadFuelCostUSD.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Idle Saved:</span>
                  <span className="font-bold text-emerald-400">+{liveSimResult.estimatedIdleReductionDays} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Net Turnaround Benefit:</span>
                  <span className="font-bold text-emerald-400">+${liveSimResult.netSavingsUSD.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Monitored Fleet Scenarios Table & Cards */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card/70 backdrop-blur border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Ship className="w-4 h-4 text-primary" /> Active Fleet Turnaround Watchlist
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Vessels currently discharging or completing discharge on the East Coast of India
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs self-start sm:self-auto font-mono">
                  {scenarios.length} Tracked Vessels
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {scenarios.map((sc) => {
                const isSelected = selectedScenario?.id === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-sm'
                        : 'bg-muted/30 border-border hover:bg-muted/60 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-sm text-foreground">{sc.vesselName}</h4>
                          <Badge variant="outline" className="text-[10px]">
                            {sc.vesselType}
                          </Badge>
                          <Badge 
                            className={`text-[10px] ${
                              sc.idleRisk === 'high' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                              'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                            variant="outline"
                          >
                            {sc.expectedIdleDays}d Idle Risk ({sc.idleRisk.toUpperCase()})
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Anchor className="w-3.5 h-3.5 text-blue-400" />
                          <span>Discharging at: <strong className="text-foreground">{sc.dischargePort}</strong></span>
                          <span>•</span>
                          <span>Position: {sc.currentPosition}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">Net Optimization Gain</span>
                          <span className="text-sm font-bold text-emerald-500 font-mono">
                            +${sc.netSavingsUSD.toLocaleString()}
                          </span>
                        </div>
                        <Button size="sm" variant={isSelected ? 'default' : 'outline'} className="text-xs h-8">
                          {isSelected ? 'Selected' : 'Inspect'}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable / Selected Details */}
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-background/50 rounded-lg border border-border">
                        <span className="text-[10px] uppercase font-semibold text-rose-400 block mb-1">
                          Default Reactive Deadhead (Baseline)
                        </span>
                        <p className="text-muted-foreground text-[11px] leading-relaxed">
                          Steams empty {sc.deadheadDistanceNM} NM ballast to {sc.nextCargoLocation}. Incurs ${(sc.totalIdleCostUSD / 1000).toFixed(0)}k USD waiting & fuel losses.
                        </p>
                      </div>

                      <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-1">
                          FreightIQ Triangulated Solution
                        </span>
                        <p className="text-foreground text-[11px] font-medium leading-relaxed">
                          {sc.recommendedRepositioning} ({sc.alternativeRoute}). Cuts idle by {sc.estimatedIdleReductionDays} days.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
