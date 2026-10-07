'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock, Building2, UserCheck, AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLE_DEFINITIONS, normalizeRole, UserRole } from '@/backend/security/rbac';

interface AccessDeniedProps {
  currentRole: UserRole;
  pathname: string;
}

export function AccessDenied({ currentRole, pathname }: AccessDeniedProps) {
  const norm = normalizeRole(currentRole);
  const roleMeta = ROLE_DEFINITIONS[norm];

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-xl w-full bg-card/80 backdrop-blur-md border-rose-500/30 shadow-2xl overflow-hidden">
        {/* Top Warning Strip */}
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-500">403 Forbidden — Access Restricted</h2>
              <p className="text-xs text-muted-foreground">Ministry of Steel Enterprise Security Policy</p>
            </div>
          </div>
          <Badge className="bg-rose-500 text-white font-bold text-xs uppercase tracking-wider">
            Unauthorized
          </Badge>
        </div>

        <CardContent className="p-6 space-y-5 text-sm">
          <div>
            <p className="text-foreground font-medium">
              You do not have the required role privileges to access this module (<code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-primary">{pathname}</code>).
            </p>
          </div>

          {/* Current User Role Identity */}
          <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Your Active Profile:</span>
              <Badge className={roleMeta.badgeClass} variant="outline">
                {roleMeta.displayName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Department:</strong> {roleMeta.department}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {roleMeta.description}
            </p>
          </div>

          {/* Policy Explanation */}
          <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="space-y-1">
              <span className="font-semibold text-amber-200">Role Isolation &amp; Audit Protocol:</span>
              <p className="text-amber-300/90 leading-relaxed">
                FreightIQ strictly enforces segregation of duties between <em>Market Analytics</em>, <em>Procurement Authority</em>, <em>Maritime Operations</em>, and <em>Ministry Governance</em>. Users cannot view or modify assets outside their designated operational domain.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowLeft className="w-4 h-4" />
                Return to Safe Dashboard
              </Button>
            </Link>
            <Link href="/reports" className="flex-1">
              <Button variant="outline" className="w-full gap-2 bg-background/80">
                <Building2 className="w-4 h-4" />
                View Executive Reports
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
