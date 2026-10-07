'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Ship,
  Anchor,
  Navigation,
  Package,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Shield,
  Lock,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { dataStore } from '@/lib/data-store';
import { useAuth } from '@/lib/auth-context';
import type { VesselInfo, PortInfo, RouteInfo, CargoOrder, VesselType, CargoType } from '@/lib/types';

export default function DataManagementPage() {
  const { role, roleInfo } = useAuth();
  const isReadOnly = role === 'logistics_analyst';

  const [activeTab, setActiveTab] = useState<'orders' | 'vessels' | 'ports' | 'routes' | 'import'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live Data State
  const [orders, setOrders] = useState<CargoOrder[]>([]);
  const [vessels, setVessels] = useState<VesselInfo[]>([]);
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);

  // Dialog States
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [vesselModalOpen, setVesselModalOpen] = useState(false);
  const [portModalOpen, setPortModalOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);

  // Form States - Order
  const [orderForm, setOrderForm] = useState({
    orderNumber: '',
    cargoType: 'Coal' as CargoType,
    quantityMT: '75000',
    originPort: 'Newcastle, AU',
    destinationPort: 'Visakhapatnam',
    requiredArrivalDate: '2026-11-15',
    charterType: 'Spot' as 'Spot' | 'Time Charter' | 'COA',
    budgetUSD: '2100000',
    notes: '',
  });

  // Form States - Vessel
  const [vesselForm, setVesselForm] = useState({
    name: '',
    type: 'Panamax' as VesselType,
    capacity: '75000',
    draft: '14.2',
    loa: '225',
    beam: '32',
    speed: '14',
    location: 'Indian Ocean',
    status: 'available' as VesselInfo['status'],
    availability: 'Immediate',
  });

  // Form States - Port
  const [portForm, setPortForm] = useState({
    name: '',
    location: 'East Coast, India',
    maxDraft: '16.5',
    maxLOA: '280',
    maxBeam: '45',
    handlingCapacity: '25',
    avgWaitTime: '3.5',
    status: 'operational' as PortInfo['status'],
    congestion: 'medium' as PortInfo['congestion'],
    lat: '20.26',
    lng: '86.67',
  });

  // Form States - Route
  const [routeForm, setRouteForm] = useState({
    origin: 'Australia',
    originPort: 'Newcastle',
    destination: 'India',
    destinationPort: 'Paradip',
    currentRate: '27.40',
    forecastRate: '28.80',
    distance: '5420',
    duration: '21',
    risk: 'medium' as RouteInfo['risk'],
  });

  // CSV Import State
  const [csvCategory, setCsvCategory] = useState<'orders' | 'vessels' | 'ports' | 'routes'>('vessels');
  const [csvContent, setCsvContent] = useState('');

  const refreshData = () => {
    setOrders(dataStore.getCargoOrders());
    setVessels(dataStore.getVessels());
    setPorts(dataStore.getPorts());
    setRoutes(dataStore.getRoutes());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = dataStore.subscribe(refreshData);
    return () => unsubscribe();
  }, []);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // --- Handlers: Order ---
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showStatus('error', 'Your current role (Logistics Analyst) is Read-Only. Switch to Admin or Procurement Manager to create tenders.');
      return;
    }
    const qty = parseFloat(orderForm.quantityMT) || 75000;
    const estFreight = qty * 27.4;
    dataStore.addCargoOrder({
      orderNumber: orderForm.orderNumber || `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      cargoType: orderForm.cargoType,
      quantityMT: qty,
      originPort: orderForm.originPort,
      destinationPort: orderForm.destinationPort,
      requiredArrivalDate: orderForm.requiredArrivalDate,
      charterType: orderForm.charterType,
      status: 'tender_open',
      budgetUSD: parseFloat(orderForm.budgetUSD) || estFreight * 1.05,
      estimatedFreightUSD: estFreight,
      notes: orderForm.notes,
    });
    setOrderModalOpen(false);
    showStatus('success', 'Bulk Cargo Procurement Tender created successfully!');
  };

  const handleDeleteOrder = (id: string) => {
    if (isReadOnly) return;
    if (confirm('Are you sure you want to delete this procurement order?')) {
      dataStore.deleteCargoOrder(id);
      showStatus('success', 'Order deleted.');
    }
  };

  // --- Handlers: Vessel ---
  const handleSaveVessel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vesselForm.name.trim()) return;
    dataStore.addVessel({
      name: vesselForm.name,
      type: vesselForm.type,
      capacity: parseFloat(vesselForm.capacity) || 75000,
      draft: parseFloat(vesselForm.draft) || 14.2,
      loa: parseFloat(vesselForm.loa) || 225,
      beam: parseFloat(vesselForm.beam) || 32,
      speed: parseFloat(vesselForm.speed) || 14,
      location: vesselForm.location || 'Indian Ocean',
      status: vesselForm.status,
      availability: vesselForm.availability || 'Immediate',
    });
    setVesselModalOpen(false);
    showStatus('success', `Vessel "${vesselForm.name}" added to fleet database!`);
    setVesselForm({ ...vesselForm, name: '' });
  };

  const handleDeleteVessel = (id: string, name: string) => {
    if (isReadOnly) return;
    if (confirm(`Delete vessel ${name}?`)) {
      dataStore.deleteVessel(id);
      showStatus('success', `Vessel ${name} deleted.`);
    }
  };

  // --- Handlers: Port ---
  const handleSavePort = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portForm.name.trim()) return;
    dataStore.addPort({
      name: portForm.name,
      country: 'India',
      portType: 'discharge',
      location: portForm.location || `${portForm.name}, India`,
      maxDraft: parseFloat(portForm.maxDraft) || 16.5,
      maxLOA: parseFloat(portForm.maxLOA) || 280,
      maxBeam: parseFloat(portForm.maxBeam) || 45,
      maxDWT: 180000,
      cargoHandlingRate: (parseFloat(portForm.handlingCapacity) || 25) * 1000,
      handlingCapacity: parseFloat(portForm.handlingCapacity) || 25,
      berthCapacity: 16,
      avgWaitTime: parseFloat(portForm.avgWaitTime) || 3.5,
      status: portForm.status,
      congestion: portForm.congestion,
      vesselCompatibility: ['Handysize', 'Supramax', 'Panamax', 'Capesize'],
      coordinates: [parseFloat(portForm.lat) || 20.26, parseFloat(portForm.lng) || 86.67],
    });
    setPortModalOpen(false);
    showStatus('success', `Port "${portForm.name}" added to master bathymetry directory!`);
  };

  const handleDeletePort = (id: string, name: string) => {
    if (isReadOnly) return;
    if (confirm(`Delete port ${name}?`)) {
      dataStore.deletePort(id);
      showStatus('success', `Port ${name} deleted.`);
    }
  };

  // --- Handlers: Route ---
  const handleSaveRoute = (e: React.FormEvent) => {
    e.preventDefault();
    dataStore.addRoute({
      origin: routeForm.origin,
      originPort: routeForm.originPort,
      destination: routeForm.destination,
      destinationPort: routeForm.destinationPort,
      currentRate: parseFloat(routeForm.currentRate) || 27.4,
      forecastRate: parseFloat(routeForm.forecastRate) || 28.8,
      distance: parseFloat(routeForm.distance) || 5420,
      duration: parseFloat(routeForm.duration) || 21,
      trend: 'increasing',
      risk: routeForm.risk,
      congestion: 'medium',
      coordinates: {
        origin: [-32.92, 151.78],
        destination: [20.26, 86.67],
      },
    });
    setRouteModalOpen(false);
    showStatus('success', 'New trade route & freight benchmark saved!');
  };

  const handleDeleteRoute = (id: string) => {
    if (isReadOnly) return;
    if (confirm('Delete route?')) {
      dataStore.deleteRoute(id);
      showStatus('success', 'Route deleted.');
    }
  };

  // --- Handlers: CSV Bulk Import ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    if (!csvContent.trim()) {
      showStatus('error', 'Please paste CSV content or upload a CSV file.');
      return;
    }
    const res = dataStore.importCSV(csvCategory, csvContent);
    if (res.success) {
      showStatus('success', `Successfully imported ${res.count} records into ${csvCategory.toUpperCase()}!`);
      setCsvContent('');
    } else {
      showStatus('error', res.error || 'Import failed.');
    }
  };

  const handleDownloadTemplate = (cat: 'orders' | 'vessels' | 'ports' | 'routes') => {
    const csvData = dataStore.exportToCSV(cat);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FreightIQ_${cat}_dataset_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetData = () => {
    if (confirm('Reset entire master dataset to SIH 2026 default baseline? This will overwrite custom inputs.')) {
      dataStore.resetToDefaults();
      showStatus('success', 'Dataset reset to baseline.');
    }
  };

  // Filtering
  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.cargoType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.originPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.destinationPort.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVessels = vessels.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPorts = ports.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoutes = routes.filter((r) =>
    r.originPort.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destinationPort.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Data Management & Tenders"
          subtitle="Add custom fleets, update port bathymetry constraints, manage cargo procurement orders, or bulk import CSV datasets"
        />

        <div className="flex items-center gap-2">
          {isReadOnly && (
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/40 py-1.5 px-3 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Read-Only Mode ({roleInfo.description.split('(')[0]})
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetData}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Baseline
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-sm font-medium transition-all ${
            statusMessage.type === 'success'
              ? 'bg-success/15 border-success/40 text-success'
              : 'bg-destructive/15 border-destructive/40 text-destructive'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'orders', label: 'Procurement Tenders', icon: Package, count: orders.length },
            { id: 'vessels', label: 'Vessel Fleet', icon: Ship, count: vessels.length },
            { id: 'ports', label: 'Port Bathymetry', icon: Anchor, count: ports.length },
            { id: 'routes', label: 'Shipping Corridors', icon: Navigation, count: routes.length },
            { id: 'import', label: 'Bulk CSV Import/Export', icon: FileSpreadsheet, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchTerm('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-102'
                    : 'glass text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-md ${active ? 'bg-white/25 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab !== 'import' && (
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-9 bg-background/50"
              />
            </div>

            {activeTab === 'orders' && (
              <Button size="sm" onClick={() => setOrderModalOpen(true)} disabled={isReadOnly} className="h-9 gap-1.5 text-xs font-semibold">
                <Plus className="h-4 w-4" /> New Tender
              </Button>
            )}
            {activeTab === 'vessels' && (
              <Button size="sm" onClick={() => setVesselModalOpen(true)} disabled={isReadOnly} className="h-9 gap-1.5 text-xs font-semibold">
                <Plus className="h-4 w-4" /> Add Vessel
              </Button>
            )}
            {activeTab === 'ports' && (
              <Button size="sm" onClick={() => setPortModalOpen(true)} disabled={isReadOnly} className="h-9 gap-1.5 text-xs font-semibold">
                <Plus className="h-4 w-4" /> Add Port
              </Button>
            )}
            {activeTab === 'routes' && (
              <Button size="sm" onClick={() => setRouteModalOpen(true)} disabled={isReadOnly} className="h-9 gap-1.5 text-xs font-semibold">
                <Plus className="h-4 w-4" /> Add Route
              </Button>
            )}
          </div>
        )}
      </div>

      {/* --- TAB 1: CARGO PROCUREMENT ORDERS --- */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Total Active Tenders</p>
              <p className="text-2xl font-bold text-foreground mt-1">{orders.length}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Total Cargo Volume</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {(orders.reduce((acc, o) => acc + o.quantityMT, 0) / 1000).toFixed(0)}k MT
              </p>
            </div>
            <div className="glass rounded-xl p-4 border border-border/50">
              <p className="text-xs text-muted-foreground">Total Procurement Budget</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(orders.reduce((acc, o) => acc + o.budgetUSD, 0) / 1000000).toFixed(2)}M
              </p>
            </div>
          </div>

          <div className="glass rounded-xl border border-border/50 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="p-3.5">Tender / Order #</th>
                  <th className="p-3.5">Cargo Type</th>
                  <th className="p-3.5">Volume (MT)</th>
                  <th className="p-3.5">Origin → Destination</th>
                  <th className="p-3.5">Target Delivery</th>
                  <th className="p-3.5">Charter Mode</th>
                  <th className="p-3.5">Allocated Vessel</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-bold">{ord.orderNumber}</td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[11px] font-medium">{ord.cargoType}</Badge>
                    </td>
                    <td className="p-3.5 font-semibold text-primary">{ord.quantityMT.toLocaleString()} MT</td>
                    <td className="p-3.5 font-medium">{ord.originPort} → {ord.destinationPort}</td>
                    <td className="p-3.5">{ord.requiredArrivalDate}</td>
                    <td className="p-3.5 font-semibold">{ord.charterType}</td>
                    <td className="p-3.5">
                      {ord.allocatedVesselName ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                          <Ship className="h-3.5 w-3.5" /> {ord.allocatedVesselName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Unallocated</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ord.status === 'in_transit' ? 'bg-primary/20 text-primary border border-primary/30' :
                        ord.status === 'chartered' ? 'bg-success/20 text-success border border-success/30' :
                        'bg-warning/20 text-warning border border-warning/30'
                      }`}>
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleDeleteOrder(ord.id)}
                        disabled={isReadOnly}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                        title="Delete order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: VESSELS FLEET --- */}
      {activeTab === 'vessels' && (
        <div className="glass rounded-xl border border-border/50 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                <th className="p-3.5">Vessel Name</th>
                <th className="p-3.5">Class / Type</th>
                <th className="p-3.5">DWT Capacity</th>
                <th className="p-3.5">Max Draft</th>
                <th className="p-3.5">LOA / Beam</th>
                <th className="p-3.5">Speed</th>
                <th className="p-3.5">Current Location</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {filteredVessels.map((v) => (
                <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5 font-bold flex items-center gap-2">
                    <Ship className="h-4 w-4 text-primary" /> {v.name}
                  </td>
                  <td className="p-3.5"><Badge variant="outline">{v.type}</Badge></td>
                  <td className="p-3.5 font-semibold text-primary">{v.capacity.toLocaleString()} DWT</td>
                  <td className="p-3.5 font-mono">{v.draft} m</td>
                  <td className="p-3.5 font-mono">{v.loa}m × {v.beam}m</td>
                  <td className="p-3.5 font-mono">{v.speed} kn</td>
                  <td className="p-3.5 font-medium">{v.location}</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.status === 'available' ? 'bg-success/20 text-success' :
                      v.status === 'on-voyage' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDeleteVessel(v.id, v.name)}
                      disabled={isReadOnly}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                      title="Delete vessel"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 3: PORTS BATHYMETRY --- */}
      {activeTab === 'ports' && (
        <div className="glass rounded-xl border border-border/50 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                <th className="p-3.5">Port Name</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Max Permissible Draft</th>
                <th className="p-3.5">Max LOA / Beam</th>
                <th className="p-3.5">Annual Capacity</th>
                <th className="p-3.5">Avg Waiting Time</th>
                <th className="p-3.5">Operational Status</th>
                <th className="p-3.5">Congestion</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {filteredPorts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5 font-bold flex items-center gap-2">
                    <Anchor className="h-4 w-4 text-primary" /> {p.name}
                  </td>
                  <td className="p-3.5">{p.location}</td>
                  <td className="p-3.5 font-bold text-primary">{p.maxDraft} m</td>
                  <td className="p-3.5 font-mono">{p.maxLOA}m × {p.maxBeam}m</td>
                  <td className="p-3.5 font-semibold">{p.handlingCapacity} M MT/yr</td>
                  <td className="p-3.5 font-mono">{p.avgWaitTime} days</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/20 text-success">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.congestion === 'low' ? 'bg-success/20 text-success' :
                      p.congestion === 'medium' ? 'bg-warning/20 text-warning' : 'bg-danger/20 text-danger'
                    }`}>
                      {p.congestion}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDeletePort(p.id, p.name)}
                      disabled={isReadOnly}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                      title="Delete port"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 4: SHIPPING CORRIDORS & RATES --- */}
      {activeTab === 'routes' && (
        <div className="glass rounded-xl border border-border/50 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold">
                <th className="p-3.5">Origin Port</th>
                <th className="p-3.5">Discharge Port</th>
                <th className="p-3.5">Current Rate ($/MT)</th>
                <th className="p-3.5">Forecast 30d ($/MT)</th>
                <th className="p-3.5">Nautical Distance</th>
                <th className="p-3.5">Voyage Days</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-foreground">
              {filteredRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5 font-bold">{r.originPort} ({r.origin})</td>
                  <td className="p-3.5 font-bold text-primary">{r.destinationPort}</td>
                  <td className="p-3.5 font-bold">${r.currentRate.toFixed(2)}</td>
                  <td className="p-3.5 font-bold text-primary">${r.forecastRate.toFixed(2)}</td>
                  <td className="p-3.5 font-mono">{r.distance.toLocaleString()} NM</td>
                  <td className="p-3.5 font-mono">{r.duration} days</td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.risk === 'low' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    }`}>
                      {r.risk}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDeleteRoute(r.id)}
                      disabled={isReadOnly}
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30"
                      title="Delete route"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- TAB 5: BULK CSV IMPORT & EXPORT --- */}
      {activeTab === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CSV Import */}
          <SectionCard title="Bulk CSV Dataset Import">
            <div className="glass rounded-xl p-5 border border-border/50 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload real maritime datasets, vessel particulars, port hydrographic data, or procurement tenders from Excel / CSV files.
              </p>

              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Target Category</label>
                <Select value={csvCategory} onValueChange={(v: any) => setCsvCategory(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vessels">Vessels Fleet Database</SelectItem>
                    <SelectItem value="ports">Port Infrastructure & Bathymetry</SelectItem>
                    <SelectItem value="routes">Shipping Routes & Rates</SelectItem>
                    <SelectItem value="orders">Bulk Cargo Procurement Tenders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Choose CSV File</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Or Paste CSV Content Directly</label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder={`name,type,capacity,draft,loa,beam,speed,status,location\nMV Sagar Ratna,Capesize,180000,17.8,295,46,14.5,available,Port Hedland`}
                  className="w-full rounded-lg border border-border/60 bg-background/50 p-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <Button
                onClick={handleProcessImport}
                disabled={isReadOnly}
                className="w-full gap-2 font-bold text-xs"
              >
                <Upload className="h-4 w-4" /> Process & Ingest CSV Data
              </Button>
            </div>
          </SectionCard>

          {/* CSV Export & Templates */}
          <SectionCard title="Export Datasets & Templates">
            <div className="glass rounded-xl p-5 border border-border/50 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download current master datasets as clean CSV files or use sample templates to prepare your team's real data for import.
              </p>

              <div className="space-y-3">
                {[
                  { id: 'vessels', label: 'Vessel Fleet Dataset', desc: 'All active Capesize, Panamax, Supramax and Handysize vessels.' },
                  { id: 'ports', label: 'Port Bathymetry & Constraints', desc: 'Indian East Coast discharge port limits (draft, LOA, beam, berth wait).' },
                  { id: 'routes', label: 'Trade Corridors & Distance Matrix', desc: 'Origins, discharge ports, nautical miles and freight rate points.' },
                  { id: 'orders', label: 'Procurement Tenders & Consignments', desc: 'Raw material procurement tenders with volume, dates, and charter status.' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
                    <div>
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadTemplate(item.id as any)}
                      className="text-xs font-semibold gap-1.5 h-8"
                    >
                      <Download className="h-3.5 w-3.5" /> Export CSV
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* --- MODAL: NEW PROCUREMENT TENDER --- */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="sm:max-w-[500px] glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Package className="h-5 w-5 text-primary" /> Create Bulk Procurement Tender
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveOrder} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold text-foreground">Tender Number</label>
              <Input
                placeholder="ORD-2026-COAL-004"
                value={orderForm.orderNumber}
                onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Cargo Type</label>
                <Select value={orderForm.cargoType} onValueChange={(v: any) => setOrderForm({ ...orderForm, cargoType: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coal">Coking / Thermal Coal</SelectItem>
                    <SelectItem value="Iron Ore">Iron Ore Pellets / Fines</SelectItem>
                    <SelectItem value="Steel">Finished / Semi Steel</SelectItem>
                    <SelectItem value="Other Bulk Cargo">Limestone / Met Coke</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Quantity (MT)</label>
                <Input
                  type="number"
                  value={orderForm.quantityMT}
                  onChange={(e) => setOrderForm({ ...orderForm, quantityMT: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Origin Port</label>
                <Input
                  value={orderForm.originPort}
                  onChange={(e) => setOrderForm({ ...orderForm, originPort: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Discharge Port</label>
                <Input
                  value={orderForm.destinationPort}
                  onChange={(e) => setOrderForm({ ...orderForm, destinationPort: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Target Arrival Date</label>
                <Input
                  type="date"
                  value={orderForm.requiredArrivalDate}
                  onChange={(e) => setOrderForm({ ...orderForm, requiredArrivalDate: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Charter Method</label>
                <Select value={orderForm.charterType} onValueChange={(v: any) => setOrderForm({ ...orderForm, charterType: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spot">Spot Voyage Charter</SelectItem>
                    <SelectItem value="Time Charter">Long-Term Time Charter</SelectItem>
                    <SelectItem value="COA">Contract of Affreightment (COA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Procurement Budget ($ USD)</label>
              <Input
                type="number"
                value={orderForm.budgetUSD}
                onChange={(e) => setOrderForm({ ...orderForm, budgetUSD: e.target.value })}
                className="h-9 text-xs mt-1 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Operational Notes</label>
              <Input
                placeholder="e.g. For SAIL Rourkela batch procurement"
                value={orderForm.notes}
                onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                className="h-9 text-xs mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setOrderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="font-bold">
                Publish Tender
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: NEW VESSEL --- */}
      <Dialog open={vesselModalOpen} onOpenChange={setVesselModalOpen}>
        <DialogContent className="sm:max-w-[500px] glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Ship className="h-5 w-5 text-primary" /> Add Vessel to Fleet
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveVessel} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Vessel Name</label>
                <Input
                  placeholder="MV Sagar Shakti"
                  value={vesselForm.name}
                  onChange={(e) => setVesselForm({ ...vesselForm, name: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Vessel Class</label>
                <Select value={vesselForm.type} onValueChange={(v: any) => setVesselForm({ ...vesselForm, type: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Capesize">Capesize (180k DWT)</SelectItem>
                    <SelectItem value="Panamax">Panamax (75k DWT)</SelectItem>
                    <SelectItem value="Supramax">Supramax (60k DWT)</SelectItem>
                    <SelectItem value="Handysize">Handysize (35k DWT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Capacity (DWT)</label>
                <Input
                  type="number"
                  value={vesselForm.capacity}
                  onChange={(e) => setVesselForm({ ...vesselForm, capacity: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Draft (m)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={vesselForm.draft}
                  onChange={(e) => setVesselForm({ ...vesselForm, draft: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Speed (kn)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={vesselForm.speed}
                  onChange={(e) => setVesselForm({ ...vesselForm, speed: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">LOA (m)</label>
                <Input
                  type="number"
                  value={vesselForm.loa}
                  onChange={(e) => setVesselForm({ ...vesselForm, loa: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Beam (m)</label>
                <Input
                  type="number"
                  value={vesselForm.beam}
                  onChange={(e) => setVesselForm({ ...vesselForm, beam: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Current Location</label>
                <Input
                  value={vesselForm.location}
                  onChange={(e) => setVesselForm({ ...vesselForm, location: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Status</label>
                <Select value={vesselForm.status} onValueChange={(v: any) => setVesselForm({ ...vesselForm, status: v })}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on-voyage">On Voyage</SelectItem>
                    <SelectItem value="in-port">In Port</SelectItem>
                    <SelectItem value="under-maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setVesselModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="font-bold">Save Vessel</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: NEW PORT --- */}
      <Dialog open={portModalOpen} onOpenChange={setPortModalOpen}>
        <DialogContent className="sm:max-w-[500px] glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Anchor className="h-5 w-5 text-primary" /> Add Discharge Port
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSavePort} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Port Name</label>
                <Input
                  placeholder="Kakinada Deepwater"
                  value={portForm.name}
                  onChange={(e) => setPortForm({ ...portForm, name: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Location / State</label>
                <Input
                  placeholder="Andhra Pradesh"
                  value={portForm.location}
                  onChange={(e) => setPortForm({ ...portForm, location: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Max Draft (m)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={portForm.maxDraft}
                  onChange={(e) => setPortForm({ ...portForm, maxDraft: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Max LOA (m)</label>
                <Input
                  type="number"
                  value={portForm.maxLOA}
                  onChange={(e) => setPortForm({ ...portForm, maxLOA: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Max Beam (m)</label>
                <Input
                  type="number"
                  value={portForm.maxBeam}
                  onChange={(e) => setPortForm({ ...portForm, maxBeam: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Handling Cap. (M MT/yr)</label>
                <Input
                  type="number"
                  value={portForm.handlingCapacity}
                  onChange={(e) => setPortForm({ ...portForm, handlingCapacity: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Avg Wait Time (Days)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={portForm.avgWaitTime}
                  onChange={(e) => setPortForm({ ...portForm, avgWaitTime: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPortModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="font-bold">Save Port</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL: NEW ROUTE --- */}
      <Dialog open={routeModalOpen} onOpenChange={setRouteModalOpen}>
        <DialogContent className="sm:max-w-[500px] glass">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
              <Navigation className="h-5 w-5 text-primary" /> Add Trade Route & Rate
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRoute} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Origin Port</label>
                <Input
                  placeholder="Maputo, Mozambique"
                  value={routeForm.originPort}
                  onChange={(e) => setRouteForm({ ...routeForm, originPort: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Destination Port</label>
                <Input
                  placeholder="Paradip"
                  value={routeForm.destinationPort}
                  onChange={(e) => setRouteForm({ ...routeForm, destinationPort: e.target.value })}
                  className="h-9 text-xs mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Current Rate ($/MT)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={routeForm.currentRate}
                  onChange={(e) => setRouteForm({ ...routeForm, currentRate: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Forecast Rate ($/MT)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={routeForm.forecastRate}
                  onChange={(e) => setRouteForm({ ...routeForm, forecastRate: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Distance (Nautical Miles)</label>
                <Input
                  type="number"
                  value={routeForm.distance}
                  onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Voyage Duration (Days)</label>
                <Input
                  type="number"
                  value={routeForm.duration}
                  onChange={(e) => setRouteForm({ ...routeForm, duration: e.target.value })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setRouteModalOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="font-bold">Save Trade Route</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
