'use client';

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { FreightRatePoint } from '@/lib/types';

interface ForecastChartProps {
  data: FreightRatePoint[];
  height?: number;
}

export function ForecastChart({ data, height = 400 }: ForecastChartProps) {
  const lastHistoricalDate = data.findLast?.((d) => d.historical !== null)?.date
    ?? data.filter((d) => d.historical !== null).pop()?.date;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.25} />
            <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.22} />
            <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} vertical={false} />
        <XAxis
          dataKey="date"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          domain={['dataMin - 1', 'dataMax + 1']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '10px',
            fontSize: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
          itemStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: number, name: string) => {
            if (value === null || value === undefined) return ['—', name];
            const labels: Record<string, string> = {
              historical: 'Historical',
              forecast: 'Forecast',
              upperBound: 'Upper Bound (95%)',
              lowerBound: 'Lower Bound (95%)',
            };
            return [`$${value.toFixed(2)}/MT`, labels[name] ?? name];
          }}
        />
        <Legend
          formatter={(value) => {
            const labels: Record<string, string> = {
              historical: 'Historical Rate',
              forecast: 'Forecast Rate',
              range: 'Confidence Range',
            };
            return <span className="text-xs font-medium text-muted-foreground">{labels[value] ?? value}</span>;
          }}
        />
        {lastHistoricalDate && (
          <ReferenceLine
            x={lastHistoricalDate}
            stroke="hsl(var(--primary))"
            strokeDasharray="4 4"
            label={{ value: 'Today', position: 'top', fill: 'hsl(var(--primary))', fontSize: 11, fontWeight: 'bold' }}
          />
        )}
        <Area
          type="monotone"
          dataKey="upperBound"
          stroke="none"
          fill="url(#bandGradient)"
          connectNulls
          name="range"
          legendType="none"
        />
        <Area
          type="monotone"
          dataKey="historical"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2.5}
          fill="url(#histGradient)"
          connectNulls
          name="historical"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          connectNulls
          name="forecast"
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
