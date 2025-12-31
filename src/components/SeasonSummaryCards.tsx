'use client';

import { Card, CardContent } from '@/components/ui/card';
import { SeasonSummary } from '@/lib/types';

interface SeasonSummaryCardsProps {
  summaries: SeasonSummary[];
}

// 시즌별 그라데이션 색상
const SEASON_COLORS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-600',
];

export function SeasonSummaryCards({ summaries }: SeasonSummaryCardsProps) {
  if (summaries.length === 0) {
    return null;
  }

  // 과거 시즌부터 최신 시즌 순서로 정렬 (23S → 24S → 25S → 26S)
  const sortedSummaries = [...summaries].sort((a, b) => {
    const numA = parseInt(a.시즌.replace(/\D/g, ''));
    const numB = parseInt(b.시즌.replace(/\D/g, ''));
    return numA - numB;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {sortedSummaries.map((summary, index) => (
        <Card 
          key={summary.시즌}
          className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] overflow-hidden"
        >
          {/* 상단 색상 바 */}
          <div className={`h-1.5 bg-gradient-to-r ${SEASON_COLORS[index % SEASON_COLORS.length]}`} />
          
          <CardContent className="p-4">
            {/* 시즌 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl font-bold text-slate-700">
                {summary.시즌}
              </span>
              {index === sortedSummaries.length - 1 && (
                <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium">
                  최신
                </span>
              )}
            </div>

            {/* 원가율 - 강조 */}
            <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100">
              <div className="text-xs text-slate-400 mb-1">원가율(KRW)</div>
              <div className={`text-2xl font-bold ${
                summary.원가율 <= 18 ? 'text-emerald-600' : 
                summary.원가율 <= 20 ? 'text-amber-600' : 'text-rose-600'
              }`}>
                {summary.원가율.toFixed(1)}%
              </div>
            </div>

            {/* 기타 지표들 */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">발주수량</span>
                <span className="text-slate-700 font-medium">{summary.발주수량.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">평균TAG</span>
                <span className="text-slate-700 font-medium">₩{summary.평균TAG.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">평균원가(USD)</span>
                <span className="text-slate-700 font-medium">${summary.평균원가USD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">평균원가(KRW)</span>
                <span className="text-slate-700 font-medium">₩{summary.평균원가KRW.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-400">적용환율</span>
                <span className="text-slate-600 font-medium">{summary.적용환율.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
