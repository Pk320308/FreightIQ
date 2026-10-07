'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Anchor,
  Clock,
  AlertTriangle,
  Activity,
  Ship,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dataStore } from '@/lib/data-store';
import { PortInfo } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface CongestionMetric {
  port: PortInfo;
  waitingVessels: number;
  avgWaitHours: number;
  berthOccupancyPct: number;
  estDemurrageUSDPerDay: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  forecastDaysWait: number;
  keyBottleneck: string;
  recommendedAction: string;
}

export default function PortCongestionPage() {
  const [ports, setPorts] = useState<PortInfo[]>(dataStore.getPorts());
  const [filterType, setFilterType] = useState<'all' | 'discharge' | 'loading'>('discharge');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVesselHireRate, setSelectedVesselHireRate] = useState<number>(28000); // $28k/day standard Capesize/Panamax
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setPorts(dataStore.getPorts());
    });
    return unsub;
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 600);
  };

  // Generate deterministic congestion data based on port properties
  const congestionData: CongestionMetric[] = useMemo(() => {
    return ports.map(port => {
      const isHighCongestion = port.congestion === 'high';
      const isMediumCongestion = port.congestion === 'medium';
      
      // Calculate realistic metrics
      const waitingVessels = port.waitingVessels || (isHighCongestion ? 14 : isMediumCongestion ? 7 : 2);
      const avgWaitHours = port.averageWaitTime ? port.averageWaitTime * 24 : (isHighCongestion ? 76 : isMediumCongestion ? 34 : 12);
      const berthOccupancyPct = isHighCongestion ? 94 : isMediumCongestion ? 78 : 52;
      const estDemurrageUSDPerDay = Math.round((avgWaitHours / 24) * selectedVesselHireRate);
      
      const forecastDaysWait = Number((avgWaitHours / 24).toFixed(1));
      
      let keyBottleneck = 'Mechanized conveyor maintenance & tidal window';
      let recommendedAction = 'Maintain scheduled laycan window';
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';

      if (port.name.includes('Paradip')) {
        keyBottleneck = 'Deep draft coal berth queue & rail rake supply';
        recommendedAction = 'Pre-book mechanized berth or divert to Dhamra for Capesize';
        trend = 'increasing';
      } else if (port.name.includes('Haldia')) {
        keyBottleneck = 'Severe draft restriction (<8.5m) requiring Sagar transhipment';
        recommendedAction = 'Lighter cargo at Sandheads or route via Dhamra deepwater';
        trend = 'stable';
      } else if (port.name.includes('Visakhapatnam')) {
        keyBottleneck = 'Inner harbor beam limitation (32.5m)';
        recommendedAction = 'Utilize Outer Harbor General Cargo Berth (GCB)';
        trend = 'decreasing';
      } else if (port.name.includes('Dhamra')) {
        keyBottleneck = 'Minimal queue - rapid conveyor discharge';
        recommendedAction = 'Recommended priority discharge terminal for Capesize coal';
        trend = 'stable';
      } else if (port.name.includes('Newcastle')) {
        keyBottleneck = 'PWCS terminal ship loader maintenance';
        recommendedAction = 'Coordinate 10-day advance notice of arrival with Port Authority';
        trend = 'increasing';
      }

      return {
        port,
        waitingVessels,
        avgWaitHours,
        berthOccupancyPct,
        estDemurrageUSDPerDay,
        trend,
        forecastDaysWait,
        keyBottleneck,
        recommendedAction
      };
    });
  }, [ports, selectedVesselHireRate]);

  const filteredMetrics = useMemo(() => {
    return congestionData
      .filter(item => {
        if (filterType !== 'all' && item.port.portType !== filterType) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return item.port.name.toLowerCase().includes(q) || item.port.country.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => b.avgWaitHours - a.avgWaitHours);
  }, [congestionData, filterType, searchQuery]);

  // Aggregate stats
  const totalWaiting = filteredMetrics.reduce((sum, m) => sum + m.waitingVessels, 0);
  const avgWaitOverall = filteredMetrics.length ? Math.round(filteredMetrics.reduce((sum, m) => sum + m.avgWaitHours, 0) / filteredMetrics.length) : 0;
  const criticalPortsCount = filteredMetrics.filter(m => m.port.congestion === 'high').length;
  const totalEstimatedDemurrageRisk = filteredMetrics.reduce((sum, m) => sum + m.estDemurrageUSDPerDay, 0);

  // Chart data for top congested ports
  const chartData = filteredMetrics.slice(0, 8).map(m => ({
    name: m.port.name.split(' ')[0],
    fullName: m.port.name,
    waitHours: m.avgWaitHours,
    vessels: m.waitingVessels,
    occupancy: m.berthOccupancyPct,
    congestion: m.port.congestion
  }));

  const getCongestionColor = (level: string) => {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Port Congestion & Anchorage Queue Monitor</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Real-time queue tracking, berth occupancy, and demurrage loss mitigation across East Coast India & Overseas Load Ports
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-muted-foreground block">Live Telemetry Synced</span>
            <span className="text-xs font-mono font-medium text-foreground">{lastRefreshed.toLocaleTimeString()}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-background/80"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Vessels in Queue</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalWaiting} Vessels</h3>
              <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 inline" /> {criticalPortsCount} ports in critical status
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Ship className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Average Port Wait Time</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{avgWaitOverall} Hours</h3>
              <p className="text-xs text-muted-foreground mt-1">≈ {(avgWaitOverall / 24).toFixed(1)} Days turnaround delay</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daily Demurrage Exposure</p>
              <h3 className="text-2xl font-bold text-rose-500 mt-1">${(totalEstimatedDemurrageRisk / 1000).toFixed(0)}k / Day</h3>
              <p className="text-xs text-muted-foreground mt-1">Based on ${selectedVesselHireRate.toLocaleString()}/day hire rate</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operational Port Health</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">
                {Math.round(((filteredMetrics.length - criticalPortsCount) / (filteredMetrics.length || 1)) * 100)}%
              </h3>
              <p className="text-xs text-emerald-500 mt-1">Normal berth clearance velocity</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Queue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/70 backdrop-blur border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" /> Port Waiting Hours Comparison
                </CardTitle>
                <CardDescription className="text-xs">
                  Anchorage waiting time before pilot boarding and berth allocation (Hours)
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                East Coast India & Global Load Ports
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} unit="h" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover/95 backdrop-blur p-3 rounded-lg border border-border shadow-xl text-xs space-y-1">
                            <p className="font-bold text-foreground">{data.fullName}</p>
                            <p className="text-muted-foreground">Waiting Time: <span className="font-bold text-foreground">{data.waitHours} hrs ({(data.waitHours / 24).toFixed(1)} days)</span></p>
                            <p className="text-muted-foreground">Vessels in Queue: <span className="font-bold text-foreground">{data.vessels} vessels</span></p>
                            <p className="text-muted-foreground">Berth Occupancy: <span className="font-bold text-foreground">{data.occupancy}%</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="waitHours" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCongestionColor(entry.congestion)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Demurrage Calculator Tool */}
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-500" /> Demurrage Exposure Calculator
            </CardTitle>
            <CardDescription className="text-xs">
              Simulate delay penalty costs against contractual laytime
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Vessel Daily Charter Hire ($/Day)</label>
              <div className="flex gap-2">
                {[18000, 28000, 38000].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setSelectedVesselHireRate(rate)}
                    className={`flex-1 py-1.5 px-2 rounded border text-center transition-all ${
                      selectedVesselHireRate === rate
                        ? 'bg-primary text-primary-foreground border-primary font-bold'
                        : 'bg-background/50 border-border hover:bg-muted'
                    }`}
                  >
                    ${(rate / 1000)}k/d {rate === 18000 ? 'Supramax' : rate === 28000 ? 'Panamax' : 'Capesize'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-muted/40 rounded-lg border border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paradip Delay (3.2d):</span>
                <span className="font-bold text-rose-500">${Math.round(3.2 * selectedVesselHireRate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Haldia Delay (2.2d):</span>
                <span className="font-bold text-amber-500">${Math.round(2.2 * selectedVesselHireRate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dhamra Delay (0.5d):</span>
                <span className="font-bold text-emerald-500">${Math.round(0.5 * selectedVesselHireRate).toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
                <span>Dhamra vs Paradip Savings:</span>
                <span className="text-emerald-500">${Math.round(2.7 * selectedVesselHireRate).toLocaleString()} / voyage</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>SIH Recommendation:</strong> Multi-voyage charter contracts should mandate Dhamra or Krishnapatnam discharge options during monsoon peak congestion (July-Sept) to eliminate demurrage liabilities.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search port or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card/60 h-9 text-xs"
            />
          </div>
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
            <button
              onClick={() => setFilterType('discharge')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${filterType === 'discharge' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground'}`}
            >
              India East Coast
            </button>
            <button
              onClick={() => setFilterType('loading')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${filterType === 'loading' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground'}`}
            >
              Overseas Load Ports
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-xs rounded-md transition-all ${filterType === 'all' ? 'bg-background shadow-sm text-foreground font-semibold' : 'text-muted-foreground'}`}
            >
              All Ports
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing <strong>{filteredMetrics.length}</strong> monitored maritime terminals
        </p>
      </div>

      {/* Detailed Port Congestion Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMetrics.map((item) => {
          const isHigh = item.port.congestion === 'high';
          const isMed = item.port.congestion === 'medium';

          return (
            <Card key={item.port.id} className="bg-card/70 backdrop-blur border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-base">{item.port.name}</h3>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {item.port.portType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {item.port.country}
                    </p>
                  </div>
                  <Badge 
                    className={`text-[11px] font-semibold ${
                      isHigh ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                      isMed ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}
                    variant="outline"
                  >
                    {item.port.congestion.toUpperCase()} CONGESTION
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3.5 text-xs">
                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/50 text-center">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Queue</span>
                    <span className="font-bold text-sm text-foreground">{item.waitingVessels} ships</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Avg Wait</span>
                    <span className="font-bold text-sm text-foreground">{item.avgWaitHours}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Occupancy</span>
                    <span className="font-bold text-sm text-foreground">{item.berthOccupancyPct}%</span>
                  </div>
                </div>

                {/* Progress bar for occupancy */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Berth Utilization</span>
                    <span className="font-mono font-medium">{item.berthOccupancyPct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.berthOccupancyPct > 85 ? 'bg-rose-500' :
                        item.berthOccupancyPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} 
                      style={{ width: `${item.berthOccupancyPct}%` }}
                    />
                  </div>
                </div>

                {/* Handling Rate & Draft */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>Handling Rate: <span className="text-foreground font-medium">{item.port.cargoHandlingRate.toLocaleString()} MT/d</span></div>
                  <div>Max Draft: <span className="text-foreground font-medium">{item.port.maxDraft} m</span></div>
                </div>

                {/* Bottleneck & Action */}
                <div className="space-y-1.5 pt-1 border-t border-border">
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground block uppercase">Primary Bottleneck:</span>
                    <p className="text-foreground text-[11px]">{item.keyBottleneck}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-500 block uppercase">Action Recommendation:</span>
                    <p className="text-muted-foreground text-[11px]">{item.recommendedAction}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
