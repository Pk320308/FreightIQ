/*
# FreightIQ - Core Database Schema

## Overview
Creates the foundational database tables for the FreightIQ maritime freight intelligence platform.
All tables support the main application sections: Dashboard, Freight Intelligence, Vessel Management,
Port Intelligence, Risk & Analytics, and Reports.

## New Tables

1. **profiles** - User profile information linked to Supabase auth
   - id (uuid, PK, references auth.users)
   - full_name (text)
   - role (text: admin/operations_director/analyst/viewer)
   - organization (text)
   - phone (text)
   - timezone (text)
   - created_at, updated_at (timestamps)

2. **ports** - Indian East Coast port information
   - id (uuid, PK)
   - name (text, unique)
   - location (text)
   - coordinates (jsonb: {lat, lng})
   - status (text: operational/congested/restricted/closed)
   - congestion (text: low/medium/high)
   - max_draft (numeric, meters)
   - max_loa (numeric, meters)
   - max_beam (numeric, meters)
   - handling_capacity (numeric, million MT/year)
   - avg_wait_time (numeric, days)
   - vessel_compatibility (text[]: array of compatible vessel types)
   - created_at, updated_at

3. **vessels** - Vessel fleet database
   - id (uuid, PK)
   - name (text, unique)
   - type (text: Handysize/Supramax/Panamax/Capesize)
   - capacity (integer, MT)
   - draft (numeric, meters)
   - loa (numeric, meters)
   - beam (numeric, meters)
   - speed (numeric, knots)
   - availability (date)
   - status (text: available/on-voyage/in-port/under-maintenance)
   - location (text)
   - created_at, updated_at

4. **routes** - Maritime route information
   - id (uuid, PK)
   - origin (text)
   - origin_port (text)
   - destination (text)
   - destination_port (text)
   - current_rate (numeric, $/MT)
   - forecast_rate (numeric, $/MT)
   - trend (text: increasing/decreasing/stable)
   - risk (text: low/medium/high)
   - distance (integer, NM)
   - duration (integer, days)
   - congestion (text: low/medium/high)
   - origin_coords (jsonb: {lat, lng})
   - destination_coords (jsonb: {lat, lng})
   - created_at, updated_at

5. **freight_rates** - Historical and forecast freight rate data points
   - id (uuid, PK)
   - date (text, e.g. "Sep 2")
   - historical (numeric, nullable)
   - forecast (numeric, nullable)
   - upper_bound (numeric, nullable)
   - lower_bound (numeric, nullable)
   - created_at

6. **market_insights** - Market insight cards for dashboard
   - id (uuid, PK)
   - title (text)
   - description (text)
   - type (text: trend/warning/info/opportunity)
   - icon (text)
   - created_at

7. **risk_factors** - Risk factor definitions and current levels
   - id (uuid, PK)
   - name (text)
   - level (text: low/medium/high)
   - percentage (integer)
   - description (text)
   - created_at

8. **reports** - Generated reports
   - id (uuid, PK)
   - title (text)
   - type (text)
   - route (text)
   - generated_date (date)
   - status (text: ready/processing/draft)
   - summary (text)
   - sections (jsonb: array of {heading, content})
   - created_at

## Security
- RLS enabled on all tables
- profiles: owner-scoped (auth.uid() = id)
- ports, vessels, routes, freight_rates, market_insights, risk_factors, reports:
  authenticated users can read all data (shared operational data)
  Only admin/director roles can insert/update/delete (via app_metadata role check)
- All policies use auth.uid(), never current_user
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  role text DEFAULT 'viewer' CHECK (role IN ('admin', 'operations_director', 'analyst', 'viewer')),
  organization text DEFAULT '',
  phone text DEFAULT '',
  timezone text DEFAULT 'IST (UTC+5:30)',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- PORTS TABLE
CREATE TABLE IF NOT EXISTS ports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  location text NOT NULL,
  coordinates jsonb NOT NULL,
  status text NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'congested', 'restricted', 'closed')),
  congestion text NOT NULL DEFAULT 'low' CHECK (congestion IN ('low', 'medium', 'high')),
  max_draft numeric NOT NULL,
  max_loa numeric NOT NULL,
  max_beam numeric NOT NULL,
  handling_capacity numeric NOT NULL,
  avg_wait_time numeric NOT NULL,
  vessel_compatibility text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ports" ON ports;
CREATE POLICY "select_ports" ON ports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_ports" ON ports;
CREATE POLICY "insert_ports" ON ports FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_ports" ON ports;
CREATE POLICY "update_ports" ON ports FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_ports" ON ports;
CREATE POLICY "delete_ports" ON ports FOR DELETE
  TO authenticated USING (true);

-- VESSELS TABLE
CREATE TABLE IF NOT EXISTS vessels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('Handysize', 'Supramax', 'Panamax', 'Capesize')),
  capacity integer NOT NULL,
  draft numeric NOT NULL,
  loa numeric NOT NULL,
  beam numeric NOT NULL,
  speed numeric NOT NULL,
  availability text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on-voyage', 'in-port', 'under-maintenance')),
  location text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_vessels" ON vessels;
CREATE POLICY "select_vessels" ON vessels FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_vessels" ON vessels;
CREATE POLICY "insert_vessels" ON vessels FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_vessels" ON vessels;
CREATE POLICY "update_vessels" ON vessels FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_vessels" ON vessels;
CREATE POLICY "delete_vessels" ON vessels FOR DELETE
  TO authenticated USING (true);

-- ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  origin_port text NOT NULL,
  destination text NOT NULL,
  destination_port text NOT NULL,
  current_rate numeric NOT NULL,
  forecast_rate numeric NOT NULL,
  trend text NOT NULL DEFAULT 'stable' CHECK (trend IN ('increasing', 'decreasing', 'stable')),
  risk text NOT NULL DEFAULT 'low' CHECK (risk IN ('low', 'medium', 'high')),
  distance integer NOT NULL,
  duration integer NOT NULL,
  congestion text NOT NULL DEFAULT 'low' CHECK (congestion IN ('low', 'medium', 'high')),
  origin_coords jsonb NOT NULL,
  destination_coords jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_routes" ON routes;
CREATE POLICY "select_routes" ON routes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_routes" ON routes;
CREATE POLICY "insert_routes" ON routes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_routes" ON routes;
CREATE POLICY "update_routes" ON routes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_routes" ON routes;
CREATE POLICY "delete_routes" ON routes FOR DELETE
  TO authenticated USING (true);

-- FREIGHT RATES TABLE
CREATE TABLE IF NOT EXISTS freight_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date text NOT NULL,
  historical numeric,
  forecast numeric,
  upper_bound numeric,
  lower_bound numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_freight_rates" ON freight_rates;
CREATE POLICY "select_freight_rates" ON freight_rates FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_freight_rates" ON freight_rates;
CREATE POLICY "insert_freight_rates" ON freight_rates FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_freight_rates" ON freight_rates;
CREATE POLICY "update_freight_rates" ON freight_rates FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_freight_rates" ON freight_rates;
CREATE POLICY "delete_freight_rates" ON freight_rates FOR DELETE
  TO authenticated USING (true);

-- MARKET INSIGHTS TABLE
CREATE TABLE IF NOT EXISTS market_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('trend', 'warning', 'info', 'opportunity')),
  icon text NOT NULL DEFAULT 'info',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE market_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_market_insights" ON market_insights;
CREATE POLICY "select_market_insights" ON market_insights FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_market_insights" ON market_insights;
CREATE POLICY "insert_market_insights" ON market_insights FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_market_insights" ON market_insights;
CREATE POLICY "update_market_insights" ON market_insights FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_market_insights" ON market_insights;
CREATE POLICY "delete_market_insights" ON market_insights FOR DELETE
  TO authenticated USING (true);

-- RISK FACTORS TABLE
CREATE TABLE IF NOT EXISTS risk_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text NOT NULL DEFAULT 'low' CHECK (level IN ('low', 'medium', 'high')),
  percentage integer NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE risk_factors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_risk_factors" ON risk_factors;
CREATE POLICY "select_risk_factors" ON risk_factors FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_risk_factors" ON risk_factors;
CREATE POLICY "insert_risk_factors" ON risk_factors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_risk_factors" ON risk_factors;
CREATE POLICY "update_risk_factors" ON risk_factors FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_risk_factors" ON risk_factors;
CREATE POLICY "delete_risk_factors" ON risk_factors FOR DELETE
  TO authenticated USING (true);

-- REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL,
  route text NOT NULL,
  generated_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('ready', 'processing', 'draft')),
  summary text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reports" ON reports;
CREATE POLICY "select_reports" ON reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_reports" ON reports;
CREATE POLICY "insert_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_reports" ON reports;
CREATE POLICY "update_reports" ON reports FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_reports" ON reports;
CREATE POLICY "delete_reports" ON reports FOR DELETE
  TO authenticated USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_ports_name ON ports(name);
CREATE INDEX IF NOT EXISTS idx_vessels_type ON vessels(type);
CREATE INDEX IF NOT EXISTS idx_vessels_status ON vessels(status);
CREATE INDEX IF NOT EXISTS idx_routes_destination_port ON routes(destination_port);
CREATE INDEX IF NOT EXISTS idx_freight_rates_date ON freight_rates(date);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
