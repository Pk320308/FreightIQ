/**
 * Role-Based Access Control (RBAC) System for FreightIQ (SIH26006)
 * Strict Separation of Privileges across Ministry of Steel & Enterprise Logistics Roles.
 */

export type UserRole =
  | 'analyst'
  | 'procurement'
  | 'logistics'
  | 'admin'
  | 'ministry_admin'
  | 'procurement_manager'
  | 'charter_specialist'
  | 'logistics_analyst';

export type NormalizedRole = 'analyst' | 'procurement' | 'logistics' | 'admin';

export type AccessLevel = 'full' | 'read_only' | 'no_access';

export interface RoleMeta {
  id: NormalizedRole;
  displayName: string;
  department: string;
  description: string;
  badgeClass: string;
}

export const ROLE_DEFINITIONS: Record<NormalizedRole, RoleMeta> = {
  analyst: {
    id: 'analyst',
    displayName: 'Freight & Supply Chain Analyst',
    department: 'Market Intelligence Unit',
    description: 'Specialized in econometric rate forecasting, volatility indexation, and macro market analysis. Read-only on operational assets.',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  procurement: {
    id: 'procurement',
    displayName: 'Bulk Cargo Procurement Manager',
    department: 'Raw Material Procurement Division (SAIL / RINL / Tata)',
    description: 'Authorizes tenders, executes short/medium-term multi-voyage contracts, selects vessel classes, and manages procurement budgets.',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  logistics: {
    id: 'logistics',
    displayName: 'Maritime Logistics & Fleet Specialist',
    department: 'Port Operations & Fleet Management',
    description: 'Controls vessel positioning, port berth allocations, deadhead ballast minimization, alternative cargo employment, and demurrage control.',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  admin: {
    id: 'admin',
    displayName: 'Ministry of Steel System Administrator',
    department: 'National Steel Logistics & Security Oversight',
    description: 'Full governance oversight, user identity & access management, RBAC configuration, system auditing, and data integration parameters.',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
};

/**
 * Normalizes any role string to standard 4 primary roles
 */
export function normalizeRole(role?: string | null): NormalizedRole {
  if (!role) return 'analyst';
  const r = role.toLowerCase().trim();
  if (r === 'admin' || r === 'ministry_admin') return 'admin';
  if (r === 'procurement' || r === 'procurement_manager') return 'procurement';
  if (r === 'logistics' || r === 'charter_specialist' || r === 'logistics_operator') return 'logistics';
  return 'analyst';
}

/**
 * SIH26006 Authoritative Module Permission Matrix
 * Legend:
 * full = ✅ Full Access (Read, Write, Execute, Export)
 * read_only = 👁️ Read-Only Access (View allowed, Action/Create/Edit/Delete disabled)
 * no_access = ❌ No Access (Hidden from navigation, Blocked by Route Guard with 403 Forbidden)
 */
export const MODULE_PERMISSIONS: Record<
  string,
  Record<NormalizedRole, AccessLevel>
> = {
  // 1. Core Analytics & Forecasts
  '/dashboard': { analyst: 'full', procurement: 'full', logistics: 'full', admin: 'full' },
  '/freight/forecast': { analyst: 'full', procurement: 'full', logistics: 'read_only', admin: 'read_only' },
  '/freight/routes': { analyst: 'read_only', procurement: 'full', logistics: 'full', admin: 'read_only' },
  '/freight/market': { analyst: 'full', procurement: 'full', logistics: 'read_only', admin: 'read_only' },

  // 2. Vessel Management & Matching
  '/vessels/matching': { analyst: 'read_only', procurement: 'full', logistics: 'full', admin: 'read_only' },
  '/vessels/overview': { analyst: 'no_access', procurement: 'read_only', logistics: 'full', admin: 'no_access' },

  // 3. Chartering & Contract Optimization
  '/chartering': { analyst: 'no_access', procurement: 'full', logistics: 'read_only', admin: 'no_access' },
  '/vessels/charter': { analyst: 'no_access', procurement: 'full', logistics: 'read_only', admin: 'no_access' },

  // 4. Port Intelligence & Bathymetry
  '/ports/overview': { analyst: 'read_only', procurement: 'read_only', logistics: 'full', admin: 'read_only' },
  '/ports/constraints': { analyst: 'read_only', procurement: 'read_only', logistics: 'full', admin: 'no_access' },
  '/ports/congestion': { analyst: 'read_only', procurement: 'read_only', logistics: 'full', admin: 'no_access' },

  // 5. Fleet Turnaround, Positioning & Idle Reduction
  '/idle-management': { analyst: 'no_access', procurement: 'read_only', logistics: 'full', admin: 'no_access' },

  // 6. Risk, Early Warnings & Simulation
  '/risk/analysis': { analyst: 'full', procurement: 'full', logistics: 'full', admin: 'read_only' },
  '/risk/simulator': { analyst: 'no_access', procurement: 'full', logistics: 'full', admin: 'no_access' },

  // 7. Recommendations & Audit History
  '/recommendations': { analyst: 'read_only', procurement: 'full', logistics: 'read_only', admin: 'no_access' },

  // 8. Intelligence Reports & Dossiers
  '/reports': { analyst: 'full', procurement: 'full', logistics: 'full', admin: 'read_only' },

  // 9. Data Master Portal
  '/data': { analyst: 'no_access', procurement: 'full', logistics: 'full', admin: 'full' },

  // 10. System Admin Settings (User Management, RBAC, System Settings, Audit Logs)
  '/settings': { analyst: 'no_access', procurement: 'no_access', logistics: 'no_access', admin: 'full' },
};

/**
 * Evaluates route access level for given role and pathname
 */
export function getRouteAccess(roleInput: string | null | undefined, pathname: string): AccessLevel {
  const role = normalizeRole(roleInput);

  // Exact match
  if (MODULE_PERMISSIONS[pathname]) {
    return MODULE_PERMISSIONS[pathname][role];
  }

  // Prefix match (e.g. /freight/forecast/something -> /freight/forecast)
  const matchingKey = Object.keys(MODULE_PERMISSIONS).find(
    (key) => key !== '/' && pathname.startsWith(key)
  );

  if (matchingKey) {
    return MODULE_PERMISSIONS[matchingKey][role];
  }

  // Allow general public / landing
  if (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password') {
    return 'full';
  }

  // Default fallback: allow Dashboard, restrict others to read_only or no_access
  if (pathname === '/dashboard') return 'full';
  return role === 'admin' ? 'full' : 'read_only';
}

/**
 * Checks if role can access route at all (either full or read_only)
 */
export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
  return getRouteAccess(role, pathname) !== 'no_access';
}

/**
 * Checks if route is in read-only mode for the role
 */
export function isReadOnlyRoute(role: string | null | undefined, pathname: string): boolean {
  return getRouteAccess(role, pathname) === 'read_only';
}

// Backward compatibility helper
export const ROLE_PERMISSIONS: Record<UserRole, any> = {
  ministry_admin: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: true,
    canRunSimulations: true,
    canModifyPortData: true,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.admin.description,
  },
  admin: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: true,
    canRunSimulations: true,
    canModifyPortData: true,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.admin.description,
  },
  procurement_manager: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: true,
    canRunSimulations: true,
    canModifyPortData: true,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.procurement.description,
  },
  procurement: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: true,
    canRunSimulations: true,
    canModifyPortData: true,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.procurement.description,
  },
  charter_specialist: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: true,
    canRunSimulations: true,
    canModifyPortData: true,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.logistics.description,
  },
  logistics: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: true,
    canRunSimulations: true,
    canModifyPortData: true,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.logistics.description,
  },
  logistics_analyst: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: false,
    canRunSimulations: true,
    canModifyPortData: false,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.analyst.description,
  },
  analyst: {
    canViewExecutiveReports: true,
    canExecuteCharterContracts: false,
    canRunSimulations: true,
    canModifyPortData: false,
    canAccessAIBridge: true,
    description: ROLE_DEFINITIONS.analyst.description,
  },
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const norm = normalizeRole(role);
  if (norm === 'admin') return true;
  if (permission === 'canModifyPortData') return norm === 'logistics';
  if (permission === 'canExecuteCharterContracts') return norm === 'procurement';
  return true;
}
