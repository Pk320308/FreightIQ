import { FileText, Eye, Download, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { ReportInfo } from '@/lib/types';

const statusConfig: Record<ReportInfo['status'], { label: string; className: string }> = {
  ready: { label: 'Ready', className: 'bg-success/15 text-success border-success/30' },
  processing: { label: 'Processing', className: 'bg-warning/15 text-warning border-warning/30' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
};

interface ReportCardProps {
  report: ReportInfo;
  onView: (report: ReportInfo) => void;
  onDownload?: (report: ReportInfo) => void;
  className?: string;
}

export function ReportCard({ report, onView, onDownload, className }: ReportCardProps) {
  const status = statusConfig[report.status];
  return (
    <div className={cn('glass rounded-xl border border-border/50 p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{report.title}</h4>
            <p className="text-xs text-muted-foreground">{report.type}</p>
          </div>
        </div>
        <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', status.className)}>
          {status.label}
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">{report.summary}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {report.generatedDate}
        </span>
        <span>{report.route}</span>
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="default" className="h-8 gap-1.5 text-xs" onClick={() => onView(report)}>
          <Eye className="h-3.5 w-3.5" />
          View
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={() => onDownload?.(report)}
        >
          <Download className="h-3.5 w-3.5" />
          PDF
        </Button>
      </div>
    </div>
  );
}
