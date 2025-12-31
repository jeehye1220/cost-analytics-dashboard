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
  // 시즌별 가중평균 단가 계산
  const calculateSeasonAverages = () => {
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
    
    return { 원부자재단가, 아트웍단가, 공임단가, 기타경비단가 };
  };

  const { 원부자재단가, 아트웍단가, 공임단가, 기타경비단가 } = calculateSeasonAverages();

  const handleCheckboxChange = () => {
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
    <div className={`rounded-xl border ${isLatest ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50'} ${isSelected ? 'ring-2 ring-emerald-500' : ''} overflow-hidden`}>
      {/* 시즌 헤더 - 아이템 테이블과 동일한 형식 */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-3 py-3">
          {/* 헤더 라벨 */}
          <div className="grid grid-cols-[40px_1fr_100px_110px_100px_90px_90px_90px_90px] gap-2 pb-2 mb-2 border-b border-slate-100 text-xs text-slate-500 font-medium">
            <div></div>
            <div>시즌</div>
            <div className="text-right">발주수량</div>
            <div className="text-right">평균TAG</div>
            <div className="text-right">원가(USD)</div>
            <div className="text-right text-blue-600">원부자재</div>
            <div className="text-right text-purple-600">아트웍</div>
            <div className="text-right text-amber-600">공임</div>
            <div className="text-right text-rose-600">기타경비</div>
          </div>
          {/* 시즌 데이터 */}
          <div className="grid grid-cols-[40px_1fr_100px_110px_100px_90px_90px_90px_90px] gap-2 items-center">
            <div className="flex items-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                disabled={!canSelectSeason}
                className={`${canSelectSeason ? 'border-emerald-500 data-[state=checked]:bg-emerald-600' : 'border-slate-300 opacity-50'}`}
              />
            </div>
            <button
              onClick={onToggle}
              className="flex items-center gap-3 text-left hover:text-emerald-600 transition-colors"
            >
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
            </button>
            <div className="text-right text-slate-700 font-medium">
              {season.발주수량.toLocaleString()}
            </div>
            <div className="text-right text-slate-700 font-medium">
              ₩{season.평균TAG.toLocaleString()}
            </div>
            <div className="text-right text-slate-700 font-medium">
              ${season.평균원가USD.toFixed(2)}
            </div>
            <div className="text-right text-blue-600 font-medium">
              ${원부자재단가.toFixed(2)}
            </div>
            <div className="text-right text-purple-600 font-medium">
              ${아트웍단가.toFixed(2)}
            </div>
            <div className="text-right text-amber-600 font-medium">
              ${공임단가.toFixed(2)}
            </div>
            <div className="text-right text-rose-600 font-medium">
              ${기타경비단가.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 아이템 목록 - 테이블 형식 */}
      {isExpanded && (
        <div className="bg-slate-50/30">
          <ItemTable
            items={season.items}
            seasonKey={season.시즌}
            category={category}
            expandedItems={expandedItems}
            onToggleItem={onToggleItem}
            isItemSelectedFn={isItemSelectedFn}
            onSelect={onSelect}
            canSelectItem={canSelectItem}
            canSelectStyle={canSelectStyle}
          />
        </div>
      )}
    </div>
  );
}

