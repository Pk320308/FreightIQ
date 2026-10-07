'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';
import {
  type UserRole,
  type NormalizedRole,
  ROLE_PERMISSIONS,
  ROLE_DEFINITIONS,
  normalizeRole,
  hasPermission,
} from '@/backend/security/rbac';
import { dataStore, type ManagedUser } from '@/lib/data-store';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  can: (permission: string) => boolean;
  roleInfo: (typeof ROLE_PERMISSIONS)['ministry_admin'];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInAsRole: (targetRole: NormalizedRole) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const ROLE_MAP: Record<NormalizedRole, UserRole> = {
  admin: 'ministry_admin',
  procurement: 'procurement_manager',
  logistics: 'charter_specialist',
  analyst: 'logistics_analyst',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: 'ministry_admin',
  setRole: () => {},
  can: () => true,
  roleInfo: ROLE_PERMISSIONS['ministry_admin'],
  loading: false,
  signIn: async () => ({ error: null }),
  signInAsRole: async () => {},
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRoleState] = useState<UserRole>('ministry_admin');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved active session
    try {
      const savedUserJson = localStorage.getItem('freightiq_active_user');
      if (savedUserJson) {
        const parsed = JSON.parse(savedUserJson);
        setUser(parsed);
        const norm = normalizeRole(parsed.user_metadata?.role || parsed.role);
        setRoleState(ROLE_MAP[norm]);
        return;
      }
    } catch {}

    // Fallback initial admin user
    const rootAdmin = dataStore.getUserByEmail('admin@steel.gov.in');
    if (rootAdmin) {
      const u = {
        id: rootAdmin.id,
        app_metadata: {},
        user_metadata: { full_name: rootAdmin.name, role: rootAdmin.role, department: rootAdmin.department },
        aud: 'authenticated',
        created_at: rootAdmin.createdAt,
        email: rootAdmin.email,
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;
      setUser(u);
      setRoleState('ministry_admin');
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem('freightiq_active_role', newRole);
    } catch {}
  };

  const can = (permission: any): boolean => {
    return hasPermission(role, permission);
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const authResult = dataStore.authenticate(cleanEmail, password);

    if (!authResult.success || !authResult.user) {
      return { error: authResult.error || 'Authentication failed. Please check your credentials.' };
    }

    const matched = authResult.user;
    const mappedRole = ROLE_MAP[matched.role];

    const authenticatedUser: User = {
      id: matched.id,
      app_metadata: {},
      user_metadata: {
        full_name: matched.name,
        role: matched.role,
        department: matched.department,
        organization: matched.organization,
      },
      aud: 'authenticated',
      created_at: matched.createdAt,
      email: matched.email,
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as User;

    setUser(authenticatedUser);
    setRole(mappedRole);

    try {
      localStorage.setItem('freightiq_active_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('freightiq_active_role', mappedRole);
    } catch {}

    return { error: null };
  };

  const signInAsRole = async (targetRole: NormalizedRole) => {
    const users = dataStore.getUsers().filter((u) => u.role === targetRole && u.status === 'active');
    const matched = users[0] || {
      id: `usr_${targetRole}`,
      name: ROLE_DEFINITIONS[targetRole].displayName,
      email: `${targetRole}@steel.gov.in`,
      role: targetRole,
      department: ROLE_DEFINITIONS[targetRole].department,
      organization: 'Ministry of Steel / Steel PSU',
      status: 'active' as const,
      createdAt: '2026-09-01',
    };

    const mappedRole = ROLE_MAP[targetRole];
    const authenticatedUser: User = {
      id: matched.id,
      app_metadata: {},
      user_metadata: {
        full_name: matched.name,
        role: matched.role,
        department: matched.department,
        organization: matched.organization,
      },
      aud: 'authenticated',
      created_at: matched.createdAt,
      email: matched.email,
      role: 'authenticated',
      updated_at: new Date().toISOString(),
    } as User;

    setUser(authenticatedUser);
    setRole(mappedRole);

    try {
      localStorage.setItem('freightiq_active_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('freightiq_active_role', mappedRole);
    } catch {}
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    initialRole: UserRole = 'procurement_manager'
  ) => {
    return {
      error: 'Self-registration is disabled. All user accounts must be provisioned by the Ministry Administrator from the Governance Settings panel.',
    };
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('freightiq_active_user');
      localStorage.removeItem('freightiq_active_role');
    } catch {}
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        setRole,
        can,
        roleInfo: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['ministry_admin'],
        loading,
        signIn,
        signInAsRole,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
