import { cn } from '@/lib/utils';

interface FilterPanelProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function FilterPanel({ title, className, children }: FilterPanelProps) {
  return (
    <div className={cn('glass rounded-xl border border-border/50 p-5', className)}>
      {title && <h3 className="mb-4 text-sm font-semibold text-foreground">{title}</h3>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

interface FilterFieldProps {
  label: string;
  children: React.ReactNode;
}

export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
