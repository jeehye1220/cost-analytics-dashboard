'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CompareItem, CompareLevel } from '@/lib/types';
import {
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Bar,
  BarChart,
  ReferenceLine,
  LabelList,
} from 'recharts';

interface CompareSectionProps {
  items: CompareItem[];
  onRemoveItem: (id: string) => void;
  onClear: () => void;
}

const LEVEL_LABELS: Record<CompareLevel, string> = {
  season: '시즌',
  item: '아이템',
  style: '스타일',
};

const LEVEL_COLORS: Record<CompareLevel, string> = {
  season: 'bg-emerald-600',
  item: 'bg-amber-600',
  style: 'bg-cyan-600',
};

const CHART_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#84cc16', // lime
  '#ec4899', // pink
];

// 단가 구성 항목별 색상
const COST_COLORS = {
  원부자재: '#3b82f6', // blue
  아트웍: '#a855f7', // purple
  공임: '#f59e0b', // amber
  기타경비: '#ec4899', // pink
};

type CostType = keyof typeof COST_COLORS;
const COST_TYPES: CostType[] = ['원부자재', '아트웍', '공임', '기타경비'];

// 적정원가율
const TARGET_COST_RATE = 22.2;

// 가격 vs 원가 색상
const PRICE_COST_COLORS = {
  평균TAG: '#8b5cf6',     // violet
  평균원가KRW: '#3b82f6', // blue
};
const COST_RATE_COLOR = '#ef4444'; // red

