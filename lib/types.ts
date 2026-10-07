export type RiskLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type OperationalStatus = 'operational' | 'congested' | 'restricted' | 'closed';
export type CargoType = 'Coal' | 'Iron Ore' | 'Steel' | 'Other Bulk Cargo';
export type VesselType = 'Handysize' | 'Supramax' | 'Panamax' | 'Capesize';
export type ForecastHorizon = '7d' | '30d' | '60d' | '90d';
export type Compatibility = 'pass' | 'fail' | 'restricted';
export type Suitability = 'recommended' | 'suitable' | 'not-suitable';
export type PortType = 'loading' | 'discharge';
export type ContractType = 'SPOT' | 'SHORT_TERM_3M' | 'MEDIUM_TERM_6M';

export interface KpiData {
  label: string;
  value: string;
  unit?: string;
  change?: string;
  trend?: TrendDirection;
  risk?: RiskLevel;
}

export interface FreightRatePoint {
  date: string;
  historical: number | null;
  forecast: number | null;
  upperBound: number | null;
  lowerBound: number | null;
}

export interface RouteInfo {
  id: string;
  origin: string;
  originPort: string;
  destination: string;
  destinationPort: string;
  currentRate: number;
  forecastRate: number;
  trend: TrendDirection;
  risk: RiskLevel;
  distance: number;
  duration: number;
  congestion: RiskLevel;
  coordinates: {
    origin: [number, number];
    destination: [number, number];
  };
}

export interface PortInfo {
  id: string;
  name: string;
  country: string;
  portType: PortType;
  status: OperationalStatus;
  congestion: RiskLevel;
  maxDraft: number;
  maxLOA: number;
  maxBeam: number;
  maxDWT: number;
  cargoHandlingRate: number; // MT / Day
  handlingCapacity?: number;
  berthCapacity: number;
  avgWaitTime: number; // in days
  averageWaitTime?: number;
  avgWaitTimeHours?: number;
  waitingVessels?: number;
  waitingVesselsCount?: number;
  berthUtilizationPct?: number;
  vesselCompatibility: VesselType[];
  coordinates: [number, number];
  location: string;
  source?: string;
  lastUpdated?: string;
}

export interface VesselInfo {
  id: string;
  name: string;
  type: VesselType;
  capacity: number; // DWT
  draft: number;
  loa: number;
  beam: number;
  speed: number;
  availability: string;
  status: 'available' | 'on-voyage' | 'in-port' | 'under-maintenance';
  location: string;
  dailyFuelConsumptionMT?: number;
  dailyCharterRateUSD?: number;
}

export interface PortCompatibilityCheck {
  compatible: boolean;
  reason: string;
  draftCheck: boolean;
  loaCheck: boolean;
  beamCheck: boolean;
  dwtCheck: boolean;
}

export interface VesselMatchResult {
  vesselType: VesselType;
  capacity: number;
  draft: number;
  loa: number;
  beam: number;
  loadingPortCompatibility: PortCompatibilityCheck;
  dischargePortCompatibility: PortCompatibilityCheck;
  cargoCompatibility: 'suitable' | 'insufficient-capacity';
  estimatedHandlingDays: number;
  estimatedBerthWaitDays: number;
  totalPortStayDays: number;
  estimatedFreightRatePerMT: number;
  compatibilityScore: number; // 0 - 100%
  suitability: Suitability;
  reasons: string[];
}

export interface RiskFactor {
  name: string;
  level: RiskLevel;
  percentage: number;
  description: string;
}

export interface RiskTrendPoint {
  date: string;
  freight: number;
  congestion: number;
  fuel: number;
  weather: number;
  vesselSupply: number;
}

export interface ForecastResult {
  currentRate: number;
  forecast7d: number;
  forecast30d: number;
  forecast60d: number;
  forecast90d: number;
  trend: TrendDirection;
  volatility: RiskLevel;
  confidence: number;
  confidenceLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  data: FreightRatePoint[];
  factors: ForecastFactor[];
  explanation: string;
  source?: string;
}

