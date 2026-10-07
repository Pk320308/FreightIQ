import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/types';

const riskConfig: Record<RiskLevel, { className: string; label: string; dot: string }> = {
  low: { className: 'bg-success/15 text-success border-success/30', label: 'Low', dot: 'bg-success' },
  medium: { className: 'bg-warning/15 text-warning border-warning/30', label: 'Medium', dot: 'bg-warning' },
  high: { className: 'bg-danger/15 text-danger border-danger/30', label: 'High', dot: 'bg-danger' },
};

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function RiskBadge({ level, label, size = 'md', className }: RiskBadgeProps) {
  const config = riskConfig[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.className,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {label ?? config.label}
    </span>
  );
}
