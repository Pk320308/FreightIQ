import { cn } from '@/lib/utils';
import { RiskBadge } from './risk-badge';
import type { RiskLevel, ForecastFactor } from '@/lib/types';

const impactConfig = {
  positive: { color: 'text-success', bg: 'bg-success/10', label: 'Positive' },
  negative: { color: 'text-danger', bg: 'bg-danger/10', label: 'Negative' },
  neutral: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Neutral' },
};

interface RiskFactorCardProps {
  name: string;
  level: RiskLevel;
  percentage: number;
  description?: string;
}

export function RiskFactorCard({ name, level, percentage, description }: RiskFactorCardProps) {
  const barColor = level === 'low' ? 'bg-success' : level === 'medium' ? 'bg-warning' : 'bg-danger';
  return (
    <div className="glass rounded-xl border border-border/50 p-4 transition-all hover:border-primary/20">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{name}</h4>
        <RiskBadge level={level} size="sm" />
      </div>
      {description && <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description}</p>}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Risk Score</span>
          <span className="font-medium text-foreground">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  );
}

interface ForecastFactorCardProps {
  factor: ForecastFactor;
}

export function ForecastFactorCard({ factor }: ForecastFactorCardProps) {
  const config = impactConfig[factor.impact];
  return (
    <div className="glass rounded-xl border border-border/50 p-4 transition-all hover:border-primary/20">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{factor.name}</h4>
        <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', config.bg, config.color)}>
          {config.label}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{factor.description}</p>
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Impact Strength</span>
          <span className="font-medium text-foreground">{factor.strength}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', config.color.replace('text-', 'bg-'))}
            style={{ width: `${factor.strength}%` }}
          />
        </div>
      </div>
    </div>
  );
}
