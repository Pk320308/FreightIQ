import { cn } from '@/lib/utils';
import { RiskBadge } from './risk-badge';
import type { PortInfo, OperationalStatus } from '@/lib/types';

const statusConfig: Record<OperationalStatus, { label: string; className: string; dot: string }> = {
  operational: { label: 'Operational', className: 'text-success', dot: 'bg-success' },
  congested: { label: 'Congested', className: 'text-warning', dot: 'bg-warning' },
  restricted: { label: 'Restricted', className: 'text-warning', dot: 'bg-warning' },
  closed: { label: 'Closed', className: 'text-danger', dot: 'bg-danger' },
};

interface PortCardProps {
  port: PortInfo;
  selected?: boolean;
  onClick?: () => void;
}

export function PortCard({ port, selected, onClick }: PortCardProps) {
  const status = statusConfig[port.status];
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left glass rounded-xl border p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        selected ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/50',
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-foreground">{port.name}</h4>
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', status.className)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{port.location}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">Max Draft</p>
          <p className="font-medium text-foreground">{port.maxDraft}m</p>
        </div>
        <div>
          <p className="text-muted-foreground">Avg Wait</p>
          <p className="font-medium text-foreground">{port.avgWaitTime} days</p>
        </div>
        <div>
          <p className="text-muted-foreground">Capacity</p>
          <p className="font-medium text-foreground">{port.handlingCapacity}M MT/yr</p>
        </div>
        <div>
          <p className="text-muted-foreground">Congestion</p>
          <div className="mt-0.5"><RiskBadge level={port.congestion} size="sm" /></div>
        </div>
      </div>
    </button>
  );
}
