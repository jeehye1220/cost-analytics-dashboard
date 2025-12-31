'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SimulatorState,
  SimulatorCategory,
  SimulatorTab,
  SIMULATOR_TABS,
  TARGET_MARKUP,
  CostRecord,
  GuidelineResult,
} from '@/lib/types';
import {
  calculateSimulatorState,
  createSimulatorCategoriesFromRecords,
  generateGuideline,
} from '@/lib/simulator';
import { loadCostData } from '@/lib/data';
import { SimulatorTable } from './SimulatorTable';
import { GuidelinePanel } from './GuidelinePanel';
import { ScenarioManager } from './ScenarioManager';

// 탭별 CSV 파일 매핑
const TAB_CSV_MAP: Record<SimulatorTab, string> = {
  S: '/data/MK_S.csv',
  F: '/data/MK_F.csv',
  ACC: '/data/MK_ACC.csv',
};

// 탭별 최신 시즌 매핑
const TAB_LATEST_SEASON: Record<SimulatorTab, string> = {
  S: '26S',
  F: '26F',
  ACC: '26S', // ACC는 26S 기준
};

// 탭별 다음 시즌 매핑
const TAB_NEXT_SEASON: Record<SimulatorTab, string> = {
  S: '27S',
  F: '27F',
  ACC: '27N',
};

export function Simulator() {
  const [currentTab, setCurrentTab] = useState<SimulatorTab>('S');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 시뮬레이터 상태
  const [exchangeRate, setExchangeRate] = useState(1400);
  const [categories, setCategories] = useState<SimulatorCategory[]>([]);
  const [simulatorState, setSimulatorState] = useState<SimulatorState | null>(null);
  const [guideline, setGuideline] = useState<GuidelineResult | null>(null);
  
  // 원본 데이터 (초기화용)
  const [originalRecords, setOriginalRecords] = useState<CostRecord[]>([]);

  // 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const csvPath = TAB_CSV_MAP[currentTab];
        const data = await loadCostData(csvPath);
        setOriginalRecords(data);
        
        // 최신 시즌 데이터로 시뮬레이터 초기화
        const latestSeason = TAB_LATEST_SEASON[currentTab];
        const nextSeason = TAB_NEXT_SEASON[currentTab];
        
        // 최신 시즌 데이터에서 평균 환율 추출
        const latestRecords = data.filter(r => r.시즌 === latestSeason);
        if (latestRecords.length > 0) {
          const avgExchangeRate = Math.round(
            latestRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) /
            latestRecords.reduce((sum, r) => sum + r.수량, 0)
          );
          setExchangeRate(avgExchangeRate);
        }
        
        // 카테고리 생성
        const initialCategories = createSimulatorCategoriesFromRecords(data, latestSeason);
        setCategories(initialCategories);
        
        // 상태 계산
        const state = calculateSimulatorState(initialCategories, exchangeRate, nextSeason);
        setSimulatorState(state);
        setGuideline(generateGuideline(state));
        
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [currentTab]);

  // 상태 재계산
  useEffect(() => {
    if (categories.length > 0) {
      const nextSeason = TAB_NEXT_SEASON[currentTab];
      const state = calculateSimulatorState(categories, exchangeRate, nextSeason);
      setSimulatorState(state);
      setGuideline(generateGuideline(state));
    }
  }, [categories, exchangeRate, currentTab]);

  // 카테고리 업데이트 핸들러
  const handleCategoryUpdate = useCallback((
    categoryId: string,
    field: keyof SimulatorCategory,
    value: number | boolean
  ) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== categoryId) return c;
      return { ...c, [field]: value };
    }));
  }, []);

  // 초기화 핸들러
  const handleReset = useCallback(() => {
    const latestSeason = TAB_LATEST_SEASON[currentTab];
    const initialCategories = createSimulatorCategoriesFromRecords(originalRecords, latestSeason);
    setCategories(initialCategories);
  }, [originalRecords, currentTab]);

  // 시나리오 로드 핸들러
  const handleLoadScenario = useCallback((state: SimulatorState) => {
    setCategories(state.categories);
    setExchangeRate(state.예상환율);
  }, []);

  // KPI 색상 결정
  const getMarkupColor = useCallback((markup: number) => {
    if (markup >= TARGET_MARKUP) return 'text-emerald-600';
    if (markup >= TARGET_MARKUP - 0.3) return 'text-amber-600';
    return 'text-rose-600';
  }, []);

  const getGapColor = useCallback((gap: number) => {
    if (gap >= 0) return 'text-emerald-600';
    if (gap >= -0.3) return 'text-amber-600';
    return 'text-rose-600';
  }, []);

  // 현재 시즌 라벨
  const currentSeasonLabel = useMemo(() => {
    const tab = SIMULATOR_TABS.find(t => t.value === currentTab);
    return tab ? `${tab.nextSeason} ${tab.label}` : '';
  }, [currentTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">데이터 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-rose-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더: 탭 + 환율 입력 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as SimulatorTab)}>
            <TabsList className="bg-slate-100 border border-slate-200">
              {SIMULATOR_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-white data-[state=active]:text-violet-600 text-slate-600"
                >
                  {tab.nextSeason} {tab.label.replace('의류', '').replace('(', '').replace(')', '')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">예상환율:</span>
            <Input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
              className="w-28 text-right font-medium"
            />
            <span className="text-sm text-slate-400">KRW/USD</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            초기화
          </Button>
          <ScenarioManager
            currentState={simulatorState}
            onLoadScenario={handleLoadScenario}
          />
        </div>
      </div>

      {/* 시즌 전체 KPI 카드 */}
      {simulatorState && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 현재 Markup */}
          <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-violet-600 font-medium">전체 Markup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getMarkupColor(simulatorState.전체Markup)}`}>
                {simulatorState.전체Markup.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                목표: {TARGET_MARKUP.toFixed(1)}
              </div>
            </CardContent>
          </Card>

          {/* Gap */}
          <Card className="bg-gradient-to-br from-slate-50 to-gray-50 border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600 font-medium">목표 대비 Gap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getGapColor(simulatorState.markupGap)}`}>
                {simulatorState.markupGap >= 0 ? '+' : ''}{simulatorState.markupGap.toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                원가율: {simulatorState.전체원가율.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          {/* 총 발주수량 */}
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-600 font-medium">총 발주수량</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-700">
                {simulatorState.전체발주수량.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500 mt-1">PCS</div>
            </CardContent>
          </Card>

          {/* 총 TAG금액 */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-emerald-600 font-medium">총 TAG금액</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-700">
                ₩{(simulatorState.전체TAG금액 / 100000000).toFixed(1)}억
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {simulatorState.전체TAG금액.toLocaleString()}원
              </div>
            </CardContent>
          </Card>

          {/* 총 원가금액 */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-600 font-medium">총 원가금액</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-700">
                ₩{(simulatorState.전체원가금액KRW / 100000000).toFixed(1)}억
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {simulatorState.전체원가금액KRW.toLocaleString()}원
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 중분류별 테이블 */}
      <SimulatorTable
        categories={categories}
        exchangeRate={exchangeRate}
        onCategoryUpdate={handleCategoryUpdate}
      />

      {/* 가이드라인 패널 */}
      {guideline && simulatorState && (
        <GuidelinePanel
          guideline={guideline}
          state={simulatorState}
        />
      )}
    </div>
  );
}

