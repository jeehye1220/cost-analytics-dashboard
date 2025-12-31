'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SeasonHierarchy, ItemData, StyleData, CompareItem, CompareLevel } from '@/lib/types';

interface SeasonDetailTableProps {
  category: string;
  hierarchyData: SeasonHierarchy[];
  selectedItems: CompareItem[];
  onToggleItem: (item: CompareItem) => void;
  currentLevel: CompareLevel | null;
}

export function SeasonDetailTable({ 
  category, 
  hierarchyData,
  selectedItems,
  onToggleItem,
  currentLevel
}: SeasonDetailTableProps) {
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSeason = (season: string) => {
    setExpandedSeasons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(season)) {
        newSet.delete(season);
      } else {
        newSet.add(season);
      }
      return newSet;
    });
  };

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isItemSelected = (id: string) => selectedItems.some((item) => item.id === id);
  const canSelectLevel = (level: CompareLevel) => currentLevel === null || currentLevel === level;

  if (hierarchyData.length === 0) {
    return (
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardContent className="py-8 text-center text-slate-500">
          데이터가 없습니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
          <span className="text-emerald-600">📊</span>
          {category} - 상세 현황
          <span className="text-xs text-slate-400 font-normal ml-2">
            (체크박스로 비교할 항목 선택 - 같은 레벨끼리만 비교 가능)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {hierarchyData.map((season, seasonIdx) => (
          <SeasonAccordion
            key={season.시즌}
            season={season}
            category={category}
            isLatest={seasonIdx === 0}
            isExpanded={expandedSeasons.has(season.시즌)}
            onToggle={() => toggleSeason(season.시즌)}
            expandedItems={expandedItems}
            onToggleItem={toggleItem}
            isSelected={isItemSelected(`season-${category}-${season.시즌}`)}
            onSelect={onToggleItem}
            canSelectSeason={canSelectLevel('season')}
            canSelectItem={canSelectLevel('item')}
            canSelectStyle={canSelectLevel('style')}
            isItemSelectedFn={isItemSelected}
          />
        ))}
      </CardContent>
    </Card>
  );
}

