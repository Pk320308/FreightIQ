'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Waves,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
  Shield,
  Building2,
  Ship,
  TrendingUp,
  UserCheck,
  KeyRound,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { dataStore } from '@/lib/data-store';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsHelper, setShowCredentialsHelper] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  useEffect(() => {
    setRegisteredUsers(dataStore.getUsers());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      router.push('/dashboard');
    }
  };

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-5">
        <div className="glass rounded-2xl border border-border/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header Brand */}
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground tracking-tight">FreightIQ</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Ministry of Steel — Intelligent Freight Forecasting &amp; Vessel Chartering Decision Support System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Common Login Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Official Government / PSU Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background/80"
                  placeholder="name@steel.gov.in or officer@sail.in"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Security Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 h-9 text-xs bg-background/80 font-mono"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/15"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {loading ? 'Authenticating Role...' : 'Sign In to FreightIQ'}
            </Button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Accounts are provisioned by the Ministry Administrator.</span>
            </p>
          </div>
        </div>

        {/* Expandable Official Test Accounts Helper for Reviewers */}
        <div className="glass rounded-xl border border-border/50 p-3.5 text-xs">
          <button
            type="button"
            onClick={() => setShowCredentialsHelper(!showCredentialsHelper)}
            className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground font-medium"
          >
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <KeyRound className="w-4 h-4 text-primary" /> Provisioned Test Accounts Reference{registeredUsers.length > 0 ? ` (${registeredUsers.length})` : ''}
            </span>
            {showCredentialsHelper ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCredentialsHelper && (
            <div className="mt-3 pt-3 border-t border-border/40 space-y-2 animate-in fade-in">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Click any account below to autofill login credentials:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {registeredUsers.slice(0, 6).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleFillCredentials(u.email, u.password || 'Admin@123')}
                    className="p-2.5 rounded-lg border border-border bg-background/50 hover:bg-muted text-left transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[11px] text-foreground truncate">{u.name}</span>
                        <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0">
                          {u.role}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono block truncate">{u.email}</span>
                    </div>
                    <span className="text-[9px] text-primary mt-1 font-mono">Password: {u.password || '••••••••'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          FreightIQ Intelligent Decision Support System · SIH26006 Standard
        </p>
      </div>
    </div>
  );
}
