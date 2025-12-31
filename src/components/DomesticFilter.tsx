'use client';

import { DomesticType, DOMESTIC_TYPES } from '@/lib/types';

interface DomesticFilterProps {
  selectedTypes: DomesticType[];
  onToggle: (type: DomesticType) => void;
  onSelectAll: () => void;
}

const TYPE_STYLES: Record<DomesticType, { active: string; inactive: string }> = {
  '내수': {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'bg-white text-blue-600 border-blue-200 hover:border-blue-400',
  },
  '직송': {
    active: 'bg-amber-500 text-white border-amber-500',
    inactive: 'bg-white text-amber-600 border-amber-200 hover:border-amber-400',
  },
  '중국생산': {
    active: 'bg-rose-500 text-white border-rose-500',
    inactive: 'bg-white text-rose-600 border-rose-200 hover:border-rose-400',
  },
};

export function DomesticFilter({ selectedTypes, onToggle, onSelectAll }: DomesticFilterProps) {
  const isAllSelected = selectedTypes.length === DOMESTIC_TYPES.length;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500 mr-1">내수구분:</span>
      
      {/* 전체 버튼 */}
      <button
        onClick={onSelectAll}
        className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all ${
          isAllSelected 
            ? 'bg-emerald-500 text-white border-emerald-500' 
            : 'bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400'
        }`}
      >
        전체
      </button>
      
      {/* 개별 타입 버튼들 */}
      {DOMESTIC_TYPES.map((type) => {
        const isActive = selectedTypes.includes(type);
        const styles = TYPE_STYLES[type];
        
        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`px-4 py-2 border-2 rounded-lg text-sm font-semibold transition-all ${
              isActive ? styles.active : styles.inactive
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}