// 시즌 레벨 아코디언
function SeasonAccordion({
  season,
  category,
  isLatest,
  isExpanded,
  onToggle,
  expandedItems,
  onToggleItem,
  isSelected,
  onSelect,
  canSelectSeason,
  canSelectItem,
  canSelectStyle,
  isItemSelectedFn,
}: {
  season: SeasonHierarchy;
  category: string;
  isLatest: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  expandedItems: Set<string>;
  onToggleItem: (key: string) => void;
  isSelected: boolean;
  onSelect: (item: CompareItem) => void;
  canSelectSeason: boolean;
  canSelectItem: boolean;
  canSelectStyle: boolean;
  isItemSelectedFn: (id: string) => boolean;
}) {
  const handleCheckboxChange = () => {
    let 원부자재단가 = 0;
    let 아트웍단가 = 0;
    let 공임단가 = 0;
    let 기타경비단가 = 0;
    
    if (season.items.length > 0) {
      const totalQty = season.items.reduce((sum, item) => sum + item.발주수량, 0);
      if (totalQty > 0) {
        원부자재단가 = Math.round(season.items.reduce((sum, item) => sum + item.원부자재단가 * item.발주수량, 0) / totalQty * 100) / 100;
        아트웍단가 = Math.round(season.items.reduce((sum, item) => sum + item.아트웍단가 * item.발주수량, 0) / totalQty * 100) / 100;
        공임단가 = Math.round(season.items.reduce((sum, item) => sum + item.공임단가 * item.발주수량, 0) / totalQty * 100) / 100;
        기타경비단가 = Math.round(season.items.reduce((sum, item) => sum + item.기타경비단가 * item.발주수량, 0) / totalQty * 100) / 100;
      }
    }

    const compareItem: CompareItem = {
      id: `season-${category}-${season.시즌}`,
      level: 'season',
      label: `${season.시즌}`,
      시즌: season.시즌,
      발주수량: season.발주수량,
      평균TAG: season.평균TAG,
      평균원가USD: season.평균원가USD,
      평균원가KRW: season.평균원가KRW,
      적용환율: season.적용환율,
      원부자재단가,
      아트웍단가,
      공임단가,
      기타경비단가,
    };
    onSelect(compareItem);
  };

  return (
    <div className={`rounded-xl border ${isLatest ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50'} ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}>
      {/* 시즌 헤더 */}
      <div className="flex items-center gap-2 p-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          disabled={!canSelectSeason}
          className={`${canSelectSeason ? 'border-emerald-500 data-[state=checked]:bg-emerald-600' : 'border-slate-300 opacity-50'}`}
        />
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between hover:bg-slate-100/50 transition-colors rounded-lg p-1"
        >
          <div className="flex items-center gap-3">
            <span className={`text-lg transition-transform text-slate-400 ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className={`font-bold text-lg ${isLatest ? 'text-emerald-700' : 'text-slate-700'}`}>
              {season.시즌}
            </span>
            {isLatest && (
              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium">
                최신
              </span>
            )}
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <span className="text-slate-400">발주수량 </span>
              <span className="text-slate-700 font-medium">{season.발주수량.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">평균TAG </span>
              <span className="text-slate-700 font-medium">₩{season.평균TAG.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">원가(USD) </span>
              <span className="text-slate-700 font-medium">${season.평균원가USD.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">원가(KRW) </span>
              <span className="text-slate-700 font-medium">₩{season.평균원가KRW.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">환율 </span>
              <span className="text-slate-600 font-medium">{season.적용환율.toLocaleString()}</span>
            </div>
          </div>
        </button>
      </div>

      {/* 아이템 목록 */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-1">
          {season.items.map((item) => (
            <ItemAccordion
              key={`${season.시즌}-${item.아이템명}`}
              item={item}
              seasonKey={season.시즌}
              category={category}
              isExpanded={expandedItems.has(`${season.시즌}-${item.아이템명}`)}
              onToggle={() => onToggleItem(`${season.시즌}-${item.아이템명}`)}
              isSelected={isItemSelectedFn(`item-${category}-${season.시즌}-${item.아이템명}`)}
              onSelect={onSelect}
              canSelectItem={canSelectItem}
              canSelectStyle={canSelectStyle}
              isItemSelectedFn={isItemSelectedFn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 아이템 레벨 아코디언
function ItemAccordion({
  item,
  seasonKey,
  category,
  isExpanded,
  onToggle,
  isSelected,
  onSelect,
  canSelectItem,
  canSelectStyle,
  isItemSelectedFn,
}: {
  item: ItemData;
  seasonKey: string;
  category: string;
  isExpanded: boolean;
  onToggle: () => void;
  isSelected: boolean;
  onSelect: (item: CompareItem) => void;
  canSelectItem: boolean;
  canSelectStyle: boolean;
  isItemSelectedFn: (id: string) => boolean;
}) {
  const handleCheckboxChange = () => {
    const compareItem: CompareItem = {
      id: `item-${category}-${seasonKey}-${item.아이템명}`,
      level: 'item',
      label: `${seasonKey} ${item.아이템명}`,
      시즌: seasonKey,
      아이템명: item.아이템명,
      발주수량: item.발주수량,
      평균TAG: item.평균TAG,
      평균원가USD: item.평균원가USD,
      평균원가KRW: item.평균원가KRW,
      적용환율: item.적용환율,
      원부자재단가: item.원부자재단가,
      아트웍단가: item.아트웍단가,
      공임단가: item.공임단가,
      기타경비단가: item.기타경비단가,
    };
    onSelect(compareItem);
  };

  return (
    <div className={`rounded-lg border border-slate-200 bg-white ml-6 ${isSelected ? 'ring-2 ring-amber-400' : ''}`}>
      {/* 아이템 헤더 */}
      <div className="flex items-center gap-2 p-2.5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          disabled={!canSelectItem}
          className={`${canSelectItem ? 'border-amber-500 data-[state=checked]:bg-amber-500' : 'border-slate-300 opacity-50'}`}
        />
        <button
          onClick={onToggle}
          className="flex-1 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg p-1"
        >
          <div className="flex items-center gap-3">
            <span className={`text-sm transition-transform text-slate-400 ${isExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="font-medium text-amber-600">
              {item.아이템명}
            </span>
            <span className="text-xs text-slate-400">
              ({item.styles.length}개 스타일)
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <span className="text-slate-400">수량 </span>
              <span className="text-slate-700">{item.발주수량.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">TAG </span>
              <span className="text-slate-700">₩{item.평균TAG.toLocaleString()}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">USD </span>
              <span className="text-slate-700">${item.평균원가USD.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">KRW </span>
              <span className="text-slate-700">₩{item.평균원가KRW.toLocaleString()}</span>
            </div>
            <div className="border-l border-slate-200 pl-3 flex items-center gap-4">
              <div className="text-right">
                <span className="text-slate-400 text-xs">원부자재 </span>
                <span className="text-blue-600">${item.원부자재단가.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-xs">아트웍 </span>
                <span className="text-purple-600">${item.아트웍단가.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-xs">공임 </span>
                <span className="text-amber-600">${item.공임단가.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-xs">기타 </span>
                <span className="text-rose-600">${item.기타경비단가.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* 스타일 목록 */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5">
          <div className="ml-6 rounded-lg border border-slate-200 overflow-hidden">
            {/* 스타일 테이블 헤더 */}
            <div className="grid grid-cols-11 gap-2 p-2 bg-slate-50 text-xs text-slate-500 font-medium">
              <div></div>
              <div>스타일</div>
              <div className="text-right">발주수량</div>
              <div className="text-right">평균TAG</div>
              <div className="text-right">원가(USD)</div>
              <div className="text-right">원가(KRW)</div>
              <div className="text-right">환율</div>
              <div className="text-right text-blue-600">원부자재</div>
              <div className="text-right text-purple-600">아트웍</div>
              <div className="text-right text-amber-600">공임</div>
              <div className="text-right text-rose-600">기타경비</div>
            </div>
            {/* 스타일 행들 */}
            {item.styles.map((style, idx) => (
              <StyleRow 
                key={style.스타일} 
                style={style} 
                seasonKey={seasonKey}
                itemName={item.아이템명}
                category={category}
                isFirst={idx === 0}
                isSelected={isItemSelectedFn(`style-${category}-${seasonKey}-${item.아이템명}-${style.스타일}`)}
                onSelect={onSelect}
                canSelect={canSelectStyle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 스타일 행
function StyleRow({ 
  style, 
  seasonKey, 
  itemName, 
  category,
  isFirst,
  isSelected,
  onSelect,
  canSelect
}: { 
  style: StyleData; 
  seasonKey: string;
  itemName: string;
  category: string;
  isFirst: boolean;
  isSelected: boolean;
  onSelect: (item: CompareItem) => void;
  canSelect: boolean;
}) {
  const handleCheckboxChange = () => {
    const compareItem: CompareItem = {
      id: `style-${category}-${seasonKey}-${itemName}-${style.스타일}`,
      level: 'style',
      label: `${seasonKey} ${style.스타일}`,
      시즌: seasonKey,
      아이템명: itemName,
      스타일: style.스타일,
      발주수량: style.발주수량,
      평균TAG: style.평균TAG,
      평균원가USD: style.평균원가USD,
      평균원가KRW: style.평균원가KRW,
      적용환율: style.적용환율,
      원부자재단가: style.원부자재단가,
      아트웍단가: style.아트웍단가,
      공임단가: style.공임단가,
      기타경비단가: style.기타경비단가,
    };
    onSelect(compareItem);
  };

  return (
    <div className={`grid grid-cols-11 gap-2 p-2 text-sm hover:bg-slate-50 border-t border-slate-100 ${isFirst ? 'bg-blue-50/30' : ''} ${isSelected ? 'bg-cyan-50 ring-1 ring-cyan-400' : ''}`}>
      <div className="flex items-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          disabled={!canSelect}
          className={`${canSelect ? 'border-cyan-500 data-[state=checked]:bg-cyan-500' : 'border-slate-300 opacity-50'}`}
        />
      </div>
      <div className={`font-mono ${isFirst ? 'text-cyan-700 font-medium' : 'text-slate-600'}`}>
        {style.스타일}
      </div>
      <div className="text-right text-slate-700">
        {style.발주수량.toLocaleString()}
      </div>
      <div className="text-right text-slate-700">
        ₩{style.평균TAG.toLocaleString()}
      </div>
      <div className="text-right text-slate-700">
        ${style.평균원가USD.toFixed(2)}
      </div>
      <div className="text-right text-slate-700">
        ₩{style.평균원가KRW.toLocaleString()}
      </div>
      <div className="text-right text-slate-600">
        {style.적용환율.toLocaleString()}
      </div>
      <div className="text-right text-blue-600">
        ${style.원부자재단가.toFixed(2)}
      </div>
      <div className="text-right text-purple-600">
        ${style.아트웍단가.toFixed(2)}
      </div>
      <div className="text-right text-amber-600">
        ${style.공임단가.toFixed(2)}
      </div>
      <div className="text-right text-rose-600">
        ${style.기타경비단가.toFixed(2)}
      </div>
    </div>
  );
}