export function CompareSection({ items, onRemoveItem, onClear }: CompareSectionProps) {
  const currentLevel = items.length > 0 ? items[0].level : null;
  
  // 범례 선택 상태 (기본값: 전부 선택)
  const [selectedCosts, setSelectedCosts] = useState<Set<CostType>>(new Set(COST_TYPES));

  const toggleCost = (cost: CostType) => {
    setSelectedCosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cost)) {
        if (newSet.size === 1) return prev;
        newSet.delete(cost);
      } else {
        newSet.add(cost);
      }
      return newSet;
    });
  };

  // 시즌 정렬 (오래된 순서로 - YOY 계산을 위해)
  const sortedItems = [...items].sort((a, b) => {
    const numA = parseInt((a.시즌 || '').replace(/\D/g, ''));
    const numB = parseInt((b.시즌 || '').replace(/\D/g, ''));
    return numA - numB; // 오름차순 (23S → 24S → 25S → 26S)
  });

  // ① 단가 구성 Stacked Bar 데이터 (평균원가USD 포함)
  const stackedBarData = sortedItems.map((item) => ({
    name: item.label,
    원부자재: item.원부자재단가,
    아트웍: item.아트웍단가,
    공임: item.공임단가,
    기타경비: item.기타경비단가,
    평균원가USD: item.평균원가USD,
  }));

  // ② 가격 vs 원가 데이터 (KRW 막대 + 원가율 꺾은선)
  const priceVsCostData = sortedItems.map((item) => {
    const 원가율 = item.평균TAG > 0 ? (item.평균원가KRW / item.평균TAG) * 100 : 0;
    return {
      name: item.label,
      평균TAG: item.평균TAG,
      평균원가KRW: item.평균원가KRW,
      원가율: Math.round(원가율 * 10) / 10,
    };
  });

  // ③ YOY 비교 데이터
  const yoyData = sortedItems.map((item, idx) => {
    const prevItem = idx > 0 ? sortedItems[idx - 1] : null;
    
    const tagYOY = prevItem && prevItem.평균TAG > 0 
      ? (item.평균TAG / prevItem.평균TAG) * 100 
      : 100;
    const usdYOY = prevItem && prevItem.평균원가USD > 0 
      ? (item.평균원가USD / prevItem.평균원가USD) * 100 
      : 100;

    return {
      name: item.label,
      TAG_YOY: Math.round(tagYOY * 10) / 10,
      USD_YOY: Math.round(usdYOY * 10) / 10,
    };
  });

  if (items.length === 0) {
    return (
      <Card className="bg-slate-50 border-slate-200 border-dashed">
        <CardContent className="py-8 text-center">
          <div className="text-slate-400">
            <span className="text-2xl mb-2 block">📊</span>
            <p>비교할 항목을 체크박스로 선택하세요</p>
            <p className="text-xs mt-1 text-slate-400">같은 레벨끼리만 비교 가능합니다 (시즌↔시즌, 아이템↔아이템 등)</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
            <span className="text-emerald-600">📊</span>
            아이템별 원가 분석
            {currentLevel && (
              <span className={`px-2 py-0.5 text-xs rounded-full text-white ${LEVEL_COLORS[currentLevel]}`}>
                {LEVEL_LABELS[currentLevel]} 비교
              </span>
            )}
            <span className="text-sm font-normal text-slate-400">
              ({items.length}개 선택)
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            전체 해제
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {/* 선택된 항목 태그들 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {sortedItems.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm"
              style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
            >
              <span>{item.label}</span>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* 그래프 영역 */}
        {items.length >= 2 && (
          <div className="space-y-6 mb-4">
            {/* 첫 번째 행: ① ② 나란히 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* ① 단가 구성 비교 (USD) - Stacked Bar */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-600">① 단가 구성 비교 (USD)</h4>
                  <div className="flex items-center gap-2">
                    {COST_TYPES.map((cost) => (
                      <label 
                        key={cost} 
                        className="flex items-center gap-1 cursor-pointer text-xs"
                      >
                        <Checkbox
                          checked={selectedCosts.has(cost)}
                          onCheckedChange={() => toggleCost(cost)}
                          className="w-3 h-3"
                          style={{ 
                            borderColor: COST_COLORS[cost],
                            backgroundColor: selectedCosts.has(cost) ? COST_COLORS[cost] : 'transparent'
                          }}
                        />
                        <span style={{ color: COST_COLORS[cost] }}>{cost}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stackedBarData} margin={{ top: 25, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `$${value}`}
                      label={{ 
                        value: 'USD', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: '#64748b',
                        fontSize: 10
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
                        if (name === '평균원가USD') return [`$${numValue.toFixed(2)}`, '평균원가 (USD)'];
                        return [`$${numValue.toFixed(2)}`, name as string];
                      }}
                    />
                    <Legend 
                      formatter={(value) => <span style={{ color: '#475569', fontSize: 11 }}>{value}</span>}
                    />
                    {selectedCosts.has('원부자재') && (
                      <Bar dataKey="원부자재" stackId="a" fill={COST_COLORS.원부자재} />
                    )}
                    {selectedCosts.has('아트웍') && (
                      <Bar dataKey="아트웍" stackId="a" fill={COST_COLORS.아트웍} />
                    )}
                    {selectedCosts.has('공임') && (
                      <Bar dataKey="공임" stackId="a" fill={COST_COLORS.공임} />
                    )}
                    {selectedCosts.has('기타경비') && (
                      <Bar dataKey="기타경비" stackId="a" fill={COST_COLORS.기타경비}>
                        <LabelList 
                          dataKey="평균원가USD" 
                          position="top" 
                          formatter={(value) => `$${Number(value).toFixed(2)}`}
                          style={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                        />
                      </Bar>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ② 가격 vs 원가 - KRW 막대 + 원가율 꺾은선 */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-600">② 가격 vs 원가</h4>
                  <span className="text-xs text-slate-500">적정원가율 {TARGET_COST_RATE}% (MU 4.5)</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={priceVsCostData} margin={{ top: 10, right: 55, left: 15, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    
                    {/* 왼쪽 Y축: 금액 (KRW) */}
                    <YAxis 
                      yAxisId="krw"
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `₩${(value/1000).toFixed(0)}K`}
                      domain={['dataMin - 5000', 'dataMax + 5000']}
                      label={{ 
                        value: '금액 (KRW)', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: '#64748b',
                        fontSize: 10
                      }}
                    />
                    
                    {/* 오른쪽 Y축: 원가율 */}
                    <YAxis 
                      yAxisId="rate"
                      orientation="right"
                      tick={{ fill: COST_RATE_COLOR, fontSize: 10 }} 
                      axisLine={{ stroke: COST_RATE_COLOR }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[15, 30]}
                      label={{ 
                        value: '원가율 (%)', 
                        angle: 90, 
                        position: 'insideRight',
                        fill: COST_RATE_COLOR,
                        fontSize: 10
                      }}
                    />
                    
                    {/* 적정원가율 22.2% 기준선 */}
                    <ReferenceLine 
                      yAxisId="rate"
                      y={TARGET_COST_RATE} 
                      stroke="#10b981" 
                      strokeWidth={2}
                      label={{ 
                        value: `적정 ${TARGET_COST_RATE}%`, 
                        position: 'right',
                        fill: '#10b981',
                        fontSize: 9,
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
                      barSize={25}
                    />
                    
                    {/* 막대: 평균원가KRW */}
                    <Bar
                      yAxisId="krw"
                      dataKey="평균원가KRW"
                      fill={PRICE_COST_COLORS.평균원가KRW}
                      radius={[4, 4, 0, 0]}
                      opacity={0.7}
                      barSize={25}
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
            </div>

            {/* 두 번째 행: ③ YOY 비교 */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-sm font-medium text-slate-600 mb-3">③ YOY 비교 (보조 지표)</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={yoyData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 10 }} 
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    label={{ 
                      value: 'YOY %', 
                      angle: -90, 
                      position: 'insideLeft',
                      fill: '#64748b',
                      fontSize: 10
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
                      const diff = numValue - 100;
                      const sign = diff >= 0 ? '+' : '';
                      return [`${numValue.toFixed(1)}% (${sign}${diff.toFixed(1)}%)`, name as string];
                    }}
                  />
                  <Legend 
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        'TAG_YOY': 'TAG YOY %',
                        'USD_YOY': 'USD 원가 YOY %',
                      };
                      return <span style={{ color: '#475569', fontSize: 11 }}>{labels[value] || value}</span>;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="TAG_YOY" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="USD_YOY" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 비교 테이블 */}
        <div className="overflow-x-auto bg-slate-50 rounded-xl p-4 border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-slate-500 font-medium">항목</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">발주수량</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">평균TAG</th>
                <th className="text-right py-2 px-3 text-slate-500 font-medium">평균원가(KRW)</th>
                <th className="text-right py-2 px-3 text-blue-600 font-medium">원부자재</th>
                <th className="text-right py-2 px-3 text-purple-600 font-medium">아트웍</th>
                <th className="text-right py-2 px-3 text-amber-600 font-medium">공임</th>
                <th className="text-right py-2 px-3 text-pink-600 font-medium">기타경비</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => (
                <tr 
                  key={item.id} 
                  className="border-b border-slate-100 hover:bg-slate-100/50"
                >
                  <td className="py-2 px-3 font-medium flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="text-slate-700">{item.label}</span>
                  </td>
                  <td className="text-right py-2 px-3 text-slate-700">
                    {item.발주수량.toLocaleString()}
                  </td>
                  <td className="text-right py-2 px-3 text-slate-700">
                    ₩{item.평균TAG.toLocaleString()}
                  </td>
                  <td className="text-right py-2 px-3 text-slate-700">
                    ₩{item.평균원가KRW.toLocaleString()}
                  </td>
                  <td className="text-right py-2 px-3 text-blue-600">
                    ${item.원부자재단가.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3 text-purple-600">
                    ${item.아트웍단가.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3 text-amber-600">
                    ${item.공임단가.toFixed(2)}
                  </td>
                  <td className="text-right py-2 px-3 text-pink-600">
                    ${item.기타경비단가.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
