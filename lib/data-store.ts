'use client';

import type {
  VesselInfo,
  PortInfo,
  RouteInfo,
  FreightRatePoint,
  CargoOrder,
  EarlyWarningAlert,
  IdleScenario,
  RecommendationHistoryItem,
  MarketEntryRecommendation,
} from '@/lib/types';
import type { NormalizedRole } from '@/backend/security/rbac';
import {
  vessels as initialVessels,
  ports as initialPorts,
  routes as initialRoutes,
  freightRateData as initialFreightRates,
  earlyWarningAlerts as initialAlerts,
  idleScenarios as initialIdleScenarios,
  recommendationHistory as initialHistory,
  marketEntryRecommendations as initialMarketEntry,
} from '@/lib/mock-data';

import initialAdminsList from '@/data/admins.json';

const STORAGE_KEY = 'freightiq_master_dataset_v4';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: NormalizedRole;
  department: string;
  organization: string;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
  createdBy?: string;
}

const defaultStaffUsers: ManagedUser[] = [
  {
    id: 'usr_proc_002',
    name: 'Rajesh Sharma',
    email: 'procurement@sail.in',
    password: 'Procure@123',
    role: 'procurement',
    department: 'Raw Material Procurement Division',
    organization: 'Steel Authority of India Ltd (SAIL)',
    status: 'active',
    createdAt: '2026-09-05',
    lastLogin: '12 mins ago',
    createdBy: 'admin@steel.gov.in',
  },
  {
    id: 'usr_log_003',
    name: 'Capt. Vikram Rao',
    email: 'logistics@vizagport.gov.in',
    password: 'Logistics@123',
    role: 'logistics',
    department: 'Port Operations & Vessel Turnaround',
    organization: 'East Coast Shipping & Port Authority',
    status: 'active',
    createdAt: '2026-09-10',
    lastLogin: '45 mins ago',
    createdBy: 'admin@steel.gov.in',
  },
  {
    id: 'usr_ana_004',
    name: 'Ananya Sen',
    email: 'analyst@steel.gov.in',
    password: 'Analyst@123',
    role: 'analyst',
    department: 'Econometrics & Freight Forecasting Unit',
    organization: 'Ministry of Steel (Govt of India)',
    status: 'active',
    createdAt: '2026-09-15',
    lastLogin: '2 hours ago',
    createdBy: 'admin@steel.gov.in',
  },
];

// Combine initial admins from createAdmin.js with standard operational users
const initialUsers: ManagedUser[] = [
  ...((initialAdminsList as unknown as ManagedUser[]) || []),
  ...defaultStaffUsers,
];

const initialCargoOrders: CargoOrder[] = [
  {
    id: 'ord_1',
    orderNumber: 'ORD-2026-COAL-001',
    cargoType: 'Coal',
    quantityMT: 75000,
    originPort: 'Newcastle',
    destinationPort: 'Visakhapatnam',
    requiredArrivalDate: '2026-10-25',
    charterType: 'Spot',
    allocatedVesselId: 'v_panamax_1',
    allocatedVesselName: 'MV Ocean Pioneer',
    status: 'in_transit',
    budgetUSD: 2150000,
    estimatedFreightUSD: 2010000,
    notes: 'High volatile coking coal for SAIL Vizag blast furnace batch #4.',
    createdAt: '2026-10-01',
  },
  {
    id: 'ord_2',
    orderNumber: 'ORD-2026-COAL-002',
    cargoType: 'Coal',
    quantityMT: 165000,
    originPort: 'Hay Point / Dalrymple Bay',
    destinationPort: 'Gangavaram',
    requiredArrivalDate: '2026-11-05',
    charterType: 'Time Charter',
    allocatedVesselId: 'v_capesize_1',
    allocatedVesselName: 'MV Bharat Gaurav',
    status: 'chartered',
    budgetUSD: 4400000,
    estimatedFreightUSD: 4257000,
    notes: 'Premium low-ash coking coal consignment for RINL / JSPL.',
    createdAt: '2026-10-02',
  },
  {
    id: 'ord_3',
    orderNumber: 'ORD-2026-LIMESTONE-003',
    cargoType: 'Other Bulk Cargo',
    quantityMT: 55000,
    originPort: 'Mina Saqr, UAE',
    destinationPort: 'Dhamra',
    requiredArrivalDate: '2026-11-12',
    charterType: 'Spot',
    status: 'tender_open',
    budgetUSD: 980000,
    estimatedFreightUSD: 920000,
    notes: 'SMS Grade Flux Limestone for Tata Steel Kalinganagar plant.',
    createdAt: '2026-10-04',
  },
];

