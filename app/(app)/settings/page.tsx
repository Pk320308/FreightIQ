'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  User,
  Shield,
  Key,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Server,
  FileText,
  Lock,
  Plus,
  Trash2,
  Search,
  Sliders,
  Building2,
  UserPlus,
  Ship,
  TrendingUp,
  UserCheck,
  Filter,
  Eye,
  EyeOff,
  KeyRound,
  Edit2,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/freightiq/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  ROLE_DEFINITIONS,
  MODULE_PERMISSIONS,
  normalizeRole,
  type NormalizedRole,
} from '@/backend/security/rbac';
import { dataStore, type ManagedUser } from '@/lib/data-store';

export default function SettingsPage() {
  const { user, role } = useAuth();
  const normalizedRole = normalizeRole(role);
  const isAdmin = normalizedRole === 'admin';

  // Tabs configured strictly based on role
  const availableTabs = [
    { id: 'profile', label: 'My Profile & Security', icon: User, adminOnly: false },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'roles', label: 'Role Permissions Matrix', icon: ShieldCheck, adminOnly: true },
    { id: 'system', label: 'System Settings', icon: Sliders, adminOnly: true },
    { id: 'api', label: 'API & Data Sources', icon: Server, adminOnly: true },
    { id: 'audit', label: 'Security Audit Logs', icon: FileText, adminOnly: true },
  ].filter((t) => !t.adminOnly || isAdmin);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'users' | 'roles' | 'system' | 'api' | 'audit'>('users');
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | NormalizedRole>('all');
  const [userSearch, setUserSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'procurement' as NormalizedRole,
    department: 'Raw Material Procurement Division',
    organization: 'Steel Authority of India Ltd (SAIL)',
    password: 'Steel@2026',
  });
  const [showCreatedPassword, setShowCreatedPassword] = useState(true);

  // Profile Form State
  const [profileName, setProfileName] = useState('Ministry Officer');
  const [profileEmail, setProfileEmail] = useState('admin@steel.gov.in');
  const [profileDept, setProfileDept] = useState('Ministry of Steel, Govt of India');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // API Form State
  const [fastApiEndpoint, setFastApiEndpoint] = useState('http://localhost:8000/predict');
  const [balticDryApiKey, setBalticDryApiKey] = useState('••••••••••••••••••••••••••••••••');
  const [aisLiveTelemetry, setAisLiveTelemetry] = useState(true);

  useEffect(() => {
    setMounted(true);
    setUsersList(dataStore.getUsers());
    if (user?.user_metadata?.full_name) {
      setProfileName(user.user_metadata.full_name);
    }
    if (user?.email) {
      setProfileEmail(user.email);
    }
    if (!isAdmin) {
      setActiveTab('profile');
    } else {
      setActiveTab('users');
    }

    const unsub = dataStore.subscribe(() => {
      setUsersList(dataStore.getUsers());
    });
    return unsub;
  }, [isAdmin, user]);

  const roleMeta = ROLE_DEFINITIONS[normalizedRole];

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // User Statistics
  const stats = useMemo(() => {
    const total = usersList.length;
    const active = usersList.filter((u) => u.status === 'active').length;
    const analysts = usersList.filter((u) => u.role === 'analyst').length;
    const procurement = usersList.filter((u) => u.role === 'procurement').length;
    const logistics = usersList.filter((u) => u.role === 'logistics').length;
    const admins = usersList.filter((u) => u.role === 'admin').length;
    return { total, active, analysts, procurement, logistics, admins };
  }, [usersList]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (userSearch) {
        const q = userSearch.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          u.organization.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [usersList, roleFilter, userSearch]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      showStatus('error', 'Please provide a valid Name and Official Email.');
      return;
    }

    const created = dataStore.addUser({
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim().toLowerCase(),
      role: newUserForm.role,
      department: newUserForm.department.trim(),
      organization: newUserForm.organization.trim(),
      password: newUserForm.password,
      status: 'active',
      createdBy: user?.email || 'admin@steel.gov.in',
    });

    setIsCreateModalOpen(false);
    showStatus('success', `Account created for "${created.name}" with role "${ROLE_DEFINITIONS[created.role].displayName}"!`);
    setNewUserForm({
      name: '',
      email: '',
      role: 'procurement',
      department: 'Raw Material Procurement Division',
      organization: 'Steel Authority of India Ltd (SAIL)',
      password: 'Steel@' + Math.floor(1000 + Math.random() * 9000),
    });
  };

  const handleUpdateUserRole = (userId: string, newRole: NormalizedRole) => {
    if (!isAdmin) return;
    dataStore.updateUser(userId, { role: newRole });
    showStatus('success', `User role updated to ${ROLE_DEFINITIONS[newRole].displayName}.`);
  };

  const handleToggleUserStatus = (userId: string) => {
    if (!isAdmin) return;
    dataStore.toggleUserStatus(userId);
    showStatus('success', 'User account status toggled.');
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (!isAdmin) return;
    if (confirm(`Are you sure you want to delete user "${userName}"?`)) {
      const deleted = dataStore.deleteUser(userId);
      if (deleted) {
        showStatus('success', `User "${userName}" deleted from system directory.`);
      } else {
        showStatus('error', 'Root Administrator account cannot be deleted.');
      }
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Governance, Identity & Security Settings"
          subtitle="Role-Based Access Control (RBAC), user directory management, and Ministry audit compliance"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-card/60 rounded-xl border border-border/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Governance, Identity & Security Settings"
        subtitle="Role-Based Access Control (RBAC), user directory management, and Ministry audit compliance"
      />

      {/* Global Status Banner */}
      {statusMessage && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold animate-in fade-in slide-in-from-top-2',
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Session Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur p-4 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Active Session:</span>
              <Badge className={roleMeta.badgeClass} variant="outline">
                {roleMeta.displayName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {roleMeta.department} — {roleMeta.description}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/30 bg-amber-500/10 self-start sm:self-auto flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Administrative panels restricted
          </Badge>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-border/40'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.adminOnly && (
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded border border-purple-500/30">
                  ADMIN
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: User Management (Admin Only) */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-5">
          {/* User Account KPI Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-card/70 backdrop-blur border-border p-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Total Users</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-foreground">{stats.total}</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
            </Card>
            <Card className="bg-card/70 backdrop-blur border-border p-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Active Status</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-emerald-400">{stats.active}</span>
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
            </Card>
            <Card className="bg-card/70 backdrop-blur border-border p-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Procurement</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-emerald-400">{stats.procurement}</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
            </Card>
            <Card className="bg-card/70 backdrop-blur border-border p-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Logistics</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-amber-400">{stats.logistics}</span>
                <Ship className="w-4 h-4 text-amber-400" />
              </div>
            </Card>
            <Card className="bg-card/70 backdrop-blur border-border p-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Analysts</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-blue-400">{stats.analysts}</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
            </Card>
            <Card className="bg-card/70 backdrop-blur border-border p-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Admins</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl font-bold text-purple-400">{stats.admins}</span>
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
            </Card>
          </div>

          {/* Directory Toolbar with Search & Role Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 backdrop-blur p-4 rounded-xl border border-border">
            {/* Role Filter Chips */}
            <div className="flex flex-wrap gap-1 bg-muted/60 p-1 rounded-lg border border-border">
              {(['all', 'procurement', 'logistics', 'analyst', 'admin'] as const).map((r) => {
                const count = r === 'all' ? stats.total : stats[r === 'procurement' ? 'procurement' : r === 'logistics' ? 'logistics' : r === 'analyst' ? 'analysts' : 'admins'];
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-md font-semibold capitalize transition-all flex items-center gap-1.5',
                      roleFilter === r
                        ? 'bg-background shadow-sm text-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span>{r === 'all' ? 'All Roles' : r}</span>
                    <span className="text-[10px] opacity-70 px-1 py-0.2 rounded bg-muted">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search & Add User CTA */}
            <div className="flex items-center gap-2.5">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search user, email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-9 bg-card/60 h-9 text-xs"
                />
              </div>

              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create User</span>
              </Button>
            </div>
          </div>

          {/* User Table */}
          <Card className="bg-card/70 backdrop-blur border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase font-semibold">
                    <th className="px-4 py-3 text-left">Officer / User</th>
                    <th className="px-4 py-3 text-left">Department &amp; Organization</th>
                    <th className="px-4 py-3 text-left">Assigned Role</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-left">Created Date</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No user accounts found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const uMeta = ROLE_DEFINITIONS[u.role];
                      return (
                        <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-semibold text-foreground">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/70 to-primary/40 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                                {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                              </div>
                              <div>
                                <span className="block text-foreground font-bold">{u.name}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="block text-foreground/90 font-medium">{u.department}</span>
                            <span className="text-[10px] text-muted-foreground">{u.organization}</span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateUserRole(u.id, e.target.value as NormalizedRole)}
                              className="bg-background/80 border border-border rounded px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                              <option value="analyst">📊 Market Analyst</option>
                              <option value="procurement">💼 Procurement Lead</option>
                              <option value="logistics">⚓ Logistics Specialist</option>
                              <option value="admin">🛡️ Ministry Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-bold uppercase',
                                u.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              )}
                            >
                              {u.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                            {u.createdAt}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleUserStatus(u.id)}
                                className="text-[10px] h-7 px-2"
                                title={u.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Activate'}
                              </Button>
                              {u.id !== 'usr_admin_001' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7 w-7 p-0"
                                  title="Delete Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Profile (All Users) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card/70 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold">Officer Profile &amp; Department Identity</CardTitle>
              <CardDescription className="text-xs">
                Your authenticated credentials and Ministry department assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); showStatus('success', 'Profile settings updated.'); }} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-medium">Full Name</label>
                    <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-background/80" />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-medium">Official Email Address</label>
                    <Input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="bg-background/80" disabled />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-medium">Department / Organization</label>
                  <Input value={profileDept} onChange={(e) => setProfileDept(e.target.value)} className="bg-background/80" />
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground block text-xs">Two-Factor Authentication (2FA)</span>
                    <span className="text-muted-foreground text-[11px]">Enforce OTP on NIC / Gov email login</span>
                  </div>
                  <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                </div>

                <div className="pt-3">
                  <Button type="submit" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Save className="w-4 h-4" /> Save Preferences
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Assigned RBAC Info */}
          <Card className="bg-card/70 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Role Clearance
              </CardTitle>
              <CardDescription className="text-xs">
                Your access rights are governed by Ministry of Steel RBAC policy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Active Role</span>
                <p className="font-bold text-sm text-foreground">{roleMeta.displayName}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed">{roleMeta.description}</p>
              </div>

              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-1.5 text-[11px]">
                <span className="font-semibold text-primary block">Admin Provisioning Notice:</span>
                <p className="text-muted-foreground leading-relaxed">
                  All accounts and role assignments are controlled by the Ministry Administrator. Contact your system admin for role elevation or department transfers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Role Permissions Matrix (Admin Only) */}
      {activeTab === 'roles' && isAdmin && (
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400" /> SIH26006 Authoritative RBAC Access Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Granular access rights mapping across Analyst, Procurement, Logistics, and Admin profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase font-semibold">
                    <th className="px-4 py-3 text-left">Module / Feature</th>
                    <th className="px-4 py-3 text-center">Analyst</th>
                    <th className="px-4 py-3 text-center">Procurement</th>
                    <th className="px-4 py-3 text-center">Logistics</th>
                    <th className="px-4 py-3 text-center">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(MODULE_PERMISSIONS).map(([route, perms]) => {
                    const formatBadge = (access: string) => {
                      if (access === 'full') {
                        return <span className="text-emerald-400 font-bold">✅ Full</span>;
                      }
                      if (access === 'read_only') {
                        return <span className="text-blue-400 font-medium">👁️ Read-Only</span>;
                      }
                      return <span className="text-rose-500 font-medium">❌ No Access</span>;
                    };

                    const moduleLabel =
                      route
                        .replace('/', '')
                        .replace('/', ' ➔ ')
                        .replace('-', ' ')
                        .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Dashboard';

                    return (
                      <tr key={route} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-foreground">
                          {moduleLabel} <span className="text-[10px] text-muted-foreground font-mono">({route})</span>
                        </td>
                        <td className="px-4 py-2.5 text-center">{formatBadge(perms.analyst)}</td>
                        <td className="px-4 py-2.5 text-center">{formatBadge(perms.procurement)}</td>
                        <td className="px-4 py-2.5 text-center">{formatBadge(perms.logistics)}</td>
                        <td className="px-4 py-2.5 text-center">{formatBadge(perms.admin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: System Settings (Admin Only) */}
      {activeTab === 'system' && isAdmin && (
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">Global Maritime Optimization Defaults</CardTitle>
            <CardDescription className="text-xs">
              Baseline parameters for freight rate calculations, bunker standards, and laytime rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-muted-foreground block mb-1 font-medium">VLSFO Bunker Benchmark ($/MT)</label>
                <Input defaultValue="620" className="bg-background/80" />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1 font-medium">Default Demurrage Rate ($/Day)</label>
                <Input defaultValue="28000" className="bg-background/80" />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1 font-medium">Tidal Safety UKC Margin (m)</label>
                <Input defaultValue="1.0" className="bg-background/80" />
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button size="sm" onClick={() => showStatus('success', 'System constants updated.')} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="w-4 h-4" /> Save System Constants
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: API & Data Sources (Admin Only) */}
      {activeTab === 'api' && isAdmin && (
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardHeader>
            <CardTitle className="text-base font-bold">AI Service &amp; External Data Ingestion Endpoints</CardTitle>
            <CardDescription className="text-xs">
              Configure Python FastAPI model microservice, AIS telemetry, and Baltic Exchange connectors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Python AI Forecast Microservice URL</label>
              <Input value={fastApiEndpoint} onChange={(e) => setFastApiEndpoint(e.target.value)} className="bg-background/80 font-mono" />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1 font-medium">Baltic Dry Index (BDI) API Key</label>
              <Input value={balticDryApiKey} onChange={(e) => setBalticDryApiKey(e.target.value)} className="bg-background/80 font-mono" />
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground block text-xs">AIS Live Satellite Telemetry</span>
                <span className="text-muted-foreground text-[11px]">Real-time GPS vessel tracking in Bay of Bengal &amp; Indian Ocean</span>
              </div>
              <Switch checked={aisLiveTelemetry} onCheckedChange={setAisLiveTelemetry} />
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button size="sm" onClick={() => showStatus('success', 'Connector endpoints saved.')} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <Save className="w-4 h-4" /> Update Connector Endpoints
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 6: Security Audit Logs (Admin Only) */}
      {activeTab === 'audit' && isAdmin && (
        <Card className="bg-card/70 backdrop-blur border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" /> Security &amp; Privilege Access Audit Log
            </CardTitle>
            <CardDescription className="text-xs">
              Immutable tamper-evident record of all user account creation and procurement actions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground uppercase font-semibold">
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Action Triggered</th>
                    <th className="px-4 py-3 text-left">Module / Target</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-[11px]">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">2026-10-06 17:45:00</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-foreground">admin@steel.gov.in</td>
                    <td className="px-4 py-2.5 font-bold text-foreground">USER_DIRECTORY_PROVISION</td>
                    <td className="px-4 py-2.5 font-sans text-muted-foreground">Admin User Management</td>
                    <td className="px-4 py-2.5 text-center font-sans">
                      <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        SUCCESS
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">2026-10-06 17:30:12</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-foreground">procurement@sail.in</td>
                    <td className="px-4 py-2.5 font-bold text-foreground">CONTRACT_3M_OPTIMIZE</td>
                    <td className="px-4 py-2.5 font-sans text-muted-foreground">Chartering Engine</td>
                    <td className="px-4 py-2.5 text-center font-sans">
                      <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        SUCCESS
                      </Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground">2026-10-06 17:15:44</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-foreground">analyst@steel.gov.in</td>
                    <td className="px-4 py-2.5 font-bold text-foreground">UNAUTHORIZED_ACCESS_BLOCKED</td>
                    <td className="px-4 py-2.5 font-sans text-muted-foreground">Vessel Management (/vessels/overview)</td>
                    <td className="px-4 py-2.5 text-center font-sans">
                      <Badge variant="outline" className="text-[10px] font-bold bg-rose-500/20 text-rose-400 border-rose-500/30">
                        DENIED
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create User Modal (Admin Only) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Provision New User Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create an authenticated officer profile with strict RBAC permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3.5 mt-2 text-xs">
            <div>
              <label className="text-muted-foreground font-medium block mb-1">Full Name &amp; Designation</label>
              <Input
                placeholder="e.g. S. K. Mahapatra"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="bg-background/80"
                required
              />
            </div>

            <div>
              <label className="text-muted-foreground font-medium block mb-1">Official Email Address</label>
              <Input
                type="email"
                placeholder="e.g. mahapatra@sail.in or officer@steel.gov.in"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="bg-background/80 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-muted-foreground font-medium block mb-1">Security Role Assignment</label>
              <select
                value={newUserForm.role}
                onChange={(e) => {
                  const r = e.target.value as NormalizedRole;
                  let dept = 'Raw Material Procurement Division';
                  let org = 'Steel Authority of India Ltd (SAIL)';
                  if (r === 'logistics') {
                    dept = 'Port Operations & Vessel Turnaround';
                    org = 'East Coast Port Authority';
                  } else if (r === 'analyst') {
                    dept = 'Freight Market Intelligence Unit';
                    org = 'Ministry of Steel (Govt of India)';
                  }
                  setNewUserForm({ ...newUserForm, role: r, department: dept, organization: org });
                }}
                className="w-full bg-background/80 border border-border rounded-md px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="procurement">💼 Bulk Cargo Procurement Manager (SAIL / RINL)</option>
                <option value="logistics">⚓ Maritime Logistics &amp; Fleet Specialist (Port Ops)</option>
                <option value="analyst">📊 Freight &amp; Supply Chain Analyst (Market Intel)</option>
              </select>
              <div className="mt-2 p-2 rounded bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Root Admin Policy:</strong> Ministry Administrator accounts cannot be created from the web UI. Run <code className="bg-purple-950 px-1 py-0.5 rounded text-[10px] text-purple-200">node createAdmin.js</code> in the terminal.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-muted-foreground font-medium block mb-1">Department</label>
                <Input
                  value={newUserForm.department}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  className="bg-background/80 text-[11px]"
                />
              </div>
              <div>
                <label className="text-muted-foreground font-medium block mb-1">Organization</label>
                <Input
                  value={newUserForm.organization}
                  onChange={(e) => setNewUserForm({ ...newUserForm, organization: e.target.value })}
                  className="bg-background/80 text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="text-muted-foreground font-medium block mb-1">Initial Temporary Password</label>
              <div className="relative">
                <Input
                  type={showCreatedPassword ? 'text' : 'password'}
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="bg-background/80 font-mono pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCreatedPassword(!showCreatedPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCreatedPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                User will use this password to sign in via the common login portal.
              </span>
            </div>

            <div className="pt-3 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <UserPlus className="w-4 h-4" /> Save &amp; Provision User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
