import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrendDirection } from '@/lib/types';

interface TrendIndicatorProps {
  trend: TrendDirection;
  value?: string;
  className?: string;
}

export function TrendIndicator({ trend, value, className }: TrendIndicatorProps) {
  const config = {
    increasing: { icon: ArrowUpRight, color: 'text-success', bg: 'bg-success/10' },
    decreasing: { icon: ArrowDownRight, color: 'text-danger', bg: 'bg-danger/10' },
    stable: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
  };
  const { icon: Icon, color, bg } = config[trend];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium', bg, color, className)}>
      <Icon className="h-3 w-3" />
      {value ?? trend}
    </span>
  );
}
