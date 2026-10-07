import { TrendingUp, AlertTriangle, Fuel, Ship, Info, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketInsight } from '@/lib/types';

const iconMap: Record<string, React.ElementType> = {
  'trending-up': TrendingUp,
  'alert-triangle': AlertTriangle,
  'fuel': Fuel,
  'ship': Ship,
  'info': Info,
};

const typeConfig: Record<MarketInsight['type'], { border: string; bg: string; iconColor: string }> = {
  trend: { border: 'border-primary/30', bg: 'bg-primary/5', iconColor: 'text-primary' },
  warning: { border: 'border-warning/30', bg: 'bg-warning/5', iconColor: 'text-warning' },
  info: { border: 'border-info/30', bg: 'bg-info/5', iconColor: 'text-info' },
  opportunity: { border: 'border-success/30', bg: 'bg-success/5', iconColor: 'text-success' },
};

interface InsightCardProps {
  insight: MarketInsight;
  className?: string;
}

export function InsightCard({ insight, className }: InsightCardProps) {
  const Icon = iconMap[insight.icon] ?? Info;
  const config = typeConfig[insight.type];
  return (
    <div className={cn('glass rounded-xl border p-4 transition-all hover:shadow-md', config.border, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', config.bg)}>
          <Icon className={cn('h-4.5 w-4.5', config.iconColor)} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{insight.title}</h4>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  );
}