export interface ForecastFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  strength: number;
  description: string;
}

export interface MarketEntryRecommendation {
  id: string;
  route: string;
  vesselType: VesselType;
  cargoQuantity: number;
  currentRate: number;
  forecastRate30d: number;
  forecastRate60d: number;
  entryWindow: string; // e.g. "Next 7–10 Days"
  strategy: string; // e.g. "Secure 3-Month Multi-Voyage Charter"
  marketDirection: TrendDirection;
  confidence: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  createdAt: string;
}

export interface ContractComparisonOption {
  type: ContractType;
  label: string;
  durationMonths: number;
  voyageCount: number;
  freightRatePerMT: number;
  totalCargoMT: number;
  estimatedFreightCost: number;
  bunkerCost: number;
  portCost: number;
  demurrageAndIdleCost: number;
  totalLandedCost: number;
  costPerMT: number;
  expectedSavingsVsSpot: number;
  flexibility: 'high' | 'medium' | 'low';
  riskLevel: RiskLevel;
  idleRisk: RiskLevel;
  isRecommended: boolean;
  recommendationRationale: string;
}

export interface IdleScenario {
  id: string;
  vesselName: string;
  vesselType: VesselType;
  dischargePort: string;
  expectedIdleDays: number;
  dailyIdleCostUSD: number;
  totalIdleCostUSD: number;
  idleRisk: RiskLevel;
  currentPosition: string;
  nextCargoLocation: string;
  deadheadDistanceNM: number;
  deadheadFuelCostUSD: number;
  recommendedRepositioning: string;
  alternativeRoute: string;
  estimatedIdleReductionDays: number;
  netSavingsUSD: number;
  reason: string;
}

export interface EarlyWarningAlert {
  id: string;
  category: 'freight_market' | 'port_congestion' | 'weather_disruption' | 'vessel_idle' | 'market_entry_window' | 'contract_deadline';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  portOrRoute?: string;
  timestamp: string;
  actionRequired: string;
}

export interface RecommendationHistoryItem {
  id: string;
  date: string;
  cargoType: CargoType;
  quantityMT: number;
  originPort: string;
  destinationPort: string;
  recommendedVessel: VesselType;
  recommendedStrategy: ContractType;
  estimatedTotalCostUSD: number;
  costPerMT: number;
  estimatedSavingsUSD: number;
  reasons: string[];
  status: 'accepted' | 'under_review' | 'archived';
}

export interface MarketInsight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'warning' | 'info' | 'opportunity';
  icon: string;
}

export interface ReportInfo {
  id: string;
  title: string;
  type: string;
  route: string;
  generatedDate: string;
  status: 'ready' | 'processing' | 'draft';
  summary: string;
  sections: ReportSection[];
}

export interface ReportSection {
  heading: string;
  content: string;
}

export interface SimulationResult {
  estimatedTotalCost: number;
  estimatedFreightCost: number;
  expectedDelay: number;
  idleCost: number;
  demurrageRisk: RiskLevel;
  overallRisk: RiskLevel;
}

export interface SimulationInput {
  cargoQuantity: number;
  freightRate: number;
  fuelPrice: number;
  portCongestion: RiskLevel;
  vesselType: VesselType;
  voyageDuration: number;
}

export type UserRole = 'ministry_admin' | 'procurement_manager' | 'charter_specialist' | 'logistics_analyst';

export interface CargoOrder {
  id: string;
  orderNumber: string;
  cargoType: CargoType;
  quantityMT: number;
  originPort: string;
  destinationPort: string;
  requiredArrivalDate: string;
  charterType: 'Spot' | 'Time Charter' | 'COA';
  allocatedVesselId?: string;
  allocatedVesselName?: string;
  status: 'draft' | 'tender_open' | 'chartered' | 'in_transit' | 'discharged';
  budgetUSD: number;
  estimatedFreightUSD: number;
  notes?: string;
  createdAt: string;
}
