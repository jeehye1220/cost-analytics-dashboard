'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SeasonTabs } from '@/components/SeasonTabs';
import { DomesticFilter } from '@/components/DomesticFilter';
import { CategoryCard } from '@/components/CategoryCard';
import { SeasonSummaryCards } from '@/components/SeasonSummaryCards';
import { SeasonDetailTable } from '@/components/SeasonDetailTable';
import { CompareSection } from '@/components/CompareSection';
import { TrendChart } from '@/components/TrendChart';
import { DetailChart } from '@/components/DetailChart';
import { Simulator } from '@/components/Simulator';
import { loadCostData } from '@/lib/data';
import { 
  calculateAllCategorySummaries, 
  calculateSeasonDetails,
  calculateRecentSeasonSummaries,
  calculateHierarchyData
} from '@/lib/calculations';
import { 
  CostRecord, 
  CategorySummary, 
  SeasonDetail, 
  DomesticType, 
  DOMESTIC_TYPES,
  SeasonSummary,
  SeasonHierarchy,
  CompareItem,
  CompareLevel,
  SeasonTab,
  SEASON_TABS
} from '@/lib/types';

// 메인 탭 타입
type MainTab = 'dashboard' | 'simulator';

export default function Dashboard() {
  // 메인 탭 상태
  const [mainTab, setMainTab] = useState<MainTab>('dashboard');

  // 데이터 상태
  const [costData, setCostData] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [currentSeasonTab, setCurrentSeasonTab] = useState<SeasonTab>('S');
  const [selectedDomesticTypes, setSelectedDomesticTypes] = useState<DomesticType[]>([...DOMESTIC_TYPES]);
  
  // 선택 상태
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [doubleClickedCategory, setDoubleClickedCategory] = useState<string | null>(null);
  const [showSeasonTrendCharts, setShowSeasonTrendCharts] = useState(false);

  // 비교 기능 상태
  const [compareItems, setCompareItems] = useState<CompareItem[]>([]);

  // 계산된 데이터
  const [seasonSummaries, setSeasonSummaries] = useState<SeasonSummary[]>([]); // 최신 4개 (카드용)
  const [allSeasonSummaries, setAllSeasonSummaries] = useState<SeasonSummary[]>([]); // 전체 시즌 (그래프용)
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [hierarchyData, setHierarchyData] = useState<SeasonHierarchy[]>([]);
  const [detailChartData, setDetailChartData] = useState<SeasonDetail[]>([]);

  // CSV 파일 경로 결정
  const getCsvPath = (tab: SeasonTab): string => {
    switch (tab) {
      case 'S': return '/data/MK_S.csv';
      case 'F': return '/data/MK_F.csv';
      case 'ACC': return '/data/MK_ACC.csv';
    }
  };

  // 탭 레이블 가져오기
  const currentTabLabel = SEASON_TABS.find(t => t.value === currentSeasonTab)?.label || '';

  // 최신 시즌 결정 (데이터 기반)
  const latestSeason = costData.length > 0 
    ? [...new Set(costData.map(r => r.시즌))].sort().reverse()[0] || '26S'
    : '26S';

  // 데이터 로드 (탭 변경 시마다)
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setSelectedCategory(null); // 탭 변경 시 선택 초기화
        setDoubleClickedCategory(null);
        setCompareItems([]);
        
        const csvPath = getCsvPath(currentSeasonTab);
        const data = await loadCostData(csvPath);
        setCostData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentSeasonTab]);

  // 시즌별 전체 요약 계산
  useEffect(() => {
    if (costData.length === 0) return;
    
    // 최신 4개 시즌 (카드용)
    const recentSummaries = calculateRecentSeasonSummaries(costData, selectedDomesticTypes, 4);
    setSeasonSummaries(recentSummaries);
    
    // 전체 시즌 (그래프용)
    const allSummaries = calculateRecentSeasonSummaries(costData, selectedDomesticTypes, 100);
    setAllSeasonSummaries(allSummaries);
  }, [costData, selectedDomesticTypes]);

  // 중분류별 요약 계산
  useEffect(() => {
    if (costData.length === 0) return;
    
    const summaries = calculateAllCategorySummaries(
      costData, 
      latestSeason, 
      selectedDomesticTypes
    );
    setCategorySummaries(summaries);
  }, [costData, selectedDomesticTypes]);

  // 선택된 중분류 계층 데이터 계산 (시즌 → 아이템 → 스타일)
  useEffect(() => {
    if (costData.length === 0 || !selectedCategory) {
      setHierarchyData([]);
      return;
    }
    
    const hierarchy = calculateHierarchyData(
      costData, 
      selectedCategory, 
      selectedDomesticTypes
    );
    setHierarchyData(hierarchy);
  }, [costData, selectedCategory, selectedDomesticTypes]);

  // 더블클릭 시 상세 차트 데이터 계산
  useEffect(() => {
    if (costData.length === 0 || !doubleClickedCategory) {
      setDetailChartData([]);
      return;
    }
    
    const details = calculateSeasonDetails(
      costData, 
      doubleClickedCategory, 
      selectedDomesticTypes
    );
    setDetailChartData(details);
  }, [costData, doubleClickedCategory, selectedDomesticTypes]);

  // 내수구분 토글
  const handleDomesticToggle = useCallback((type: DomesticType) => {
    setSelectedDomesticTypes((prev) => {
      if (prev.includes(type)) {
        // 최소 1개는 선택되어 있어야 함
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  }, []);

  // 내수구분 전체 선택
  const handleDomesticSelectAll = useCallback(() => {
    setSelectedDomesticTypes([...DOMESTIC_TYPES]);
  }, []);

  // 카드 클릭 핸들러
  const handleCardClick = useCallback((category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  }, []);

  // 카드 더블클릭 핸들러
  const handleCardDoubleClick = useCallback((category: string) => {
    setDoubleClickedCategory((prev) => (prev === category ? null : category));
  }, []);

  // 아이템명으로 전 시즌 아이템 찾기
  const findAllSeasonsForItem = useCallback((아이템명: string, category: string): CompareItem[] => {
    const items: CompareItem[] = [];
    hierarchyData.forEach((season) => {
      const item = season.items.find((i) => i.아이템명 === 아이템명);
      if (item) {
        items.push({
          id: `item-${category}-${season.시즌}-${item.아이템명}`,
          level: 'item',
          label: `${season.시즌} ${item.아이템명}`,
          시즌: season.시즌,
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
        });
      }
    });
    return items;
  }, [hierarchyData]);

  // 전체 시즌 찾기 (시즌 선택 시 전체 시즌 자동 선택)
  const findAllSeasons = useCallback((category: string): CompareItem[] => {
    const items: CompareItem[] = [];
    
    hierarchyData.forEach((season) => {
      // 모든 시즌 선택
      {
        // 시즌 레벨 평균 단가 계산
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

        items.push({
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
        });
      }
    });
    return items;
  }, [hierarchyData]);

  // 비교 항목 토글 (체크박스) - 자동 선택 기능 포함
  const handleToggleCompareItem = useCallback((item: CompareItem) => {
    setCompareItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      
      if (exists) {
        // 이미 선택된 항목이면 제거
        return prev.filter((i) => i.id !== item.id);
      }
      
      // 같은 레벨만 추가 가능
      if (prev.length > 0 && prev[0].level !== item.level) {
        return prev; // 다른 레벨이면 무시
      }

      // 첫 선택일 때 자동 선택 로직 적용
      if (prev.length === 0) {
        if (item.level === 'item' && item.아이템명 && selectedCategory) {
          // 아이템 선택 시: 전 시즌 같은 아이템 자동 선택
          const allSeasonItems = findAllSeasonsForItem(item.아이템명, selectedCategory);
          return allSeasonItems;
        } else if (item.level === 'season' && selectedCategory) {
          // 시즌 선택 시: 전체 시즌 자동 선택
          const allSeasons = findAllSeasons(selectedCategory);
          return allSeasons;
        }
      }
      
      return [...prev, item];
    });
  }, [selectedCategory, findAllSeasonsForItem, findAllSeasons]);

  // 비교 항목 제거
  const handleRemoveCompareItem = useCallback((id: string) => {
    setCompareItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 비교 항목 전체 삭제
  const handleClearCompareItems = useCallback(() => {
    setCompareItems([]);
  }, []);

  // 현재 비교 레벨
  const currentCompareLevel: CompareLevel | null = compareItems.length > 0 ? compareItems[0].level : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center text-rose-600">
          <p className="text-xl mb-2">⚠️ 오류 발생</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                🏭 원가분석 대시보드
              </h1>
              <p className="text-slate-500">
                브랜드 I · {mainTab === 'dashboard' ? currentTabLabel : '코스트 시뮬레이터'}
              </p>
            </div>
            
            {/* 메인 탭 (대시보드 / 시뮬레이터) */}
            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
              <TabsList className="bg-slate-100 border border-slate-200 p-1">
                <TabsTrigger 
                  value="dashboard"
                  className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm px-6"
                >
                  📊 대시보드
                </TabsTrigger>
                <TabsTrigger 
                  value="simulator"
                  className="text-slate-500 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm px-6"
                >
                  🎯 시뮬레이터
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        {/* 시뮬레이터 탭 */}
        {mainTab === 'simulator' && (
          <Simulator />
        )}

        {/* 대시보드 탭 */}
        {mainTab === 'dashboard' && (
          <>
        {/* 시즌 탭 + 필터 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <SeasonTabs 
            currentTab={currentSeasonTab} 
            onTabChange={setCurrentSeasonTab} 
          />
          <DomesticFilter 
            selectedTypes={selectedDomesticTypes} 
            onToggle={handleDomesticToggle}
            onSelectAll={handleDomesticSelectAll}
          />
        </div>

        {/* 시즌별 전체 원가율 카드 */}
        <section className="mb-8">
          <h2 
            onClick={() => setShowSeasonTrendCharts(prev => !prev)}
            className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2 cursor-pointer hover:text-emerald-600 transition-colors select-none"
          >
            <span className="text-emerald-600">📅</span>
            시즌별 전체 원가 현황
            <span className={`text-sm text-slate-400 transition-transform ${showSeasonTrendCharts ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </h2>
          <SeasonSummaryCards summaries={seasonSummaries} />
          
          {/* 토글로 표시되는 시즌별 추이 그래프 */}
          {showSeasonTrendCharts && allSeasonSummaries.length > 0 && (
            <TrendChart data={allSeasonSummaries} />
          )}
        </section>

        {/* 중분류별 카드 그리드 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="text-emerald-600">📦</span>
            중분류별 원가 현황 ({latestSeason})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categorySummaries.map((summary) => (
              <CategoryCard
                key={summary.중분류}
                summary={summary}
                isSelected={selectedCategory === summary.중분류}
                onClick={() => handleCardClick(summary.중분류)}
                onDoubleClick={() => handleCardDoubleClick(summary.중분류)}
              />
            ))}
          </div>
          {categorySummaries.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              선택된 조건에 해당하는 데이터가 없습니다.
            </div>
          )}
        </section>

        {/* 비교 영역 (상세 테이블 위에 고정) */}
        {selectedCategory && hierarchyData.length > 0 && (
          <section className="mb-4">
            <CompareSection
              items={compareItems}
              onRemoveItem={handleRemoveCompareItem}
              onClear={handleClearCompareItems}
            />
          </section>
        )}

        {/* 선택된 카테고리 상세 테이블 (계층 구조) */}
        {selectedCategory && hierarchyData.length > 0 && (
          <section className="mb-8">
            <SeasonDetailTable 
              category={selectedCategory} 
              hierarchyData={hierarchyData}
              selectedItems={compareItems}
              onToggleItem={handleToggleCompareItem}
              currentLevel={currentCompareLevel}
            />
          </section>
        )}

        {/* 더블클릭 시 상세 차트 */}
        {doubleClickedCategory && detailChartData.length > 0 && (
          <section className="mb-8">
            <DetailChart
              category={doubleClickedCategory}
              details={detailChartData}
              onClose={() => setDoubleClickedCategory(null)}
            />
          </section>
        )}

        {/* 푸터 */}
        <footer className="text-center text-slate-400 text-sm pt-8 border-t border-slate-200">
          <p>💡 카드 클릭: 상세 테이블 (시즌 → 아이템 → 스타일 토글) · 카드 더블클릭: 상세 단가 그래프</p>
        </footer>
          </>
        )}
      </div>
    </main>
  );
}
