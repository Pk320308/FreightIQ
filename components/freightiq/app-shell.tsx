'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Ship,
  Anchor,
  AlertTriangle,
  FileText,
  Settings,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Waves,
  Database,
  Shield,
  Sparkles,
  FileCheck2,
  Lock,
  Clock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase-client';
import {
  getRouteAccess,
  canAccessRoute,
  isReadOnlyRoute,
  ROLE_DEFINITIONS,
  normalizeRole,
  type UserRole,
} from '@/backend/security/rbac';
import { AccessDenied } from '@/components/freightiq/access-denied';
import { ReadOnlyBanner } from '@/components/freightiq/read-only-banner';

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  defaultChildHref?: string;
  icon: React.ElementType;
  children?: NavChild[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Chartering Engine', href: '/chartering', icon: Sparkles },
  {
    label: 'Freight Intelligence',
    href: '/freight',
    defaultChildHref: '/freight/forecast',
    icon: TrendingUp,
    children: [
      { label: 'Freight Forecast', href: '/freight/forecast' },
      { label: 'Route Intelligence', href: '/freight/routes' },
      { label: 'Market Analysis', href: '/freight/market' },
    ],
  },
  {
    label: 'Vessel Management',
    href: '/vessels',
    defaultChildHref: '/vessels/matching',
    icon: Ship,
    children: [
      { label: 'Vessel Matching', href: '/vessels/matching' },
      { label: 'Multi-Voyage Optimizer', href: '/vessels/charter' },
      { label: 'Idle & Repositioning', href: '/idle-management' },
      { label: 'Vessel Overview', href: '/vessels/overview' },
    ],
  },
  {
    label: 'Port Intelligence',
    href: '/ports',
    defaultChildHref: '/ports/overview',
    icon: Anchor,
    children: [
      { label: 'Port Overview', href: '/ports/overview' },
      { label: 'Port Constraints', href: '/ports/constraints' },
      { label: 'Port Congestion & Queues', href: '/ports/congestion' },
    ],
  },
  {
    label: 'Risk & Analytics',
    href: '/risk',
    defaultChildHref: '/risk/simulator',
    icon: AlertTriangle,
    children: [
      { label: 'Scenario Simulator', href: '/risk/simulator' },
      { label: 'Risk & Early Warnings', href: '/risk/analysis' },
    ],
  },
  { label: 'Audit & Recommendations', href: '/recommendations', icon: FileCheck2 },
  { label: 'Data Management', href: '/data', icon: Database },
  { label: 'Reports & Dossier', href: '/reports', icon: FileText },
  { label: 'System Governance', href: '/settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'Freight Intelligence',
    'Vessel Management',
    'Port Intelligence',
    'Risk & Analytics',
  ]);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('freightiq-theme');
    const dark = savedTheme ? savedTheme === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
    setIsDark(dark);
  }, []);

  useEffect(() => {
    if (!user || user.id === 'usr_sih_2026') return;
    supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  const toggleSection = (e: React.MouseEvent, label: string) => {
    e.stopPropagation();
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label],
    );
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  const isChildActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    document.documentElement.classList.toggle('dark', nextIsDark);
    window.localStorage.setItem('freightiq-theme', nextIsDark ? 'dark' : 'light');
    setIsDark(nextIsDark);
  };

  // Normalized Role & Identity Metadata
  const normalizedUserRole = normalizeRole(profile?.role || role);
  const roleMeta = ROLE_DEFINITIONS[normalizedUserRole];

  const displayName = profile?.full_name || user?.user_metadata?.full_name || roleMeta.displayName;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Filter Navigation Items strictly according to RBAC Matrix
  const visibleNavItems = useMemo(() => {
    return ALL_NAV_ITEMS.map((item) => {
      // If item has children, filter children that user has access to
      if (item.children?.length) {
        const allowedChildren = item.children.filter((child) =>
          canAccessRoute(normalizedUserRole, child.href)
        );

        if (allowedChildren.length === 0) return null;

        return {
          ...item,
          children: allowedChildren,
          defaultChildHref: allowedChildren[0]?.href || item.defaultChildHref,
        };
      }

      // Single item
      if (!canAccessRoute(normalizedUserRole, item.href)) {
        return null;
      }

      return item;
    }).filter(Boolean) as NavItem[];
  }, [normalizedUserRole]);

  // Evaluate Access for Current Route
  const routeAccessLevel = getRouteAccess(normalizedUserRole, pathname);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/40">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <Waves className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-none">FreightIQ</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Maritime Intelligence</p>
          </div>
        </Link>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground transition-all hover:bg-muted hover:scale-105"
        >
          {isDark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-primary" />}
        </button>
      </div>

      {/* Role Clearance Strip */}
      <div className="px-4 py-2.5 bg-muted/30 border-b border-border/40 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground font-medium">Role Clearance:</span>
        <span className={cn('px-2 py-0.5 rounded font-bold border text-[10px]', roleMeta.badgeClass)}>
          {roleMeta.displayName.split(' ')[0]} ({normalizedUserRole.toUpperCase()})
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleNavItems.map((item) => {
          const hasChildren = !!item.children?.length;
          const isExpanded = expandedSections.includes(item.label);
          const Icon = item.icon;
          const targetHref = item.defaultChildHref || item.href;
          const isReadOnly = isReadOnlyRoute(normalizedUserRole, item.href);

          if (!hasChildren) {
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive(item.href)
                    ? 'bg-primary/20 text-primary font-bold'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isReadOnly && (
                  <span className="text-[10px] text-muted-foreground font-mono opacity-80">👁️</span>
                )}
              </Link>
            );
          }

          return (
            <div key={item.label}>
              <div className="flex items-center">
                <Link
                  href={targetHref}
                  prefetch={true}
                  onClick={() => {
                    setMobileOpen(false);
                    if (!isExpanded) {
                      setExpandedSections((prev) => [...prev, item.label]);
                    }
                  }}
                  className={cn(
                    'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isActive(item.href)
                      ? 'text-foreground font-bold'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => toggleSection(e, item.label)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')}
                  />
                </button>
              </div>

              {isExpanded && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border/40 pl-3">
                  {item.children!.map((child) => {
                    const childReadOnly = isReadOnlyRoute(normalizedUserRole, child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        prefetch={true}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                          isChildActive(child.href)
                            ? 'bg-primary/20 text-primary font-bold'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        )}
                      >
                        <span>{child.label}</span>
                        {childReadOnly && (
                          <span className="text-[10px] text-muted-foreground font-mono opacity-80">👁️</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Live System Date & Time Widget (Above Profile & Logout) */}
      <div className="border-t border-border/40 px-3.5 py-2.5 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
            <span className="text-xs font-mono font-bold text-foreground">
              {currentDateTime
                ? currentDateTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })
                : '--:--:--'}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
            IST
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground font-medium">
          <Calendar className="h-3 w-3 text-muted-foreground/70 shrink-0" />
          <span className="truncate">
            {currentDateTime
              ? currentDateTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Loading date...'}
          </span>
        </div>
      </div>

      {/* User Identity Box */}
      <div className="border-t border-border/40 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-primary/50 text-xs font-bold text-white shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground font-medium truncate">{roleMeta.displayName}</p>
          </div>
          <button onClick={handleSignOut} title="Sign Out" className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  const currentNav = ALL_NAV_ITEMS.find((item) => isActive(item.href));
  const currentChild = currentNav?.children?.find((child) => isChildActive(child.href));
  const pageTitle = currentChild?.label ?? currentNav?.label ?? 'FreightIQ';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border/40 glass lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 flex-col border-r border-border/40 glass flex animate-slide-in-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Mobile Sidebar Trigger (Visible on small screens only) */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open Navigation Menu"
          className="fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/85 backdrop-blur text-foreground shadow-lg transition-transform hover:scale-105 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Route Guard Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {routeAccessLevel === 'no_access' ? (
            <AccessDenied currentRole={normalizedUserRole} pathname={pathname} />
          ) : (
            <>
              {routeAccessLevel === 'read_only' && (
                <ReadOnlyBanner currentRole={normalizedUserRole} moduleName={pageTitle} />
              )}
              {children}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
