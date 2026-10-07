import type {
  KpiData,
  FreightRatePoint,
  RouteInfo,
  PortInfo,
  VesselInfo,
  VesselMatchResult,
  RiskFactor,
  RiskTrendPoint,
  MarketInsight,
  ForecastResult,
  ReportInfo,
  SimulationResult,
  SimulationInput,
  CargoType,
  VesselType,
  ForecastHorizon,
} from '@/lib/types';
import {
  dashboardKpis,
  freightRateData as mockFreightRates,
  routes as mockRoutes,
  ports as mockPorts,
  vessels as mockVessels,
  riskFactors as mockRiskFactors,
  riskTrendData,
  marketInsights as mockInsights,
  forecastFactors,
  reports as mockReports,
} from '@/lib/mock-data';
import { dataStore } from '@/lib/data-store';
import { evaluateVesselMatching, evaluateCharteringStrategy, type CharterComparisonResult } from '@/lib/maritime-engine';
import { supabase } from '@/lib/supabase-client';

const API_BASE_URL = '/api';

// Fast non-blocking timeout fetch helper
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 1200): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function withFallback<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return promise.catch(() => fallback);
}

function getAuthHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

export const api = {
  async getDashboardData(): Promise<{
    kpis: KpiData[];
    freightRates: FreightRatePoint[];
    routes: RouteInfo[];
    ports: PortInfo[];
    insights: MarketInsight[];
  }> {
    const localRoutes = dataStore.getRoutes();
    const localPorts = dataStore.getPorts();
    const localRates = dataStore.getFreightRates();

    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/dashboard`, { headers: getAuthHeaders() }).then((res) => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      }),
      {
        kpis: dashboardKpis,
        freightRates: localRates.length ? localRates : mockFreightRates,
        routes: localRoutes.length ? localRoutes : mockRoutes,
        ports: localPorts.length ? localPorts : mockPorts,
        insights: mockInsights,
      },
    );
  },

  async getDashboardKpis(): Promise<KpiData[]> {
    return withFallback(
      this.getDashboardData().then((d) => d.kpis),
      dashboardKpis,
    );
  },

  async getFreightRateData(): Promise<FreightRatePoint[]> {
    const local = dataStore.getFreightRates();
    return local.length ? local : mockFreightRates;
  },

  async generateForecast(params: {
    originPort: string;
    destinationPort: string;
    cargoType: CargoType;
    cargoQuantity: number;
    vesselType: VesselType;
    horizon: ForecastHorizon;
  }): Promise<ForecastResult> {
    const localRates = dataStore.getFreightRates();
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/forecast`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      }).then((r) => r.json()),
      {
        currentRate: 27.40,
        forecast7d: 28.10,
        forecast30d: 29.10,
        forecast60d: 29.98,
        forecast90d: 31.40,
        trend: 'increasing',
        volatility: 'medium',
        confidence: 84,
        data: localRates.length ? localRates : mockFreightRates,
        factors: forecastFactors,
        explanation: `Forecast projects a bullish freight trend for ${params.cargoType} via ${params.vesselType} from ${params.originPort} to ${params.destinationPort}. Strong coal import demand from Indian steel mills and firming bunker benchmarks are primary drivers.`,
      },
    );
  },

  async getRoutes(): Promise<RouteInfo[]> {
    const local = dataStore.getRoutes();
    return local.length ? local : mockRoutes;
  },

  async getVessels(): Promise<VesselInfo[]> {
    const local = dataStore.getVessels();
    return local.length ? local : mockVessels;
  },

  async matchVessels(params: {
    cargoQuantity: number;
    destinationPort: string;
    originPort?: string;
    cargoType?: CargoType;
    fuelPrice?: number;
    requiredDate?: string;
    preferredVesselType?: VesselType;
  }): Promise<VesselMatchResult[]> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/vessels/match`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      }).then((r) => r.json()),
      evaluateVesselMatching({
        cargoQuantity: params.cargoQuantity,
        destinationPort: params.destinationPort,
        originPort: params.originPort,
        cargoType: params.cargoType,
        fuelPrice: params.fuelPrice,
      }),
    );
  },

  async evaluateCharterStrategy(params: {
    annualDemandMT?: number;
    parcelSizeMT?: number;
    vesselType?: VesselType;
    originPort?: string;
    destinationPort?: string;
    currentSpotFreightPerMT?: number;
  }): Promise<CharterComparisonResult> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/vessels/charter`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      }).then((r) => r.json()),
      evaluateCharteringStrategy(params),
    );
  },

  async getPorts(): Promise<PortInfo[]> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/ports`, { headers: getAuthHeaders() }).then((r) => r.json()),
      mockPorts,
    );
  },

  async getPortById(id: string): Promise<PortInfo | undefined> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/ports`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id }),
      }).then((r) => r.json()),
      mockPorts.find((p) => p.id === id) ?? mockPorts[0],
    );
  },

  async getRiskFactors(): Promise<RiskFactor[]> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/risk`, { headers: getAuthHeaders() }).then((r) => r.json()),
      mockRiskFactors,
    );
  },

  async getRiskTrend(): Promise<RiskTrendPoint[]> {
    return riskTrendData;
  },

  async getMarketInsights(): Promise<MarketInsight[]> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/insights`, { headers: getAuthHeaders() }).then((r) => r.json()),
      mockInsights,
    );
  },

  async runSimulation(params: SimulationInput): Promise<SimulationResult> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/risk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params),
      }).then((r) => r.json()),
      {
        estimatedTotalCost: 2075000,
        estimatedFreightCost: 2055000,
        expectedDelay: 2.5,
        idleCost: 21250,
        demurrageRisk: 'medium',
        overallRisk: 'medium',
      },
    );
  },

  async getReports(): Promise<ReportInfo[]> {
    return withFallback(
      fetchWithTimeout(`${API_BASE_URL}/reports`, { headers: getAuthHeaders() }).then((r) => r.json()),
      mockReports,
    );
  },

  async getReportById(id: string): Promise<ReportInfo | undefined> {
    const all = await this.getReports();
    return all.find((r) => r.id === id);
  },

  async getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  },

  async updateProfile(updates: { full_name?: string; organization?: string; phone?: string; timezone?: string }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e?.message ?? 'Profile update error' };
    }
  },
};
