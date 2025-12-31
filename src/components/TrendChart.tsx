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
  ReferenceLine,
  Area,
  ComposedChart,
  Bar,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SeasonSummary } from '@/lib/types';

interface TrendChartProps {
  data: SeasonSummary[];
}

// 그래프 1: 가격 vs 원가 색상
const PRICE_COST_COLORS = {
  평균TAG: '#8b5cf6',     // violet
  평균원가KRW: '#3b82f6', // blue
};

// 그래프 2: 단가구성 + 환율 색상
const BREAKDOWN_COLORS = {
  원부자재: '#3b82f6',   // blue
  아트웍: '#a855f7',     // purple
  공임: '#f59e0b',       // amber
  기타경비: '#ec4899',   // pink
};
const ORDER_QTY_COLOR = '#f97316'; // orange

// 그래프 3: 원가율 색상
const COST_RATE_COLOR = '#ef4444'; // red

// 적정원가율 기준선
const TARGET_COST_RATE = 22.2;

type PriceCostKey = keyof typeof PRICE_COST_COLORS;
type BreakdownKey = keyof typeof BREAKDOWN_COLORS;

export function TrendChart({ data }: TrendChartProps) {
  // 그래프 1: 가격 vs 원가 선택 상태
  const [selectedPriceCost, setSelectedPriceCost] = useState<Set<PriceCostKey>>(
    new Set(['평균TAG', '평균원가KRW'])
  );
  
  // 그래프 2: 단가구성 선택 상태
  const [selectedBreakdowns, setSelectedBreakdowns] = useState<Set<BreakdownKey>>(
    new Set(['원부자재', '아트웍', '공임', '기타경비'])
  );
  const [showOrderQty, setShowOrderQty] = useState(true);

  const togglePriceCost = (metric: PriceCostKey) => {
    setSelectedPriceCost((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(metric)) {
        if (newSet.size === 1) return prev;
        newSet.delete(metric);
      } else {
        newSet.add(metric);
      }
      return newSet;
    });
  };

  const toggleBreakdown = (key: BreakdownKey) => {
    setSelectedBreakdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        if (newSet.size === 1) return prev;
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // 시즌 정렬 (오래된 순서 → 최신)
  const sortedData = [...data].sort((a, b) => {
    const numA = parseInt(a.시즌.replace(/\D/g, ''));
    const numB = parseInt(b.시즌.replace(/\D/g, ''));
    return numA - numB;
  });

  // 차트 데이터
  const chartData = sortedData.map((item) => ({
    시즌: item.시즌,
    평균TAG: item.평균TAG,
    평균원가KRW: item.평균원가KRW,
    평균원가USD: item.평균원가USD,
    환율: item.적용환율,
    발주수량: item.발주수량,
    원가율: item.원가율,
    원부자재: item.원부자재단가,
    아트웍: item.아트웍단가,
    공임: item.공임단가,
    기타경비: item.기타경비단가,
  }));

  if (data.length === 0) {
    return (
      <div className="text-center text-slate-500 py-8">
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* 첫 번째 행: ① ② 나란히 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 가격 vs 원가 */}
        <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700">가격 vs 원가</CardTitle>
          <p className="text-xs text-slate-500 mt-1">적정원가율 {TARGET_COST_RATE}% (MU 4.5)</p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 55, left: 15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="시즌" 
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                
                {/* 왼쪽 Y축: 금액 (KRW) */}
                <YAxis 
                  yAxisId="krw"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
                  domain={['dataMin - 5000', 'dataMax + 5000']}
                  label={{ 
                    value: '금액 (KRW)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 10,
                    offset: 5
                  }}
                />
                
                {/* 오른쪽 Y축: 원가율 */}
                <YAxis 
                  yAxisId="rate"
                  orientation="right"
                  stroke={COST_RATE_COLOR}
                  tick={{ fill: COST_RATE_COLOR, fontSize: 10 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[15, 30]}
                  label={{ 
                    value: '원가율 (%)', 
                    angle: 90, 
                    position: 'insideRight',
                    fill: COST_RATE_COLOR,
                    fontSize: 10,
                    offset: 5
                  }}
                />
                
                {/* 적정원가율 22.2% 기준선 */}
                <ReferenceLine 
                  yAxisId="rate"
                  y={TARGET_COST_RATE} 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{ 
                    value: `적정 ${TARGET_COST_RATE}%(MU 4.5)`, 
                    position: 'right',
                    fill: '#10b981',
                    fontSize: 10,
                    fontWeight: 600
                  }}
                />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#334155', fontWeight: 600 }}
                  formatter={(value, name) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    if (name === '평균TAG') return [`₩${numValue.toLocaleString()}`, '평균TAG'];
                    if (name === '평균원가KRW') return [`₩${numValue.toLocaleString()}`, '평균원가'];
                    if (name === '원가율') return [`${numValue.toFixed(1)}%`, '원가율'];
                    return [numValue, name as string];
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      '평균TAG': '평균TAG (KRW)',
                      '평균원가KRW': '평균원가 (KRW)',
                      '원가율': '원가율 (%)',
                    };
                    return <span style={{ color: '#475569', fontSize: 11 }}>{labels[value] || value}</span>;
                  }}
                />
                
                {/* 막대: 평균TAG */}
                <Bar
                  yAxisId="krw"
                  dataKey="평균TAG"
                  fill={PRICE_COST_COLORS.평균TAG}
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                  barSize={30}
                />
                
                {/* 막대: 평균원가KRW */}
                <Bar
                  yAxisId="krw"
                  dataKey="평균원가KRW"
                  fill={PRICE_COST_COLORS.평균원가KRW}
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                  barSize={30}
                />
                
                {/* 꺾은선: 원가율 */}
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="원가율"
                  stroke={COST_RATE_COLOR}
                  strokeWidth={3}
                  dot={{ fill: COST_RATE_COLOR, strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ② 원가의 원인 & 구조 (USD 통합) - Stacked Area + 환율 Line */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-base text-slate-700">원가원인 & 발주량</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {(['원부자재', '아트웍', '공임', '기타경비'] as BreakdownKey[]).map((key) => (
              <label key={key} className="flex items-center gap-1 cursor-pointer text-xs">
                <Checkbox
                  checked={selectedBreakdowns.has(key)}
                  onCheckedChange={() => toggleBreakdown(key)}
                  className="w-3.5 h-3.5"
                  style={{
                    borderColor: BREAKDOWN_COLORS[key],
                    backgroundColor: selectedBreakdowns.has(key) ? BREAKDOWN_COLORS[key] : 'transparent',
                  }}
                />
                <span style={{ color: BREAKDOWN_COLORS[key] }}>{key}</span>
              </label>
            ))}
            <label className="flex items-center gap-1 cursor-pointer text-xs ml-2">
              <Checkbox
                checked={showOrderQty}
                onCheckedChange={() => setShowOrderQty(prev => !prev)}
                className="w-3.5 h-3.5"
                style={{
                  borderColor: ORDER_QTY_COLOR,
                  backgroundColor: showOrderQty ? ORDER_QTY_COLOR : 'transparent',
                }}
              />
              <span style={{ color: ORDER_QTY_COLOR }}>발주수량</span>
            </label>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 25, right: 55, left: 15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="시즌" 
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                
                {/* 왼쪽 Y축: 단가구성 (USD) */}
                <YAxis 
                  yAxisId="usd"
                  stroke="#64748b"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(value) => `$${value}`}
                  label={{ 
                    value: '단가 (USD)', 
                    angle: -90, 
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 10,
                    offset: 5
                  }}
                />
                
                {/* 오른쪽 Y축: 발주수량 */}
                <YAxis 
                  yAxisId="qty"
                  orientation="right"
                  stroke={ORDER_QTY_COLOR}
                  tick={{ fill: ORDER_QTY_COLOR, fontSize: 10 }}
                  tickFormatter={(value) => `${(value/1000).toFixed(0)}K`}
                  domain={['dataMin - 5000', 'dataMax + 5000']}
                  label={{ 
                    value: '발주수량', 
                    angle: 90, 
                    position: 'insideRight',
                    fill: ORDER_QTY_COLOR,
                    fontSize: 10,
                    offset: 5
                  }}
                />
                
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: '#334155', fontWeight: 600 }}
                  formatter={(value, name) => {
                    const numValue = typeof value === 'number' ? value : 0;
                    if (name === '발주수량') return [`${numValue.toLocaleString()}`, '발주수량'];
                    return [`$${numValue.toFixed(2)}`, name as string];
                  }}
                />
                <Legend 
                  payload={[
                    ...(selectedBreakdowns.has('원부자재') ? [{ value: '원부자재', type: 'square' as const, color: BREAKDOWN_COLORS.원부자재 }] : []),
                    ...(selectedBreakdowns.has('아트웍') ? [{ value: '아트웍', type: 'square' as const, color: BREAKDOWN_COLORS.아트웍 }] : []),
                    ...(selectedBreakdowns.has('공임') ? [{ value: '공임', type: 'square' as const, color: BREAKDOWN_COLORS.공임 }] : []),
                    ...(selectedBreakdowns.has('기타경비') ? [{ value: '기타경비', type: 'square' as const, color: BREAKDOWN_COLORS.기타경비 }] : []),
                    ...(showOrderQty ? [{ value: '발주수량', type: 'line' as const, color: ORDER_QTY_COLOR }] : []),
                  ]}
                  formatter={(value) => (
                    <span style={{ color: '#475569', fontSize: 10 }}>{value}</span>
                  )}
                />
                
                {/* Stacked Area: 단가구성 */}
                {selectedBreakdowns.has('기타경비') && (
                  <Area
                    yAxisId="usd"
                    type="monotone"
                    dataKey="기타경비"
                    stackId="1"
                    stroke={BREAKDOWN_COLORS.기타경비}
                    fill={BREAKDOWN_COLORS.기타경비}
                    fillOpacity={0.6}
                  />
                )}
                {selectedBreakdowns.has('공임') && (
                  <Area
                    yAxisId="usd"
                    type="monotone"
                    dataKey="공임"
                    stackId="1"
                    stroke={BREAKDOWN_COLORS.공임}
                    fill={BREAKDOWN_COLORS.공임}
                    fillOpacity={0.6}
                  />
                )}
                {selectedBreakdowns.has('아트웍') && (
                  <Area
                    yAxisId="usd"
                    type="monotone"
                    dataKey="아트웍"
                    stackId="1"
                    stroke={BREAKDOWN_COLORS.아트웍}
                    fill={BREAKDOWN_COLORS.아트웍}
                    fillOpacity={0.6}
                  />
                )}
                {selectedBreakdowns.has('원부자재') && (
                  <Area
                    yAxisId="usd"
                    type="monotone"
                    dataKey="원부자재"
                    stackId="1"
                    stroke={BREAKDOWN_COLORS.원부자재}
                    fill={BREAKDOWN_COLORS.원부자재}
                    fillOpacity={0.6}
                  >
                    <LabelList 
                      dataKey="평균원가USD" 
                      position="top" 
                      offset={20}
                      formatter={(value) => `$${Number(value).toFixed(2)}`}
                      style={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                    />
                  </Area>
                )}
                
                {/* Line: 발주수량 */}
                {showOrderQty && (
                  <Line
                    yAxisId="qty"
                    type="monotone"
                    dataKey="발주수량"
                    stroke={ORDER_QTY_COLOR}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: ORDER_QTY_COLOR, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
