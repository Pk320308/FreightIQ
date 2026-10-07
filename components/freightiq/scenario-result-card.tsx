import { cn } from '@/lib/utils';
import { RiskBadge } from './risk-badge';
import type { RiskLevel } from '@/lib/types';

interface ScenarioResultCardProps {
  label: string;
  value: string;
  unit?: string;
  risk?: RiskLevel;
  icon?: React.ReactNode;
  className?: string;
}

export function ScenarioResultCard({ label, value, unit, risk, icon, className }: ScenarioResultCardProps) {
  return (
    <div className={cn('glass rounded-xl border border-border/50 p-4 transition-all hover:border-primary/20', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        {risk && <RiskBadge level={risk} size="sm" />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
