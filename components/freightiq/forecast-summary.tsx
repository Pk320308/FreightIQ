import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './trend-indicator';
import { RiskBadge } from './risk-badge';
import type { RiskLevel, TrendDirection } from '@/lib/types';

interface ForecastSummaryItemProps {
  label: string;
  value: string;
  unit?: string;
  trend?: TrendDirection;
  risk?: RiskLevel;
  highlight?: boolean;
}

export function ForecastSummaryItem({ label, value, unit, trend, risk, highlight }: ForecastSummaryItemProps) {
  return (
    <div
      className={cn(
        'glass rounded-xl border p-4 transition-all',
        highlight ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/50',
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn('text-xl font-bold', highlight ? 'text-primary' : 'text-foreground')}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {(trend || risk) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && <TrendIndicator trend={trend} />}
          {risk && <RiskBadge level={risk} size="sm" />}
        </div>
      )}
    </div>
  );
}

interface ForecastSummaryProps {
  items: ForecastSummaryItemProps[];
  className?: string;
}

export function ForecastSummary({ items, className }: ForecastSummaryProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6', className)}>
      {items.map((item, i) => (
        <ForecastSummaryItem key={i} {...item} />
      ))}
    </div>
  );
}