interface MasterDataset {
  users: ManagedUser[];
  vessels: VesselInfo[];
  ports: PortInfo[];
  routes: RouteInfo[];
  freightRates: FreightRatePoint[];
  cargoOrders: CargoOrder[];
  earlyWarnings: EarlyWarningAlert[];
  idleScenarios: IdleScenario[];
  recommendationHistory: RecommendationHistoryItem[];
  marketEntryRecommendations: MarketEntryRecommendation[];
  lastUpdated: string;
}

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function loadDataset(): MasterDataset {
  if (typeof window === 'undefined') {
    return {
      users: initialUsers,
      vessels: initialVessels,
      ports: initialPorts,
      routes: initialRoutes,
      freightRates: initialFreightRates,
      cargoOrders: initialCargoOrders,
      earlyWarnings: initialAlerts,
      idleScenarios: initialIdleScenarios,
      recommendationHistory: initialHistory,
      marketEntryRecommendations: initialMarketEntry,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = initialUsers;
      } else {
        // Ensure any CLI-provisioned admins from admins.json are synced into local storage
        for (const initU of initialUsers) {
          const exists = parsed.users.some(
            (u: ManagedUser) => u.email.toLowerCase().trim() === initU.email.toLowerCase().trim()
          );
          if (!exists) {
            parsed.users.unshift(initU);
          }
        }
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load local dataset', e);
  }

  const defaultData: MasterDataset = {
    users: initialUsers,
    vessels: initialVessels,
    ports: initialPorts,
    routes: initialRoutes,
    freightRates: initialFreightRates,
    cargoOrders: initialCargoOrders,
    earlyWarnings: initialAlerts,
    idleScenarios: initialIdleScenarios,
    recommendationHistory: initialHistory,
    marketEntryRecommendations: initialMarketEntry,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  } catch {}

  return defaultData;
}

function saveDataset(data: MasterDataset) {
  data.lastUpdated = new Date().toISOString();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save master dataset', e);
    }
  }
  notifyListeners();
}

