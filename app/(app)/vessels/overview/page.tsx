'use client';

import { useEffect, useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PageHeader, SectionCard, LoadingState, EmptyState } from '@/components/freightiq/common';
import { FilterPanel, FilterField } from '@/components/freightiq/filter-panel';
import { DataTable } from '@/components/freightiq/data-table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { VesselInfo, VesselType } from '@/lib/types';

const statusConfig: Record<VesselInfo['status'], { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-success/15 text-success border-success/30' },
  'on-voyage': { label: 'On Voyage', className: 'bg-primary/15 text-primary border-primary/30' },
  'in-port': { label: 'In Port', className: 'bg-info/15 text-info border-info/30' },
  'under-maintenance': { label: 'Maintenance', className: 'bg-warning/15 text-warning border-warning/30' },
};

import { vessels as mockVessels } from '@/lib/mock-data';

export default function VesselOverviewPage() {
  const [vessels, setVessels] = useState<VesselInfo[]>(mockVessels);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [minCapacity, setMinCapacity] = useState('');

  useEffect(() => {
    api.getVessels().then((data) => {
      setVessels(data);
    });
  }, []);

  const filtered = useMemo(() => {
    return vessels.filter((v) => {
      if (typeFilter !== 'all' && v.type !== typeFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (minCapacity && v.capacity < parseInt(minCapacity)) return false;
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.location.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [vessels, typeFilter, statusFilter, search, minCapacity]);

  if (loading) return <LoadingState message="Loading vessel fleet..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vessel Overview"
        subtitle="Comprehensive fleet database with real-time availability and status tracking"
      />

      <FilterPanel title="Filters">
        <FilterField label="Search">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Vessel name or location..."
              className="pl-8"
            />
          </div>
        </FilterField>
        <FilterField label="Vessel Type">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Handysize">Handysize</SelectItem>
              <SelectItem value="Supramax">Supramax</SelectItem>
              <SelectItem value="Panamax">Panamax</SelectItem>
              <SelectItem value="Capesize">Capesize</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Status">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="on-voyage">On Voyage</SelectItem>
              <SelectItem value="in-port">In Port</SelectItem>
              <SelectItem value="under-maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </FilterField>
        <FilterField label="Min Capacity (MT)">
          <Input type="number" value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} placeholder="0" />
        </FilterField>
      </FilterPanel>

      <SectionCard
        title={`Vessels (${filtered.length})`}
      >
        <div className="glass rounded-xl border border-border/50 overflow-hidden">
          {filtered.length === 0 ? (
            <EmptyState title="No vessels found" description="Try adjusting your filters to see more results." />
          ) : (
            <DataTable
              data={filtered}
              columns={[
                { key: 'name', label: 'Vessel Name', render: (v) => <span className="font-medium text-foreground">{v.name}</span> },
                { key: 'type', label: 'Type', render: (v) => <Badge variant="outline" className="text-xs">{v.type}</Badge> },
                { key: 'capacity', label: 'Capacity', align: 'right', render: (v) => `${v.capacity.toLocaleString()} MT` },
                { key: 'draft', label: 'Draft', align: 'right', render: (v) => `${v.draft}m` },
                { key: 'loa', label: 'LOA', align: 'right', render: (v) => `${v.loa}m` },
                { key: 'beam', label: 'Beam', align: 'right', render: (v) => `${v.beam}m` },
                { key: 'speed', label: 'Speed', align: 'right', render: (v) => `${v.speed} kn` },
                { key: 'availability', label: 'Available', render: (v) => <span className="text-xs text-muted-foreground">{v.availability}</span> },
                {
                  key: 'status', label: 'Status', align: 'center',
                  render: (v) => {
                    const s = statusConfig[v.status];
                    return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>;
                  },
                },
              ]}
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
}
