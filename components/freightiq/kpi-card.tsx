import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/types';

const levelColors: Record<RiskLevel, string> = {
  low: 'bg-success',
  medium: 'bg-warning',
  high: 'bg-danger',
};

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  change?: string;
  risk?: RiskLevel;
  children?: React.ReactNode;
  className?: string;
}

export function KpiCard({ label, value, unit, change, risk, children, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'glass rounded-xl border border-border/50 p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {risk && <span className={cn('h-2 w-2 rounded-full', levelColors[risk])} />}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {(change || children) && (
        <div className="mt-2 flex items-center gap-2">
          {children}
          {change && <span className="text-xs text-muted-foreground">{change}</span>}
        </div>
      )}
    </div>
  );
}