// 아이템 테이블 컴포넌트
function ItemTable({
  items,
  seasonKey,
  category,
  expandedItems,
  onToggleItem,
  isItemSelectedFn,
  onSelect,
  canSelectItem,
  canSelectStyle,
}: {
  items: ItemData[];
  seasonKey: string;
  category: string;
  expandedItems: Set<string>;
  onToggleItem: (key: string) => void;
  isItemSelectedFn: (id: string) => boolean;
  onSelect: (item: CompareItem) => void;
  canSelectItem: boolean;
  canSelectStyle: boolean;
}) {
  type SortField = '발주수량' | '평균TAG' | '평균원가USD' | '원부자재단가' | '아트웍단가' | '공임단가' | '기타경비단가';
  type SortOrder = 'asc' | 'desc';

  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case '발주수량':
        aValue = a.발주수량;
        bValue = b.발주수량;
        break;
      case '평균TAG':
        aValue = a.평균TAG;
        bValue = b.평균TAG;
        break;
      case '평균원가USD':
        aValue = a.평균원가USD;
        bValue = b.평균원가USD;
        break;
      case '원부자재단가':
        aValue = a.원부자재단가;
        bValue = b.원부자재단가;
        break;
      case '아트웍단가':
        aValue = a.아트웍단가;
        bValue = b.아트웍단가;
        break;
      case '공임단가':
        aValue = a.공임단가;
        bValue = b.공임단가;
        break;
      case '기타경비단가':
        aValue = a.기타경비단가;
        bValue = b.기타경비단가;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-slate-300 text-xs">↕</span>;
    }
    return <span className="text-slate-600 text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="px-3 py-3">
      <div className="ml-6 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
        {/* 테이블 헤더 */}
        <div className="grid grid-cols-[40px_1fr_100px_110px_100px_90px_90px_90px_90px] gap-2 p-2 bg-slate-50 text-xs text-slate-500 font-medium border-b border-slate-200">
          <div></div>
          <div className="min-w-[120px]">아이템명</div>
          <button
            onClick={() => handleSort('발주수량')}
            className="text-right hover:text-slate-700 flex items-center justify-end gap-1 cursor-pointer"
          >
            발주수량
            <SortIcon field="발주수량" />
          </button>
          <button
            onClick={() => handleSort('평균TAG')}
            className="text-right hover:text-slate-700 flex items-center justify-end gap-1 cursor-pointer"
          >
            평균TAG
            <SortIcon field="평균TAG" />
          </button>
          <button
            onClick={() => handleSort('평균원가USD')}
            className="text-right hover:text-slate-700 flex items-center justify-end gap-1 cursor-pointer"
          >
            원가(USD)
            <SortIcon field="평균원가USD" />
          </button>
          <button
            onClick={() => handleSort('원부자재단가')}
            className="text-right text-blue-600 hover:text-blue-700 flex items-center justify-end gap-1 cursor-pointer"
          >
            원부자재
            <SortIcon field="원부자재단가" />
          </button>
          <button
            onClick={() => handleSort('아트웍단가')}
            className="text-right text-purple-600 hover:text-purple-700 flex items-center justify-end gap-1 cursor-pointer"
          >
            아트웍
            <SortIcon field="아트웍단가" />
          </button>
          <button
            onClick={() => handleSort('공임단가')}
            className="text-right text-amber-600 hover:text-amber-700 flex items-center justify-end gap-1 cursor-pointer"
          >
            공임
            <SortIcon field="공임단가" />
          </button>
          <button
            onClick={() => handleSort('기타경비단가')}
            className="text-right text-rose-600 hover:text-rose-700 flex items-center justify-end gap-1 cursor-pointer"
          >
            기타경비
            <SortIcon field="기타경비단가" />
          </button>
        </div>
        {/* 아이템 행들 */}
        {sortedItems.map((item, idx) => (
          <ItemTableRow
            key={`${seasonKey}-${item.아이템명}`}
            item={item}
            seasonKey={seasonKey}
            category={category}
            isFirst={idx === 0}
            isExpanded={expandedItems.has(`${seasonKey}-${item.아이템명}`)}
            onToggle={() => onToggleItem(`${seasonKey}-${item.아이템명}`)}
            isSelected={isItemSelectedFn(`item-${category}-${seasonKey}-${item.아이템명}`)}
            onSelect={onSelect}
            canSelectItem={canSelectItem}
            canSelectStyle={canSelectStyle}
            isItemSelectedFn={isItemSelectedFn}
          />
        ))}
      </div>
    </div>
  );
}

// 아이템 테이블 행
function ItemTableRow({
  item,
  seasonKey,
  category,
  isFirst,
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
  isFirst: boolean;
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
    <>
      <div className={`grid grid-cols-[40px_1fr_100px_110px_100px_90px_90px_90px_90px] gap-2 p-2 text-sm hover:bg-slate-50/50 border-t border-slate-100 ${isSelected ? 'bg-amber-50 ring-1 ring-amber-400' : ''}`}>
        <div className="flex items-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleCheckboxChange}
            disabled={!canSelectItem}
            className={`${canSelectItem ? 'border-amber-500 data-[state=checked]:bg-amber-500' : 'border-slate-300 opacity-50'}`}
          />
        </div>
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-left hover:text-amber-600 transition-colors whitespace-nowrap min-w-0"
        >
          <span className={`text-xs transition-transform text-slate-400 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
          <span className="font-medium text-amber-600">
            {item.아이템명}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            ({item.styles.length}개 스타일)
          </span>
        </button>
        <div className="text-right text-slate-700">
          {item.발주수량.toLocaleString()}
        </div>
        <div className="text-right text-slate-700">
          ₩{item.평균TAG.toLocaleString()}
        </div>
        <div className="text-right text-slate-700">
          ${item.평균원가USD.toFixed(2)}
        </div>
        <div className="text-right text-blue-600">
          ${item.원부자재단가.toFixed(2)}
        </div>
        <div className="text-right text-purple-600">
          ${item.아트웍단가.toFixed(2)}
        </div>
        <div className="text-right text-amber-600">
          ${item.공임단가.toFixed(2)}
        </div>
        <div className="text-right text-rose-600">
          ${item.기타경비단가.toFixed(2)}
        </div>
      </div>
      {/* 스타일 목록 */}
      {isExpanded && (
        <div className="px-2.5 py-2.5 mt-2">
          <div className="ml-6 rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
            {/* 스타일 테이블 헤더 */}
            <div className="grid grid-cols-11 gap-2 p-2 bg-slate-50 text-xs text-slate-500 font-medium border-b border-slate-200">
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
    </>
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
    <div className={`grid grid-cols-11 gap-2 p-2 text-sm hover:bg-slate-50/50 border-t border-slate-100 ${isSelected ? 'bg-cyan-50 ring-1 ring-cyan-400' : ''}`}>
      <div className="flex items-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          disabled={!canSelect}
          className={`${canSelect ? 'border-cyan-500 data-[state=checked]:bg-cyan-500' : 'border-slate-300 opacity-50'}`}
        />
      </div>
      <div className="font-mono text-slate-600">
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
