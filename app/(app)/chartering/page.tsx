'use client';

import { useState, useEffect } from 'react';
import {
  Ship,
  Anchor,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Download,
  FileText,
  HelpCircle,
  Calendar,
  Layers,
  Fuel,
  Info,
  ChevronRight,
  Activity,
  Gauge,
  RotateCcw,
} from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/freightiq/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  evaluateDualPortVesselMatching,
  evaluateMultipleVoyageContractStrategy,
  evaluateIdleAndRepositioning,
  calculateMarketEntryWindow,
  type MultipleVoyageContractComparison,
} from '@/lib/maritime-engine';
import { dataStore } from '@/lib/data-store';
import { useAuth } from '@/lib/auth-context';
import type {
  CargoType,
  VesselType,
  VesselMatchResult,
  MarketEntryRecommendation,
  IdleScenario,
} from '@/lib/types';
import Link from 'next/link';

const cargoTypes: CargoType[] = ['Coal', 'Iron Ore', 'Steel', 'Other Bulk Cargo'];
const vesselTypes: VesselType[] = ['Panamax', 'Capesize', 'Supramax', 'Handysize'];

export default function CentralCharteringWorkspace() {
  const { role, can } = useAuth();

  // Master Inputs
  const [cargoType, setCargoType] = useState<CargoType>('Coal');
  const [cargoQuantity, setCargoQuantity] = useState('75000');
  const [annualDemand, setAnnualDemand] = useState('450000');
  const [originPort, setOriginPort] = useState('Newcastle');
  const [destinationPort, setDestinationPort] = useState('Visakhapatnam');
  const [targetArrivalDate, setTargetArrivalDate] = useState('2026-11-15');
  const [preferredVessel, setPreferredVessel] = useState<VesselType>('Panamax');
  const [fuelPrice, setFuelPrice] = useState('580');

  // Dynamic Options from DataStore
  const [loadingPortsList, setLoadingPortsList] = useState<string[]>([]);
  const [dischargePortsList, setDischargePortsList] = useState<string[]>([]);

  // Simulation / Analysis Results State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vesselMatches, setVesselMatches] = useState<VesselMatchResult[]>([]);
  const [marketEntry, setMarketEntry] = useState<MarketEntryRecommendation | null>(null);
  const [contractComparison, setContractComparison] = useState<MultipleVoyageContractComparison | null>(null);
  const [idleScenario, setIdleScenario] = useState<IdleScenario | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const allPorts = dataStore.getPorts();
    const lPorts = allPorts.filter((p) => p.portType === 'loading').map((p) => p.name);
    const dPorts = allPorts.filter((p) => p.portType === 'discharge').map((p) => p.name);

    setLoadingPortsList(lPorts.length ? lPorts : ['Newcastle', 'Gladstone', 'Hay Point / Dalrymple Bay', 'Baltimore / Norfolk', 'Maputo / Beira', 'Muara Pantai / Tanjung Bara']);
    setDischargePortsList(dPorts.length ? dPorts : ['Visakhapatnam', 'Paradip', 'Gangavaram', 'Dhamra', 'Gopalpur', 'Haldia', 'Sagar-Sandheads']);

    // Run Initial Assessment
    runComprehensiveAnalysis();
  }, []);

  const runComprehensiveAnalysis = () => {
    setIsAnalyzing(true);
    const qty = parseFloat(cargoQuantity) || 75000;
    const annDemand = parseFloat(annualDemand) || 450000;
    const bunker = parseFloat(fuelPrice) || 580;

    // 1. Dual-Port Vessel Matching & Turnaround (SIH Change #1, #2, #3)
    const matches = evaluateDualPortVesselMatching({
      cargoQuantity: qty,
      originPort,
      destinationPort,
      cargoType,
      fuelPrice: bunker,
    });
    setVesselMatches(matches);

    // 2. Market Entry Timing Recommendation (SIH Change #9, #17, #18)
    const entry = calculateMarketEntryWindow({
      currentRate: 27.40,
      forecast30d: 29.10,
      forecast60d: 29.98,
      route: `${originPort} → ${destinationPort}`,
      vesselType: preferredVessel,
      cargoQuantity: qty,
    });
    setMarketEntry(entry);

    // 3. Spot vs Short-Term 3M vs Medium-Term 6M Multi-Voyage Contracts (SIH Change #10, #11)
    const contract = evaluateMultipleVoyageContractStrategy({
      cargoQuantityMT: qty,
      annualDemandMT: annDemand,
      vesselType: preferredVessel,
      originPort,
      destinationPort,
      currentSpotFreightPerMT: 27.40,
    });
    setContractComparison(contract);

    // 4. Idle Scenario & Alternative Employment Engine (SIH Change #4, #5, #6)
    const idle = evaluateIdleAndRepositioning({
      dischargePort: destinationPort,
      vesselType: preferredVessel,
      expectedIdleDays: destinationPort === 'Paradip' ? 4.5 : destinationPort === 'Haldia' ? 5.5 : 2.0,
    });
    setIdleScenario(idle);

    setTimeout(() => {
      setIsAnalyzing(false);
    }, 250);
  };

  const handleSaveToAuditHistory = () => {
    if (!contractComparison) return;
    dataStore.addRecommendationHistory({
      cargoType,
      quantityMT: parseFloat(cargoQuantity) || 75000,
      originPort,
      destinationPort,
      recommendedVessel: preferredVessel,
      recommendedStrategy: contractComparison.recommendedOption,
      estimatedTotalCostUSD: contractComparison.options.shortTerm3M.totalLandedCost,
      costPerMT: contractComparison.options.shortTerm3M.costPerMT,
      estimatedSavingsUSD: contractComparison.expectedAnnualSavingsUSD,
      reasons: [
        `Dual port compatibility validated for ${originPort} & ${destinationPort}`,
        `Market Entry Window: ${marketEntry?.entryWindow} recommended due to forecast surge`,
        contractComparison.executiveRationale,
      ],
      status: 'accepted',
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const bestVessel = vesselMatches.find((v) => v.suitability === 'recommended') || vesselMatches.find((v) => v.suitability === 'suitable') || vesselMatches[0];

  return (
    <div className="space-y-6">
      {/* Top Banner: SIH Positioning */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary border-primary/40 text-[11px] font-bold px-2.5 py-0.5">
              SIH26006 Central Decision Engine
            </Badge>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Activity className="h-3 w-3 text-success" /> Multi-Voyage Optimization Live
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight">
            Intelligent Chartering Decision Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Transitioning reactive daily spot procurement into proactive multi-voyage charters with dual-port bathymetry, turn-around turnaround calculation, idle minimization, and AI forecast integration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/recommendations">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 font-semibold">
              <FileText className="h-3.5 w-3.5" /> Decision History
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="default" size="sm" className="text-xs gap-1.5 h-9 font-bold shadow-md shadow-primary/20">
              <Download className="h-3.5 w-3.5" /> Decision Report
            </Button>
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl border bg-success/15 border-success/40 text-success text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> Recommendation successfully saved to Enterprise Audit Log!
        </div>
      )}

      {/* --- MASTER INPUT PANEL --- */}
      <SectionCard title="1. Consignment & Route Parameters">
        <div className="glass rounded-xl p-5 border border-border/50 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Cargo Commodity</label>
              <Select value={cargoType} onValueChange={(v: any) => setCargoType(v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cargoTypes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Parcel Quantity (MT)</label>
              <Input
                type="number"
                value={cargoQuantity}
                onChange={(e) => setCargoQuantity(e.target.value)}
                className="h-9 text-xs font-mono"
                placeholder="75000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Loading Port (Overseas Origin)</label>
              <Select value={originPort} onValueChange={setOriginPort}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {loadingPortsList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Discharge Port (East Coast India)</label>
              <Select value={destinationPort} onValueChange={setDestinationPort}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {dischargePortsList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Annual Plant Demand (MT)</label>
              <Input
                type="number"
                value={annualDemand}
                onChange={(e) => setAnnualDemand(e.target.value)}
                className="h-9 text-xs font-mono"
                placeholder="450000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Target Delivery Laycan</label>
              <Input
                type="date"
                value={targetArrivalDate}
                onChange={(e) => setTargetArrivalDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">Preferred Vessel Class</label>
              <Select value={preferredVessel} onValueChange={(v: any) => setPreferredVessel(v)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vesselTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={runComprehensiveAnalysis}
                disabled={isAnalyzing}
                className="w-full h-9 font-bold text-xs gap-2 shadow-md shadow-primary/20"
              >
                <Sparkles className="h-4 w-4" /> {isAnalyzing ? 'Optimizing Parameters...' : 'Analyze Strategic Charter'}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* --- SECTION 2: AI FORECAST & OPTIMAL MARKET ENTRY TIMING --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Curve */}
        <div className="lg:col-span-2">
          <SectionCard title="2. AI Freight Forecast & Volatility Horizon">
            <div className="glass rounded-xl p-5 border border-border/50 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                  <p className="text-[11px] text-muted-foreground">Current Spot Rate</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">$27.40 <span className="text-xs font-normal">/ MT</span></p>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground mt-1">Live Benchmark</Badge>
                </div>
                <div className="p-3 rounded-lg border border-primary/40 bg-primary/10">
                  <p className="text-[11px] text-primary font-semibold">30-Day Forecast</p>
                  <p className="text-lg font-bold text-primary mt-0.5">$29.10 <span className="text-xs font-normal">/ MT</span></p>
                  <span className="text-[10px] font-bold text-danger">+6.2% Upward</span>
                </div>
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                  <p className="text-[11px] text-muted-foreground">60-Day Horizon</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">$29.98 <span className="text-xs font-normal">/ MT</span></p>
                  <span className="text-[10px] font-bold text-danger">+9.4% Peak</span>
                </div>
                <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                  <p className="text-[11px] text-muted-foreground">Forecast Confidence</p>
                  <p className="text-lg font-bold text-success mt-0.5">84% <span className="text-xs font-normal font-semibold">HIGH</span></p>
                  <span className="text-[10px] text-muted-foreground">95% Conf. Bounds</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 text-xs text-foreground leading-relaxed flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">AI Forecasting Service Link:</span> Model forecasts a bullish rate breakout driven by Q4 Indian blast furnace feedstock replenishment and Newcastle terminal maintenance tightening vessel tonnage.
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Market Entry Timing Card (SIH Change #9, #17) */}
        <div>
          <SectionCard title="3. Optimal Market Entry Window">
            <div className="glass rounded-xl p-5 border border-border/50 space-y-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommended Window</span>
                  <Badge className="bg-success/20 text-success border-success/40 text-[11px] font-bold">
                    HIGH MOMENTUM
                  </Badge>
                </div>
                <p className="text-xl font-extrabold text-primary mt-2">
                  {marketEntry?.entryWindow || 'Next 7–10 Days'}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1">
                  Target Contract Execution by Oct 15, 2026
                </p>
              </div>

              <div className="p-3 rounded-lg border border-border/40 bg-background/50 space-y-2 text-xs">
                <p className="font-bold text-foreground">Strategic Rationale:</p>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  {marketEntry?.reason || 'Freight rates projected to increase +6.2% over next 30 days. Locking multi-voyage contracts now prevents an estimated $127k spot rate penalty.'}
                </p>
              </div>

              <div className="pt-1">
                <Badge variant="outline" className="w-full justify-center py-1 text-[11px] bg-primary/10 text-primary border-primary/30 font-bold">
                  Strategy: {marketEntry?.strategy || 'Lock 3-Month Multi-Voyage'}
                </Badge>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* --- SECTION 3: DUAL PORT VALIDATION & VESSEL MATCHING --- */}
      <SectionCard title="4. Dual-Port Bathymetry & Turnaround Matrix (Loading + Discharge Constraints)">
        <div className="glass rounded-xl border border-border/50 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                <th className="p-3.5">Vessel Class</th>
                <th className="p-3.5">Capacity / Scantling Draft</th>
                <th className="p-3.5">Loading Port ({originPort})</th>
                <th className="p-3.5">Discharge Port ({destinationPort})</th>
                <th className="p-3.5">Turnaround Port Stay</th>
                <th className="p-3.5">Compatibility Score</th>
                <th className="p-3.5">Estimated Rate</th>
                <th className="p-3.5">Suitability Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {vesselMatches.map((vm) => {
                const isLoadPass = vm.loadingPortCompatibility.compatible;
                const isDischPass = vm.dischargePortCompatibility.compatible;
                const isRecommended = vm.suitability === 'recommended';

                return (
                  <tr key={vm.vesselType} className={`transition-colors ${isRecommended ? 'bg-primary/10 font-medium' : 'hover:bg-muted/20'}`}>
                    <td className="p-3.5 font-bold flex items-center gap-2">
                      <Ship className={`h-4 w-4 ${isRecommended ? 'text-primary' : 'text-muted-foreground'}`} />
                      {vm.vesselType}
                      {isRecommended && <Badge className="bg-primary text-white text-[9px] px-1.5 py-0">BEST</Badge>}
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold">{vm.capacity.toLocaleString()} DWT</span>
                      <span className="text-muted-foreground block text-[11px]">{vm.draft}m draft / {vm.loa}m LOA</span>
                    </td>
                    <td className="p-3.5">
                      {isLoadPass ? (
                        <span className="inline-flex items-center gap-1 text-success font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Compatible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger font-semibold">
                          <XCircle className="h-3.5 w-3.5" /> Draft/LOA Exceeded
                        </span>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{vm.loadingPortCompatibility.reason}</p>
                    </td>
                    <td className="p-3.5">
                      {isDischPass ? (
                        <span className="inline-flex items-center gap-1 text-success font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Compatible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-danger font-semibold">
                          <XCircle className="h-3.5 w-3.5" /> Draft Exceeded ({destinationPort})
                        </span>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{vm.dischargePortCompatibility.reason}</p>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className="font-bold text-foreground">{vm.totalPortStayDays} days</span>
                      <span className="text-[10px] text-muted-foreground block">
                        ({vm.estimatedHandlingDays}d handling + {vm.estimatedBerthWaitDays}d wait)
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted/60 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full ${vm.compatibilityScore >= 90 ? 'bg-success' : vm.compatibilityScore >= 60 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${vm.compatibilityScore}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs font-mono">{vm.compatibilityScore}%</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-primary font-mono">
                      {vm.estimatedFreightRatePerMT > 0 ? `$${vm.estimatedFreightRatePerMT.toFixed(2)}/MT` : 'N/A'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isRecommended ? 'bg-primary text-white shadow-sm shadow-primary/30' :
                        vm.suitability === 'suitable' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                      }`}>
                        {vm.suitability === 'recommended' ? '🌟 Recommended' : vm.suitability === 'suitable' ? '✓ Suitable' : '✗ Incompatible'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* --- SECTION 4: SPOT VS SHORT-TERM VS MEDIUM-TERM MULTI-VOYAGE CONTRACTS --- */}
      {contractComparison && (
        <SectionCard title="5. Spot vs Short-Term vs Medium-Term Multiple-Voyage Charter Optimizer (SIH Objective)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: Spot */}
              <div className="glass rounded-xl p-5 border border-border/50 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-muted-foreground text-[10px]">Reactive Approach</Badge>
                  <span className="text-[11px] font-bold text-danger">High Volatility</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{contractComparison.options.spot.label}</h3>
                <div>
                  <p className="text-2xl font-extrabold text-foreground">${contractComparison.options.spot.freightRatePerMT.toFixed(2)} <span className="text-xs font-normal">/ MT</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Landed: ${(contractComparison.options.spot.totalLandedCost / 1000000).toFixed(3)}M</p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/30 pt-3">
                  <div className="flex justify-between"><span>Voyages:</span> <span className="font-bold text-foreground">1 Single Trip</span></div>
                  <div className="flex justify-between"><span>Demurrage Risk:</span> <span className="font-bold text-danger">Unscheduled (High)</span></div>
                  <div className="flex justify-between"><span>Landed Cost:</span> <span className="font-bold text-foreground">${contractComparison.options.spot.costPerMT}/MT</span></div>
                  <div className="flex justify-between"><span>Net Savings:</span> <span className="font-bold text-muted-foreground">$0 (Baseline)</span></div>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">{contractComparison.options.spot.recommendationRationale}</p>
              </div>

              {/* Option 2: Short-Term 3M (RECOMMENDED) */}
              <div className="glass rounded-xl p-5 border-2 border-primary bg-primary/5 space-y-3 relative shadow-lg shadow-primary/10">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-white text-[10px] font-bold">🌟 SIH RECOMMENDED STRATEGY</Badge>
                  <span className="text-[11px] font-bold text-success">Low Risk</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{contractComparison.options.shortTerm3M.label}</h3>
                <div>
                  <p className="text-2xl font-extrabold text-primary">${contractComparison.options.shortTerm3M.freightRatePerMT.toFixed(2)} <span className="text-xs font-normal">/ MT</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Landed: ${(contractComparison.options.shortTerm3M.totalLandedCost / 1000000).toFixed(3)}M</p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/30 pt-3">
                  <div className="flex justify-between"><span>Voyages:</span> <span className="font-bold text-foreground">3 Consecutive Voyages (225k MT)</span></div>
                  <div className="flex justify-between"><span>Berthing Priority:</span> <span className="font-bold text-success">Scheduled (25% Less Demurrage)</span></div>
                  <div className="flex justify-between"><span>Landed Cost:</span> <span className="font-bold text-primary">${contractComparison.options.shortTerm3M.costPerMT}/MT</span></div>
                  <div className="flex justify-between"><span>Net Savings vs Spot:</span> <span className="font-bold text-success">+${(contractComparison.expectedAnnualSavingsUSD / 1000).toFixed(0)}k ({contractComparison.savingsPercentage}%)</span></div>
                </div>
                <p className="text-[11px] text-primary/90 font-medium pt-1">{contractComparison.options.shortTerm3M.recommendationRationale}</p>
              </div>

              {/* Option 3: Medium-Term 6M */}
              <div className="glass rounded-xl p-5 border border-border/50 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-muted-foreground text-[10px]">Long-Term Commitment</Badge>
                  <span className="text-[11px] font-bold text-warning">Medium Lock-in</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{contractComparison.options.mediumTerm6M.label}</h3>
                <div>
                  <p className="text-2xl font-extrabold text-foreground">${contractComparison.options.mediumTerm6M.freightRatePerMT.toFixed(2)} <span className="text-xs font-normal">/ MT</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Total Landed: ${(contractComparison.options.mediumTerm6M.totalLandedCost / 1000000).toFixed(3)}M</p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/30 pt-3">
                  <div className="flex justify-between"><span>Voyages:</span> <span className="font-bold text-foreground">6 Voyages (450k MT)</span></div>
                  <div className="flex justify-between"><span>Volume Discount:</span> <span className="font-bold text-success">9.0% vs Spot</span></div>
                  <div className="flex justify-between"><span>Landed Cost:</span> <span className="font-bold text-foreground">${contractComparison.options.mediumTerm6M.costPerMT}/MT</span></div>
                  <div className="flex justify-between"><span>Annual Savings:</span> <span className="font-bold text-success">+${((contractComparison.options.mediumTerm6M.expectedSavingsVsSpot) / 1000).toFixed(0)}k</span></div>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">{contractComparison.options.mediumTerm6M.recommendationRationale}</p>
              </div>
            </div>

            {/* Strategic Rationale Banner */}
            <div className="glass rounded-xl p-4 border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Strategic Decision Executive Rationale:
                </p>
                <p className="text-xs text-foreground leading-relaxed max-w-3xl">
                  {contractComparison.executiveRationale}
                </p>
              </div>
              <Button onClick={handleSaveToAuditHistory} size="sm" className="font-bold text-xs gap-1.5 shrink-0 shadow-md">
                <CheckCircle2 className="h-4 w-4" /> Approve & Audit Strategy
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* --- SECTION 5: IDLE TIME REDUCTION & ALTERNATIVE POSITIONING --- */}
      {idleScenario && (
        <SectionCard title="6. Vessel Idle-Time Reduction & Alternative Employment Opportunity">
          <div className="glass rounded-xl p-5 border border-border/50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                <p className="text-[11px] text-muted-foreground">Expected Post-Discharge Idle</p>
                <p className="text-lg font-bold text-danger mt-0.5">{idleScenario.expectedIdleDays} Days</p>
                <p className="text-[10px] text-muted-foreground">Unproductive cost: ${(idleScenario.totalIdleCostUSD / 1000).toFixed(1)}k</p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                <p className="text-[11px] text-muted-foreground">Deadhead Repositioning</p>
                <p className="text-lg font-bold text-foreground mt-0.5">{idleScenario.deadheadDistanceNM} NM</p>
                <p className="text-[10px] text-muted-foreground">Fuel cost: ${(idleScenario.deadheadFuelCostUSD / 1000).toFixed(1)}k</p>
              </div>
              <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
                <p className="text-[11px] text-muted-foreground">Idle Days Reduced</p>
                <p className="text-lg font-bold text-success mt-0.5">-{idleScenario.estimatedIdleReductionDays} Days</p>
                <p className="text-[10px] text-success font-semibold">Active Transit Conversion</p>
              </div>
              <div className="p-3 rounded-lg border border-success/40 bg-success/10">
                <p className="text-[11px] text-success font-semibold">Net Repositioning Savings</p>
                <p className="text-lg font-bold text-success mt-0.5">+${(idleScenario.netSavingsUSD / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-success font-bold">Optimized Employment</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border/60 bg-background/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4 text-primary" /> Recommended Employment Corridor:
                </p>
                <p className="text-muted-foreground">{idleScenario.recommendedRepositioning}</p>
                <p className="text-[11px] text-primary font-mono">Next Target: {idleScenario.nextCargoLocation} | Route: {idleScenario.alternativeRoute}</p>
              </div>
              <Link href="/idle-management">
                <Button variant="outline" size="sm" className="text-xs font-semibold shrink-0">
                  Open Fleet Idle Manager
                </Button>
              </Link>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
