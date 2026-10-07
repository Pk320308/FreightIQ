'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Calendar,
  DollarSign,
  TrendingDown,
  Ship,
  MapPin,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Archive,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dataStore } from '@/lib/data-store';
import { RecommendationHistoryItem } from '@/lib/types';
import Link from 'next/link';

export default function RecommendationsHistoryPage() {
  const [history, setHistory] = useState<RecommendationHistoryItem[]>(dataStore.getRecommendationHistory());
  const [selectedItem, setSelectedItem] = useState<RecommendationHistoryItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'accepted' | 'under_review' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setHistory(dataStore.getRecommendationHistory());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (history.length > 0 && !selectedItem) {
      setSelectedItem(history[0]);
    }
  }, [history, selectedItem]);

  const filteredItems = useMemo(() => {
    return history.filter(item => {
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.cargoType.toLowerCase().includes(q) ||
          item.originPort.toLowerCase().includes(q) ||
          item.destinationPort.toLowerCase().includes(q) ||
          item.recommendedStrategy.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [history, filterStatus, searchQuery]);

  // Aggregate metrics
  const totalDecisions = history.length;
  const totalTonnageProcured = history.reduce((sum, h) => sum + h.quantityMT, 0);
  const totalSavingsGenerated = history.reduce((sum, h) => sum + h.estimatedSavingsUSD, 0);
  const acceptedDecisions = history.filter(h => h.status === 'accepted').length;

  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Cargo Type', 'Quantity (MT)', 'Origin Port', 'Destination Port', 'Recommended Vessel', 'Strategy', 'Total Cost (USD)', 'Cost Per MT ($)', 'Savings vs Spot (USD)', 'Status'];
    const rows = history.map(h => [
      h.id,
      h.date,
      h.cargoType,
      h.quantityMT,
      h.originPort,
      h.destinationPort,
      h.recommendedVessel,
      h.recommendedStrategy,
      h.estimatedTotalCostUSD,
      h.costPerMT,
      h.estimatedSavingsUSD,
      h.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FreightIQ_Chartering_Recommendations_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateStatus = (id: string, newStatus: 'accepted' | 'under_review' | 'archived') => {
    dataStore.updateRecommendationStatus(id, newStatus);
    if (selectedItem?.id === id) {
      setSelectedItem({ ...selectedItem, status: newStatus });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-md p-6 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Chartering Recommendations & Enterprise Audit Trail</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Complete institutional log of multi-voyage procurement strategies, landed cost savings, and dual-port evaluations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-background/80"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export Audit Log (CSV)
          </Button>
          <Link href="/chartering">
            <Button size="sm" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              New Procurement Evaluation
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tenders Evaluated</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{totalDecisions} Packages</h3>
              <p className="text-xs text-muted-foreground mt-1">{acceptedDecisions} accepted by Ministry / PSU</p>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tonnage Handled</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{(totalTonnageProcured / 1000000).toFixed(2)}M MT</h3>
              <p className="text-xs text-muted-foreground mt-1">Coking coal & bulk minerals</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <Ship className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Landed Cost Savings</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">${(totalSavingsGenerated / 1000000).toFixed(2)}M USD</h3>
              <p className="text-xs text-emerald-400 mt-1">vs Spot Charter Baseline</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 backdrop-blur border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adoption Rate</p>
              <h3 className="text-2xl font-bold text-primary mt-1">
                {Math.round((acceptedDecisions / (totalDecisions || 1)) * 100)}%
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Multi-voyage strategy lock-in</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by cargo, port, strategy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card/60 h-9 text-xs"
            />
          </div>
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border">
            {(['all', 'accepted', 'under_review', 'archived'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs rounded-md capitalize transition-all ${
                  filterStatus === st
                    ? 'bg-background shadow-sm text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Showing <strong>{filteredItems.length}</strong> audited recommendations
        </p>
      </div>

      {/* Audit Trail List & Detailed View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recommendations List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredItems.length === 0 ? (
            <Card className="bg-card/70 backdrop-blur p-8 text-center border-border">
              <p className="text-sm text-muted-foreground">No recommendations found matching your filters.</p>
            </Card>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isAccepted = item.status === 'accepted';
              const isUnderReview = item.status === 'under_review';

              return (
                <Card
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-primary/5 border-primary shadow-sm'
                      : 'bg-card/70 backdrop-blur border-border hover:bg-muted/50 hover:border-primary/30'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {item.id}
                          </Badge>
                          <h3 className="font-bold text-foreground text-sm">
                            {item.quantityMT.toLocaleString()} MT {item.cargoType}
                          </h3>
                          <Badge
                            className={`text-[10px] capitalize ${
                              isAccepted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                              isUnderReview ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-muted text-muted-foreground'
                            }`}
                            variant="outline"
                          >
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{item.originPort} → {item.destinationPort}</span>
                          <span>•</span>
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{item.date}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">
                            Strategy: <strong className="text-foreground">{item.recommendedStrategy}</strong>
                          </span>
                          <span className="text-sm font-bold text-emerald-500 font-mono">
                            -${(item.estimatedSavingsUSD / 1000).toFixed(0)}k savings
                          </span>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90 text-primary' : ''}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Recommendation Package Details */}
        <div>
          {selectedItem ? (
            <Card className="bg-card/70 backdrop-blur border-border sticky top-6">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    {selectedItem.id}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedItem.date}</span>
                </div>
                <CardTitle className="text-base font-bold mt-1 text-foreground">
                  Decision Evaluation Dossier
                </CardTitle>
                <CardDescription className="text-xs">
                  Optimal multi-voyage procurement allocation
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                {/* Route & Cargo details */}
                <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Consignment:</span>
                    <span className="font-bold text-foreground">{selectedItem.quantityMT.toLocaleString()} MT {selectedItem.cargoType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loading Port:</span>
                    <span className="font-medium text-foreground">{selectedItem.originPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discharge Port:</span>
                    <span className="font-medium text-foreground">{selectedItem.destinationPort}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matched Vessel:</span>
                    <span className="font-bold text-primary">{selectedItem.recommendedVessel}</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-3.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recommended Contract:</span>
                    <span className="font-bold text-emerald-400">{selectedItem.recommendedStrategy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Landed Cost per MT:</span>
                    <span className="font-mono font-bold text-foreground">${selectedItem.costPerMT.toFixed(2)} / MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Commitment:</span>
                    <span className="font-mono font-bold text-foreground">${(selectedItem.estimatedTotalCostUSD / 1000000).toFixed(2)}M USD</span>
                  </div>
                  <div className="border-t border-emerald-500/20 pt-2 flex justify-between font-bold text-emerald-400">
                    <span>Net Savings vs Spot:</span>
                    <span>+${(selectedItem.estimatedSavingsUSD / 1000).toFixed(0)}k USD</span>
                  </div>
                </div>

                {/* Rationale Pillars */}
                <div>
                  <h4 className="font-semibold text-foreground text-xs mb-2">Maritime Decision Rationale:</h4>
                  <ul className="space-y-1.5">
                    {selectedItem.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-muted-foreground text-[11px] leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action status switcher */}
                <div className="pt-2 border-t border-border space-y-2">
                  <label className="text-muted-foreground text-[11px] font-medium block">Update Audit Status:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      size="sm"
                      variant={selectedItem.status === 'accepted' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus(selectedItem.id, 'accepted')}
                      className="text-xs h-7"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedItem.status === 'under_review' ? 'secondary' : 'outline'}
                      onClick={() => handleUpdateStatus(selectedItem.id, 'under_review')}
                      className="text-xs h-7"
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedItem.status === 'archived' ? 'destructive' : 'outline'}
                      onClick={() => handleUpdateStatus(selectedItem.id, 'archived')}
                      className="text-xs h-7"
                    >
                      Archive
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card/70 backdrop-blur p-6 text-center border-border">
              <p className="text-xs text-muted-foreground">Select a recommendation to inspect details</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
