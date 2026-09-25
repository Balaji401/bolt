'use client';
import { type ReactNode } from 'react';
import {
  ResponsiveContainer, LineChart as RechartsLineChart, Line, AreaChart as RechartsAreaChart, Area,
  BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadialBarChart, RadialBar,
  type TooltipProps,
} from 'recharts';
import { chartColors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export function ChartContainer({ children, height = 280, className }: { children: ReactNode; height?: number | string; className?: string }) {
  return (<div className={cn('w-full', className)} style={{ height }}><ResponsiveContainer width="100%" height="100%">{children as any}</ResponsiveContainer></div>);
}

function ChartTooltip({ active, payload, label }: TooltipProps<any, any>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg border border-border px-3 py-2 shadow-lg text-xs">
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium tabular-nums">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const axisProps = { stroke: 'hsl(var(--muted-foreground))', fontSize: 11, tickLine: false, axisLine: false } as const;
const gridProps = { stroke: 'hsl(var(--border))', strokeDasharray: '3 3', vertical: false } as const;

export function LineChart({ data, xKey, lines, height = 280, formatY, formatX }: { data: any[]; xKey: string; lines: { key: string; name?: string; color?: string; dashed?: boolean }[]; height?: number; formatY?: (v: number) => string; formatX?: (v: any) => string }) {
  return (
    <ChartContainer height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} tickFormatter={formatX} />
        <YAxis {...axisProps} tickFormatter={formatY} />
        <Tooltip content={<ChartTooltip />} />
        {lines.map((line, i) => (
          <Line key={line.key} type="monotone" dataKey={line.key} name={line.name || line.key}
            stroke={line.color || chartColors[i % chartColors.length]}
            strokeWidth={2} strokeDasharray={line.dashed ? '5 5' : undefined}
            dot={false} activeDot={{ r: 4 }} />
        ))}
      </RechartsLineChart>
    </ChartContainer>
  );
}

export function AreaChart({ data, xKey, areas, height = 280, formatY, formatX }: { data: any[]; xKey: string; areas: { key: string; name?: string; color?: string }[]; height?: number; formatY?: (v: number) => string; formatX?: (v: any) => string }) {
  return (
    <ChartContainer height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          {areas.map((area, i) => {
            const color = area.color || chartColors[i % chartColors.length];
            return (
              <linearGradient key={area.key} id={`grad-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey={xKey} {...axisProps} tickFormatter={formatX} />
        <YAxis {...axisProps} tickFormatter={formatY} />
        <Tooltip content={<ChartTooltip />} />
        {areas.map((area, i) => {
          const color = area.color || chartColors[i % chartColors.length];
          return (
            <Area key={area.key} type="monotone" dataKey={area.key} name={area.name || area.key}
              stroke={color} strokeWidth={2} fill={`url(#grad-${area.key})`} />
          );
        })}
      </RechartsAreaChart>
    </ChartContainer>
  );
}

export function BarChart({ data, xKey, bars, height = 280, formatY, horizontal, colors }: { data: any[]; xKey: string; bars: { key: string; name?: string; color?: string }[]; height?: number; formatY?: (v: number) => string; horizontal?: boolean; colors?: string[] }) {
  return (
    <ChartContainer height={height}>
      <RechartsBarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} tickFormatter={formatY} />
            <YAxis type="category" dataKey={xKey} {...axisProps} width={80} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={formatY} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--secondary) / 0.4)' }} />
        {bars.map((bar, i) => (
          <Bar key={bar.key} dataKey={bar.key} name={bar.name || bar.key}
            fill={bar.color || (colors ? colors[i % colors.length] : chartColors[i % chartColors.length])}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ChartContainer>
  );
}

export function PieChart({ data, height = 280, colors, innerRadius = 50, outerRadius = 80 }: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
}) {
  return (
    <ChartContainer height={height}>
      <RechartsPieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color || (colors ? colors[i % colors.length] : chartColors[i % chartColors.length])} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
      </RechartsPieChart>
    </ChartContainer>
  );
}

export function RadialGauge({ value, max, label, color, height = 160 }: {
  value: number; max: number; label: string; color?: string; height?: number;
}) {
  const data = [{ name: label, value: max > 0 ? (value / max) * 100 : 0, fill: color || chartColors[0] }];
  return (
    <ChartContainer height={height}>
      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={12} data={data} startAngle={90} endAngle={-270}>
        <RadialBar background dataKey="value" cornerRadius={6} />
      </RadialBarChart>
    </ChartContainer>
  );
}
