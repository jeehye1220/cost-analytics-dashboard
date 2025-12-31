'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySummary } from '@/lib/types';

interface CategoryCardProps {
  summary: CategorySummary;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

// 카테고리별 아이콘/이모지 매핑
const CATEGORY_ICONS: Record<string, string> = {
  'Headwear': '🧢',
  'Bag': '👜',
  'Outer': '🧥',
  'Bottom': '👖',
  'Acc_etc': '🎒',
  'Inner': '👕',
  'Shoes': '👟',
  'Wear_etc': '👔',
};

export function CategoryCard({ summary, isSelected, onClick, onDoubleClick }: CategoryCardProps) {
  const icon = CATEGORY_ICONS[summary.중분류] || '📦';
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
        isSelected 
          ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-400 shadow-lg shadow-emerald-100' 
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">{icon}</span>
          <span className="text-slate-700 font-semibold">{summary.중분류}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 원가율 - 강조 표시 */}
        <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100">
          <span className="text-slate-500 text-sm font-medium">원가율(KRW)</span>
          <span className={`text-2xl font-bold ${
            summary.원가율 <= 20 ? 'text-emerald-600' : 
            summary.원가율 <= 25 ? 'text-amber-600' : 'text-rose-600'
          }`}>
            {summary.원가율.toFixed(1)}%
          </span>
        </div>
        
        {/* 기타 지표들 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col p-2 rounded-lg bg-blue-50/50">
            <span className="text-slate-400 text-xs">발주수량</span>
            <span className="text-slate-700 font-semibold">
              {summary.발주수량.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col p-2 rounded-lg bg-purple-50/50">
            <span className="text-slate-400 text-xs">평균TAG</span>
            <span className="text-slate-700 font-semibold">
              ₩{summary.평균TAG.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col p-2 rounded-lg bg-green-50/50">
            <span className="text-slate-400 text-xs">평균원가(USD)</span>
            <span className="text-slate-700 font-semibold">
              ${summary.평균원가USD.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col p-2 rounded-lg bg-orange-50/50">
            <span className="text-slate-400 text-xs">평균원가(KRW)</span>
            <span className="text-slate-700 font-semibold">
              ₩{summary.평균원가KRW.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* 적용환율 */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <span className="text-slate-400 text-xs">적용환율</span>
          <span className="text-slate-600 text-sm font-medium">
            {summary.적용환율.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
