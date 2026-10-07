'use client';

import React from 'react';
import { Eye, ShieldCheck, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ROLE_DEFINITIONS, normalizeRole, UserRole } from '@/backend/security/rbac';

interface ReadOnlyBannerProps {
  currentRole: UserRole;
  moduleName?: string;
}

export function ReadOnlyBanner({ currentRole, moduleName }: ReadOnlyBannerProps) {
  const norm = normalizeRole(currentRole);
  const roleMeta = ROLE_DEFINITIONS[norm];

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs backdrop-blur">
      <div className="flex items-center gap-2 text-blue-400">
        <Eye className="w-4 h-4 shrink-0 text-blue-400" />
        <span>
          <strong className="font-semibold text-blue-300">Read-Only Clearance:</strong> You are viewing this module with <strong>{roleMeta.displayName}</strong> credentials. Form submissions, rate triggers, and live changes are locked for review.
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
        <Badge variant="outline" className="text-[10px] font-mono bg-background/50 border-blue-500/30 text-blue-300 flex items-center gap-1">
          <Lock className="w-3 h-3 inline" /> 👁️ VIEW ONLY
        </Badge>
      </div>
    </div>
  );
}
