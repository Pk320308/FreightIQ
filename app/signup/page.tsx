'use client';

import Link from 'next/link';
import { Waves, Shield, ArrowLeft, Lock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="glass rounded-2xl border border-border/60 p-8 shadow-2xl backdrop-blur-xl text-center space-y-5">
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <Waves className="h-6 w-6 text-white" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-foreground">Account Provisioning Notice</h1>
            <p className="mt-1 text-xs text-muted-foreground">Ministry of Steel Security &amp; RBAC Protocol</p>
          </div>

          <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-xs text-foreground/90 space-y-2 text-left leading-relaxed">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Shield className="w-4 h-4" />
              <span>Restricted Government System</span>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Direct self-registration is disabled. All user accounts for <strong>Logistics</strong>, <strong>Procurement</strong>, and <strong>Market Analytics</strong> are created and assigned directly through the <strong>Ministry Administrator Governance Panel</strong>.
            </p>
          </div>

          <Link href="/login" className="block">
            <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              <ArrowLeft className="w-4 h-4" />
              Return to Common Login Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