export const dataStore = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getDataset(): MasterDataset {
    return loadDataset();
  },

  // --- USER MANAGEMENT (ADMIN ONLY - SIH26006) ---
  getUsers(): ManagedUser[] {
    return loadDataset().users || initialUsers;
  },

  getUserByEmail(email: string): ManagedUser | undefined {
    const cleanEmail = email.toLowerCase().trim();
    return loadDataset().users.find((u) => u.email.toLowerCase().trim() === cleanEmail);
  },

  addUser(user: Omit<ManagedUser, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): ManagedUser {
    const data = loadDataset();
    if (!data.users) data.users = [...initialUsers];

    // Check existing email
    const existingIndex = data.users.findIndex((u) => u.email.toLowerCase().trim() === user.email.toLowerCase().trim());
    if (existingIndex !== -1) {
      // update existing
      data.users[existingIndex] = {
        ...data.users[existingIndex],
        ...user,
      };
      saveDataset(data);
      return data.users[existingIndex];
    }

    const newUser: ManagedUser = {
      ...user,
      id: user.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: user.createdAt || new Date().toISOString().split('T')[0],
      status: user.status || 'active',
      password: user.password || 'Steel@2026',
    };
    data.users.unshift(newUser);
    saveDataset(data);
    return newUser;
  },

  updateUser(id: string, updates: Partial<ManagedUser>): boolean {
    const data = loadDataset();
    if (!data.users) data.users = [...initialUsers];
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    data.users[index] = { ...data.users[index], ...updates };
    saveDataset(data);
    return true;
  },

  deleteUser(id: string): boolean {
    const data = loadDataset();
    if (!data.users) return false;
    // Protect root admin from accidental deletion
    if (id === 'usr_admin_001') return false;
    const filtered = data.users.filter((u) => u.id !== id);
    if (filtered.length === data.users.length) return false;
    data.users = filtered;
    saveDataset(data);
    return true;
  },

  toggleUserStatus(id: string): boolean {
    const data = loadDataset();
    if (!data.users) return false;
    const index = data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    data.users[index].status = data.users[index].status === 'active' ? 'suspended' : 'active';
    saveDataset(data);
    return true;
  },

  authenticate(email: string, password?: string): { success: boolean; user?: ManagedUser; error?: string } {
    const cleanEmail = email.toLowerCase().trim();
    const user = this.getUserByEmail(cleanEmail);
    if (!user) {
      return { success: false, error: 'No account registered with this email address. Contact Ministry Administrator.' };
    }
    if (user.status === 'suspended') {
      return { success: false, error: 'This account has been suspended by Ministry Administrator.' };
    }
    if (password && user.password && user.password !== password) {
      return { success: false, error: 'Invalid security password. Please re-check.' };
    }
    // Update last login
    this.updateUser(user.id, { lastLogin: 'Just now' });
    return { success: true, user };
  },

  // --- VESSELS ---
  getVessels(): VesselInfo[] {
    return loadDataset().vessels;
  },

  addVessel(vessel: Omit<VesselInfo, 'id'> & { id?: string }): VesselInfo {
    const data = loadDataset();
    const newVessel: VesselInfo = {
      ...vessel,
      id: vessel.id || `v_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    data.vessels.unshift(newVessel);
    saveDataset(data);
    return newVessel;
  },

  updateVessel(id: string, updates: Partial<VesselInfo>): boolean {
    const data = loadDataset();
    const index = data.vessels.findIndex((v) => v.id === id);
    if (index === -1) return false;
    data.vessels[index] = { ...data.vessels[index], ...updates };
    saveDataset(data);
    return true;
  },

  deleteVessel(id: string): boolean {
    const data = loadDataset();
    const filtered = data.vessels.filter((v) => v.id !== id);
    if (filtered.length === data.vessels.length) return false;
    data.vessels = filtered;
    saveDataset(data);
    return true;
  },

  // --- PORTS ---
  getPorts(): PortInfo[] {
    return loadDataset().ports;
  },

  getLoadingPorts(): PortInfo[] {
    return loadDataset().ports.filter((p) => p.portType === 'loading');
  },

  getDischargePorts(): PortInfo[] {
    return loadDataset().ports.filter((p) => p.portType === 'discharge');
  },

  addPort(port: Omit<PortInfo, 'id'> & { id?: string }): PortInfo {
    const data = loadDataset();
    const newPort: PortInfo = {
      ...port,
      id: port.id || `port_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    data.ports.unshift(newPort);
    saveDataset(data);
    return newPort;
  },

  updatePort(id: string, updates: Partial<PortInfo>): boolean {
    const data = loadDataset();
    const index = data.ports.findIndex((p) => p.id === id);
    if (index === -1) return false;
    data.ports[index] = { ...data.ports[index], ...updates };
    saveDataset(data);
    return true;
  },

  deletePort(id: string): boolean {
    const data = loadDataset();
    const filtered = data.ports.filter((p) => p.id !== id);
    if (filtered.length === data.ports.length) return false;
    data.ports = filtered;
    saveDataset(data);
    return true;
  },

  // --- ROUTES ---
  getRoutes(): RouteInfo[] {
    return loadDataset().routes;
  },

  addRoute(route: Omit<RouteInfo, 'id'> & { id?: string }): RouteInfo {
    const data = loadDataset();
    const newRoute: RouteInfo = {
      ...route,
      id: route.id || `r_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    data.routes.unshift(newRoute);
    saveDataset(data);
    return newRoute;
  },

  updateRoute(id: string, updates: Partial<RouteInfo>): boolean {
    const data = loadDataset();
    const index = data.routes.findIndex((r) => r.id === id);
    if (index === -1) return false;
    data.routes[index] = { ...data.routes[index], ...updates };
    saveDataset(data);
    return true;
  },

  deleteRoute(id: string): boolean {
    const data = loadDataset();
    const filtered = data.routes.filter((r) => r.id !== id);
    if (filtered.length === data.routes.length) return false;
    data.routes = filtered;
    saveDataset(data);
    return true;
  },

  // --- CARGO PROCUREMENT ORDERS ---
  getCargoOrders(): CargoOrder[] {
    return loadDataset().cargoOrders;
  },

  addCargoOrder(order: Omit<CargoOrder, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): CargoOrder {
    const data = loadDataset();
    const newOrder: CargoOrder = {
      ...order,
      id: order.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: order.createdAt || new Date().toISOString().split('T')[0],
      orderNumber: order.orderNumber || `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    data.cargoOrders.unshift(newOrder);
    saveDataset(data);
    return newOrder;
  },

  updateCargoOrder(id: string, updates: Partial<CargoOrder>): boolean {
    const data = loadDataset();
    const index = data.cargoOrders.findIndex((o) => o.id === id);
    if (index === -1) return false;
    data.cargoOrders[index] = { ...data.cargoOrders[index], ...updates };
    saveDataset(data);
    return true;
  },

  deleteCargoOrder(id: string): boolean {
    const data = loadDataset();
    const filtered = data.cargoOrders.filter((o) => o.id !== id);
    if (filtered.length === data.cargoOrders.length) return false;
    data.cargoOrders = filtered;
    saveDataset(data);
    return true;
  },

  // --- FREIGHT RATES ---
  getFreightRates(): FreightRatePoint[] {
    return loadDataset().freightRates;
  },

  // --- EARLY WARNING ALERTS ---
  getEarlyWarnings(): EarlyWarningAlert[] {
    return loadDataset().earlyWarnings || initialAlerts;
  },

  // --- IDLE SCENARIOS ---
  getIdleScenarios(): IdleScenario[] {
    return loadDataset().idleScenarios || initialIdleScenarios;
  },

  // --- RECOMMENDATION HISTORY ---
  getRecommendationHistory(): RecommendationHistoryItem[] {
    return loadDataset().recommendationHistory || initialHistory;
  },

  addRecommendationHistory(item: Omit<RecommendationHistoryItem, 'id' | 'date'> & { id?: string; date?: string }): RecommendationHistoryItem {
    const data = loadDataset();
    const newItem: RecommendationHistoryItem = {
      ...item,
      id: item.id || `rec_hist_${Date.now()}`,
      date: item.date || new Date().toISOString().split('T')[0],
    };
    if (!data.recommendationHistory) data.recommendationHistory = [];
    data.recommendationHistory.unshift(newItem);
    saveDataset(data);
    return newItem;
  },

  updateRecommendationStatus(id: string, status: 'accepted' | 'under_review' | 'archived'): boolean {
    const data = loadDataset();
    if (!data.recommendationHistory) data.recommendationHistory = [...initialHistory];
    const index = data.recommendationHistory.findIndex((h) => h.id === id);
    if (index === -1) return false;
    data.recommendationHistory[index].status = status;
    saveDataset(data);
    return true;
  },

  // --- MARKET ENTRY RECOMMENDATIONS ---
  getMarketEntryRecommendations(): MarketEntryRecommendation[] {
    return loadDataset().marketEntryRecommendations || initialMarketEntry;
  },

  // --- CSV BULK IMPORT ---
  importCSV(category: 'vessels' | 'ports' | 'routes' | 'orders', csvText: string): { success: boolean; count: number; error?: string } {
    try {
      const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return { success: false, count: 0, error: 'CSV file must have at least header + 1 row.' };

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
      const data = loadDataset();
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (row.length < 2) continue;

        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = row[idx] || '';
        });

        if (category === 'vessels') {
          const newVessel: VesselInfo = {
            id: `v_csv_${Date.now()}_${i}`,
            name: rowObj['name'] || rowObj['vessel name'] || `Vessel ${i}`,
            type: (rowObj['type'] as any) || 'Panamax',
            capacity: parseFloat(rowObj['capacity'] || '75000') || 75000,
            draft: parseFloat(rowObj['draft'] || '14.2') || 14.2,
            loa: parseFloat(rowObj['loa'] || '225') || 225,
            beam: parseFloat(rowObj['beam'] || '32') || 32,
            speed: parseFloat(rowObj['speed'] || '14') || 14,
            status: (rowObj['status'] as any) || 'available',
            location: rowObj['location'] || 'Indian Ocean',
            availability: rowObj['availability'] || 'Immediate',
          };
          data.vessels.unshift(newVessel);
          importedCount++;
        } else if (category === 'ports') {
          const newPort: PortInfo = {
            id: `port_csv_${Date.now()}_${i}`,
            name: rowObj['name'] || rowObj['port name'] || `Port ${i}`,
            country: rowObj['country'] || 'India',
            portType: (rowObj['type'] as any) || 'discharge',
            status: (rowObj['status'] as any) || 'operational',
            congestion: (rowObj['congestion'] as any) || 'medium',
            maxDraft: parseFloat(rowObj['max draft'] || rowObj['draft'] || '16.5') || 16.5,
            maxLOA: parseFloat(rowObj['max loa'] || rowObj['loa'] || '280') || 280,
            maxBeam: parseFloat(rowObj['max beam'] || rowObj['beam'] || '45') || 45,
            maxDWT: parseFloat(rowObj['max dwt'] || '180000') || 180000,
            cargoHandlingRate: parseFloat(rowObj['handling rate'] || '25000') || 25000,
            handlingCapacity: parseFloat(rowObj['handling capacity'] || '25') || 25,
            berthCapacity: parseInt(rowObj['berth capacity'] || '16') || 16,
            avgWaitTime: parseFloat(rowObj['avg wait'] || '3.5') || 3.5,
            vesselCompatibility: ['Handysize', 'Supramax', 'Panamax', 'Capesize'],
            coordinates: [20.26, 86.67],
            location: rowObj['location'] || 'East Coast, India',
          };
          data.ports.unshift(newPort);
          importedCount++;
        } else if (category === 'routes') {
          const newRoute: RouteInfo = {
            id: `r_csv_${Date.now()}_${i}`,
            origin: rowObj['origin'] || 'Australia',
            originPort: rowObj['origin port'] || 'Newcastle',
            destination: rowObj['destination'] || 'India',
            destinationPort: rowObj['destination port'] || 'Visakhapatnam',
            currentRate: parseFloat(rowObj['current rate'] || '27.4') || 27.4,
            forecastRate: parseFloat(rowObj['forecast rate'] || '28.8') || 28.8,
            trend: (rowObj['trend'] as any) || 'increasing',
            risk: (rowObj['risk'] as any) || 'medium',
            distance: parseFloat(rowObj['distance'] || '5420') || 5420,
            duration: parseFloat(rowObj['duration'] || '21') || 21,
            congestion: 'medium',
            coordinates: {
              origin: [-32.92, 151.78],
              destination: [17.68, 83.21],
            },
          };
          data.routes.unshift(newRoute);
          importedCount++;
        } else if (category === 'orders') {
          const newOrder: CargoOrder = {
            id: `ord_csv_${Date.now()}_${i}`,
            orderNumber: rowObj['order number'] || `ORD-CSV-${i}`,
            cargoType: (rowObj['cargo type'] as any) || 'Coal',
            quantityMT: parseFloat(rowObj['quantity'] || '75000') || 75000,
            originPort: rowObj['origin port'] || 'Newcastle',
            destinationPort: rowObj['destination port'] || 'Visakhapatnam',
            requiredArrivalDate: rowObj['arrival date'] || '2026-11-20',
            charterType: (rowObj['charter type'] as any) || 'Spot',
            status: (rowObj['status'] as any) || 'tender_open',
            budgetUSD: parseFloat(rowObj['budget'] || '2100000') || 2100000,
            estimatedFreightUSD: parseFloat(rowObj['estimatedfreight'] || '2050000') || 2050000,
            notes: rowObj['notes'] || 'Bulk procurement order.',
            createdAt: new Date().toISOString().split('T')[0],
          };
          data.cargoOrders.unshift(newOrder);
          importedCount++;
        }
      }

      saveDataset(data);
      return { success: true, count: importedCount };
    } catch (err: any) {
      return { success: false, count: 0, error: err?.message || 'CSV Parsing Error' };
    }
  },

  // --- CSV EXPORT GENERATOR ---
  exportToCSV(category: 'vessels' | 'ports' | 'routes' | 'orders'): string {
    const data = loadDataset();
    if (category === 'vessels') {
      const headers = ['Name', 'Type', 'Capacity (DWT)', 'Draft (m)', 'LOA (m)', 'Beam (m)', 'Speed (kn)', 'Status', 'Location', 'Availability'];
      const rows = data.vessels.map((v) => [
        `"${v.name}"`, v.type, v.capacity, v.draft, v.loa, v.beam, v.speed, v.status, `"${v.location}"`, `"${v.availability}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    if (category === 'ports') {
      const headers = ['Port Name', 'Country', 'Type', 'Status', 'Congestion', 'Max Draft (m)', 'Max LOA (m)', 'Max Beam (m)', 'Handling Rate (MT/day)', 'Avg Wait (days)', 'Location'];
      const rows = data.ports.map((p) => [
        `"${p.name}"`, `"${p.country}"`, p.portType, p.status, p.congestion, p.maxDraft, p.maxLOA, p.maxBeam, p.cargoHandlingRate, p.avgWaitTime, `"${p.location}"`,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    if (category === 'routes') {
      const headers = ['Origin', 'Origin Port', 'Destination', 'Destination Port', 'Current Rate ($/MT)', 'Forecast Rate ($/MT)', 'Trend', 'Risk', 'Distance (NM)', 'Duration (days)'];
      const rows = data.routes.map((r) => [
        `"${r.origin}"`, `"${r.originPort}"`, `"${r.destination}"`, `"${r.destinationPort}"`, r.currentRate, r.forecastRate, r.trend, r.risk, r.distance, r.duration,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    if (category === 'orders') {
      const headers = ['Order Number', 'Cargo Type', 'Quantity (MT)', 'Origin Port', 'Destination Port', 'Arrival Date', 'Charter Type', 'Status', 'Budget ($)', 'Estimated Freight ($)'];
      const rows = data.cargoOrders.map((o) => [
        `"${o.orderNumber}"`, `"${o.cargoType}"`, o.quantityMT, `"${o.originPort}"`, `"${o.destinationPort}"`, o.requiredArrivalDate, o.charterType, o.status, o.budgetUSD, o.estimatedFreightUSD,
      ]);
      return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }
    return '';
  },

  // --- RESET MASTER DATA ---
  resetToDefaults(): void {
    const defaultData: MasterDataset = {
      users: initialUsers,
      vessels: initialVessels,
      ports: initialPorts,
      routes: initialRoutes,
      freightRates: initialFreightRates,
      cargoOrders: initialCargoOrders,
      earlyWarnings: initialAlerts,
      idleScenarios: initialIdleScenarios,
      recommendationHistory: initialHistory,
      marketEntryRecommendations: initialMarketEntry,
      lastUpdated: new Date().toISOString(),
    };
    saveDataset(defaultData);
  },
};
