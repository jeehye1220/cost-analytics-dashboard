'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { SeasonDetail } from '@/lib/types';

interface DetailChartProps {
  category: string;
  details: SeasonDetail[];
  onClose: () => void;
}

type MetricKey = '평균TAG' | '원부자재단가' | '아트웍단가' | '공임단가' | '기타경비단가';

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: '평균TAG', label: '평균TAG (KRW)', color: '#059669' },
  { key: '원부자재단가', label: '원부자재 (USD)', color: '#2563eb' },
  { key: '아트웍단가', label: '아트웍 (USD)', color: '#7c3aed' },
  { key: '공임단가', label: '공임 (USD)', color: '#d97706' },
  { key: '기타경비단가', label: '기타경비 (USD)', color: '#dc2626' },
];

export function DetailChart({ category, details, onClose }: DetailChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
    '원부자재단가',
    '아트웍단가',
    '공임단가',
    '기타경비단가',
  ]);

  const toggleMetric = (metric: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  const showTAG = selectedMetrics.includes('평균TAG');
  const costMetrics = selectedMetrics.filter((m) => m !== '평균TAG');

  const chartData = details.map((detail) => ({
    시즌: detail.시즌,
    평균TAG: detail.평균TAG,
    원부자재단가: detail.원부자재단가,
    아트웍단가: detail.아트웍단가,
    공임단가: detail.공임단가,
    기타경비단가: detail.기타경비단가,
  }));

  return (
    <Card className="bg-white border-emerald-200 shadow-md">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
            <span className="text-emerald-600">📊</span>
            {category} - 상세 단가 추이
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            ✕ 닫기
          </Button>
        </div>

        {/* 메트릭 선택 */}
        <div className="flex flex-wrap gap-4 mt-4">
          {METRICS.map((metric) => (
            <label
              key={metric.key}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedMetrics.includes(metric.key)}
                onCheckedChange={() => toggleMetric(metric.key)}
                style={{ 
                  borderColor: metric.color,
                  backgroundColor: selectedMetrics.includes(metric.key) ? metric.color : 'transparent'
                }}
              />
              <span 
                className="text-sm font-medium"
                style={{ color: metric.color }}
              >
                {metric.label}
              </span>
            </label>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="시즌" 
                stroke="#64748b"
                tick={{ fill: '#64748b' }}
              />
              
              {/* 단가용 Y축 (왼쪽) */}
              <YAxis 
                yAxisId="cost"
                stroke="#64748b"
                tick={{ fill: '#64748b' }}
                label={{ 
                  value: 'USD', 
                  angle: -90, 
                  position: 'insideLeft',
                  fill: '#64748b'
                }}
              />
              
              {/* TAG용 Y축 (오른쪽) */}
              {showTAG && (
                <YAxis 
                  yAxisId="tag"
                  orientation="right"
                  stroke="#059669"
                  tick={{ fill: '#059669' }}
                  label={{ 
                    value: 'KRW', 
                    angle: 90, 
                    position: 'insideRight',
                    fill: '#059669'
                  }}
                />
              )}
              
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelStyle={{ color: '#334155', fontWeight: 600 }}
                formatter={(value: number, name: string) => {
                  const metric = METRICS.find((m) => m.key === name);
                  if (name === '평균TAG') {
                    return [`₩${value.toLocaleString()}`, metric?.label || name];
                  }
                  return [`$${value.toFixed(2)}`, metric?.label || name];
                }}
              />
              <Legend />
              
              {/* TAG 라인 */}
              {showTAG && (
                <Line
                  yAxisId="tag"
                  type="monotone"
                  dataKey="평균TAG"
                  name="평균TAG"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#059669', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              )}
              
              {/* 단가 라인들 */}
              {costMetrics.map((metricKey) => {
                const metric = METRICS.find((m) => m.key === metricKey);
                return (
                  <Line
                    key={metricKey}
                    yAxisId="cost"
                    type="monotone"
                    dataKey={metricKey}
                    name={metricKey}
                    stroke={metric?.color || '#94a3b8'}
                    strokeWidth={2}
                    dot={{ fill: metric?.color || '#94a3b8', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
