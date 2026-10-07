import { cn } from '@/lib/utils';
import type { Compatibility, Suitability } from '@/lib/types';

const compatConfig: Record<Compatibility, { label: string; className: string }> = {
  pass: { label: 'PASS', className: 'bg-success/15 text-success border-success/30' },
  fail: { label: 'FAIL', className: 'bg-danger/15 text-danger border-danger/30' },
  restricted: { label: 'RESTRICTED', className: 'bg-warning/15 text-warning border-warning/30' },
};

const suitConfig: Record<Suitability, { label: string; className: string }> = {
  recommended: { label: 'Recommended', className: 'bg-primary/15 text-primary border-primary/40' },
  suitable: { label: 'Suitable', className: 'bg-success/15 text-success border-success/30' },
  'not-suitable': { label: 'Not Suitable', className: 'bg-danger/15 text-danger border-danger/30' },
};

interface VesselCompatibilityBadgeProps {
  type: 'compatibility' | 'suitability';
  value: Compatibility | Suitability;
  className?: string;
}

export function VesselCompatibilityBadge({ type, value, className }: VesselCompatibilityBadgeProps) {
  const config = type === 'compatibility'
    ? compatConfig[value as Compatibility]
    : suitConfig[value as Suitability];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
