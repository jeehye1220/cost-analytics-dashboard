/**
 * 시뮬레이터 계산 로직 및 가이드라인 알고리즘
 */

import {
  SimulatorCategory,
  SimulatorState,
  CategoryConstraints,
  AdjustmentSuggestion,
  GuidelineResult,
  Scenario,
  CostRecord,
  TARGET_MARKUP,
} from './types';

// ============================================
// 기본 계산 함수
// ============================================

/**
 * 총 원가 USD 계산
 */
export function calculateTotalCostUSD(category: SimulatorCategory): number {
  return category.원부자재 + category.공임 + category.아트웍 + category.기타;
}

/**
 * 총 원가 KRW 계산
 */
export function calculateTotalCostKRW(category: SimulatorCategory, exchangeRate: number): number {
  return calculateTotalCostUSD(category) * exchangeRate;
}

/**
 * 원가율 계산 (%)
 */
export function calculateCostRate(category: SimulatorCategory, exchangeRate: number): number {
  const costKRW = calculateTotalCostKRW(category, exchangeRate);
  if (category.목표TAG === 0) return 0;
  return (costKRW / category.목표TAG) * 100;
}

/**
 * Markup 계산
 */
export function calculateMarkup(category: SimulatorCategory, exchangeRate: number): number {
  const costKRW = calculateTotalCostKRW(category, exchangeRate);
  if (costKRW === 0) return 0;
  return category.목표TAG / costKRW;
}

/**
 * 카테고리 계산 필드 업데이트
 */
export function updateCategoryCalculations(
  category: SimulatorCategory,
  exchangeRate: number
): SimulatorCategory {
  const 총원가USD = calculateTotalCostUSD(category);
  const 총원가KRW = 총원가USD * exchangeRate;
  const 원가율 = category.목표TAG > 0 ? (총원가KRW / category.목표TAG) * 100 : 0;
  const markup = 총원가KRW > 0 ? category.목표TAG / 총원가KRW : 0;

  return {
    ...category,
    총원가USD: Math.round(총원가USD * 100) / 100,
    총원가KRW: Math.round(총원가KRW),
    원가율: Math.round(원가율 * 10) / 10,
    markup: Math.round(markup * 100) / 100,
  };
}

// ============================================
// 시즌 전체 KPI 계산
// ============================================

/**
 * 시즌 전체 가중평균 Markup 계산 (TAG금액 가중)
 */
export function calculateWeightedMarkup(categories: SimulatorCategory[]): number {
  const totalTagAmount = categories.reduce((sum, c) => sum + c.목표TAG * c.발주수량, 0);
  const totalCostAmount = categories.reduce((sum, c) => sum + c.총원가KRW * c.발주수량, 0);
  
  if (totalCostAmount === 0) return 0;
  return totalTagAmount / totalCostAmount;
}

/**
 * 시뮬레이터 전체 상태 계산
 */
export function calculateSimulatorState(
  categories: SimulatorCategory[],
  exchangeRate: number,
  season: string,
  targetMarkup: number = TARGET_MARKUP
): SimulatorState {
  // 각 카테고리 계산 필드 업데이트
  const updatedCategories = categories.map(c => updateCategoryCalculations(c, exchangeRate));
  
  // 전체 KPI 계산
  const 전체발주수량 = updatedCategories.reduce((sum, c) => sum + c.발주수량, 0);
  const 전체TAG금액 = updatedCategories.reduce((sum, c) => sum + c.목표TAG * c.발주수량, 0);
  const 전체원가금액KRW = updatedCategories.reduce((sum, c) => sum + c.총원가KRW * c.발주수량, 0);
  const 전체Markup = 전체원가금액KRW > 0 ? 전체TAG금액 / 전체원가금액KRW : 0;
  const 전체원가율 = 전체TAG금액 > 0 ? (전체원가금액KRW / 전체TAG금액) * 100 : 0;
  const markupGap = 전체Markup - targetMarkup;

  return {
    시즌: season,
    예상환율: exchangeRate,
    categories: updatedCategories,
    전체발주수량,
    전체TAG금액: Math.round(전체TAG금액),
    전체원가금액KRW: Math.round(전체원가금액KRW),
    전체Markup: Math.round(전체Markup * 100) / 100,
    전체원가율: Math.round(전체원가율 * 10) / 10,
    목표Markup: targetMarkup,
    markupGap: Math.round(markupGap * 100) / 100,
  };
}

// ============================================
// 가이드라인 알고리즘
// ============================================

/**
 * 조정 추천 생성
 */
export function generateAdjustmentSuggestions(
  state: SimulatorState
): AdjustmentSuggestion[] {
  const suggestions: AdjustmentSuggestion[] = [];
  const gap = state.markupGap;
  
  if (Math.abs(gap) < 0.05) {
    // 목표 달성 상태
    return suggestions;
  }

  // 조정 가능한 카테고리만 필터링 (잠금 해제된 것)
  const adjustableCategories = state.categories
    .filter(c => !c.locked)
    .sort((a, b) => a.constraints.priority - b.constraints.priority);

  if (gap < 0) {
    // Markup이 목표보다 낮음 → 원가 낮추거나 TAG 올려야 함
    for (const category of adjustableCategories) {
      const weight = (category.목표TAG * category.발주수량) / state.전체TAG금액;
      
      // 1. 원부자재 감소 제안
      if (category.원부자재 > category.constraints.원부자재_min) {
        const maxReduction = category.원부자재 - category.constraints.원부자재_min;
        const suggestedReduction = Math.min(maxReduction, category.원부자재 * 0.1);
        if (suggestedReduction > 0.01) {
          suggestions.push({
            중분류: category.중분류,
            조정항목: '원부자재',
            현재값: category.원부자재,
            제안값: Math.round((category.원부자재 - suggestedReduction) * 100) / 100,
            조정량: -Math.round(suggestedReduction * 100) / 100,
            조정률: Math.round((-suggestedReduction / category.원부자재) * 100 * 10) / 10,
            영향도: Math.round(weight * suggestedReduction * state.예상환율 / state.전체원가금액KRW * 10000) / 100,
            설명: `원부자재 단가 $${suggestedReduction.toFixed(2)} 절감`,
          });
        }
      }

      // 2. 공임 감소 제안
      if (category.공임 > category.constraints.공임_min) {
        const maxReduction = category.공임 - category.constraints.공임_min;
        const suggestedReduction = Math.min(maxReduction, category.공임 * 0.1);
        if (suggestedReduction > 0.01) {
          suggestions.push({
            중분류: category.중분류,
            조정항목: '공임',
            현재값: category.공임,
            제안값: Math.round((category.공임 - suggestedReduction) * 100) / 100,
            조정량: -Math.round(suggestedReduction * 100) / 100,
            조정률: Math.round((-suggestedReduction / category.공임) * 100 * 10) / 10,
            영향도: Math.round(weight * suggestedReduction * state.예상환율 / state.전체원가금액KRW * 10000) / 100,
            설명: `공임 단가 $${suggestedReduction.toFixed(2)} 절감`,
          });
        }
      }

      // 3. TAG 인상 제안
      if (category.목표TAG < category.constraints.목표TAG_max) {
        const maxIncrease = category.constraints.목표TAG_max - category.목표TAG;
        const suggestedIncrease = Math.min(maxIncrease, category.목표TAG * 0.05);
        if (suggestedIncrease > 100) {
          suggestions.push({
            중분류: category.중분류,
            조정항목: '목표TAG',
            현재값: category.목표TAG,
            제안값: Math.round(category.목표TAG + suggestedIncrease),
            조정량: Math.round(suggestedIncrease),
            조정률: Math.round((suggestedIncrease / category.목표TAG) * 100 * 10) / 10,
            영향도: Math.round(weight * suggestedIncrease / state.전체TAG금액 * 10000) / 100,
            설명: `목표 TAG ₩${suggestedIncrease.toLocaleString()} 인상`,
          });
        }
      }
    }
  } else {
    // Markup이 목표보다 높음 → 여유 있음
    for (const category of adjustableCategories) {
      const availableMargin = category.markup - TARGET_MARKUP;
      if (availableMargin > 0.1) {
        suggestions.push({
          중분류: category.중분류,
          조정항목: '원부자재',
          현재값: category.원부자재,
          제안값: category.원부자재,
          조정량: 0,
          조정률: 0,
          영향도: 0,
          설명: `여유 마진 ${(availableMargin * 100 / TARGET_MARKUP).toFixed(1)}% - 품질 개선 가능`,
        });
      }
    }
  }

  // 영향도 순으로 정렬
  return suggestions.sort((a, b) => Math.abs(b.영향도) - Math.abs(a.영향도)).slice(0, 10);
}

/**
 * 환율 민감도 분석
 */
export function analyzeExchangeRateSensitivity(
  state: SimulatorState,
  variations: number[] = [-100, -50, 50, 100]
): { 환율변화: number; 환율: number; markup: number; 원가율: number }[] {
  return variations.map(variation => {
    const newRate = state.예상환율 + variation;
    const newState = calculateSimulatorState(
      state.categories,
      newRate,
      state.시즌,
      state.목표Markup
    );
    return {
      환율변화: variation,
      환율: newRate,
      markup: newState.전체Markup,
      원가율: newState.전체원가율,
    };
  });
}

/**
 * 가이드라인 결과 생성
 */
export function generateGuideline(state: SimulatorState): GuidelineResult {
  const gap = state.markupGap;
  let 현재상태: 'surplus' | 'deficit' | 'optimal';
  
  if (gap > 0.05) {
    현재상태 = 'surplus';
  } else if (gap < -0.05) {
    현재상태 = 'deficit';
  } else {
    현재상태 = 'optimal';
  }

  const suggestions = generateAdjustmentSuggestions(state);
  const 환율민감도 = analyzeExchangeRateSensitivity(state).map(s => ({
    환율변화: s.환율변화,
    markup영향: Math.round((s.markup - state.전체Markup) * 100) / 100,
  }));

  return {
    현재상태,
    gap,
    suggestions,
    환율민감도,
  };
}

// ============================================
// 초기화 함수
// ============================================

/**
 * 기본 제약조건 생성
 */
export function createDefaultConstraints(category: Partial<SimulatorCategory>): CategoryConstraints {
  return {
    목표TAG_min: Math.round((category.목표TAG || 0) * 0.9),
    목표TAG_max: Math.round((category.목표TAG || 0) * 1.2),
    원부자재_min: Math.round((category.원부자재 || 0) * 0.7 * 100) / 100,
    원부자재_max: Math.round((category.원부자재 || 0) * 1.3 * 100) / 100,
    공임_min: Math.round((category.공임 || 0) * 0.8 * 100) / 100,
    공임_max: Math.round((category.공임 || 0) * 1.2 * 100) / 100,
    아트웍_min: Math.round((category.아트웍 || 0) * 0.5 * 100) / 100,
    아트웍_max: Math.round((category.아트웍 || 0) * 1.5 * 100) / 100,
    기타_min: Math.round((category.기타 || 0) * 0.8 * 100) / 100,
    기타_max: Math.round((category.기타 || 0) * 1.2 * 100) / 100,
    priority: 5, // 기본 우선순위
  };
}

/**
 * CostRecord 배열에서 시뮬레이터 카테고리 생성
 */
export function createSimulatorCategoriesFromRecords(
  records: CostRecord[],
  latestSeason: string
): SimulatorCategory[] {
  // 최신 시즌 데이터만 필터링
  const latestRecords = records.filter(r => r.시즌 === latestSeason);
  
  // 중분류별 그룹화
  const categoryMap = new Map<string, CostRecord[]>();
  latestRecords.forEach(record => {
    const existing = categoryMap.get(record.중분류) || [];
    existing.push(record);
    categoryMap.set(record.중분류, existing);
  });

  // 중분류별 집계
  const categories: SimulatorCategory[] = [];
  categoryMap.forEach((recs, 중분류) => {
    const totalQty = recs.reduce((sum, r) => sum + r.수량, 0);
    if (totalQty === 0) return;

    const 목표TAG = Math.round(recs.reduce((sum, r) => sum + r.TAG * r.수량, 0) / totalQty);
    const 원부자재 = Math.round(recs.reduce((sum, r) => 
      sum + (r.USD_원자재 + r.USD_부자재 + r.USD_택라벨 + r.USD_본사공급자재) * r.수량, 0) / totalQty * 100) / 100;
    const 공임 = Math.round(recs.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / totalQty * 100) / 100;
    const 아트웍 = Math.round(recs.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / totalQty * 100) / 100;
    const 기타 = Math.round(recs.reduce((sum, r) => 
      sum + (r.USD_정상마진 + r.USD_기타마진경비) * r.수량, 0) / totalQty * 100) / 100;

    const category: SimulatorCategory = {
      id: `${중분류}-${Date.now()}`,
      중분류,
      목표TAG,
      원부자재,
      공임,
      아트웍,
      기타,
      발주수량: totalQty,
      총원가USD: 0,
      총원가KRW: 0,
      원가율: 0,
      markup: 0,
      constraints: createDefaultConstraints({ 목표TAG, 원부자재, 공임, 아트웍, 기타 }),
      locked: false,
    };

    categories.push(category);
  });

  return categories;
}

// ============================================
// 시나리오 관리
// ============================================

const STORAGE_KEY = 'cost-simulator-scenarios';

/**
 * 시나리오 저장 (로컬스토리지)
 */
export function saveScenario(scenario: Scenario): void {
  const scenarios = loadAllScenarios();
  const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
  
  if (existingIndex >= 0) {
    scenarios[existingIndex] = { ...scenario, updatedAt: new Date().toISOString() };
  } else {
    scenarios.push(scenario);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

/**
 * 모든 시나리오 불러오기
 */
export function loadAllScenarios(): Scenario[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * 시나리오 삭제
 */
export function deleteScenario(id: string): void {
  const scenarios = loadAllScenarios().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

/**
 * 시나리오 JSON 내보내기
 */
export function exportScenarioToJSON(scenario: Scenario): string {
  return JSON.stringify(scenario, null, 2);
}

/**
 * 시나리오 CSV 내보내기
 */
export function exportScenarioToCSV(scenario: Scenario): string {
  const headers = ['중분류', '목표TAG', '원부자재', '공임', '아트웍', '기타', '발주수량', '총원가USD', '총원가KRW', '원가율', 'Markup'];
  const rows = scenario.state.categories.map(c => [
    c.중분류,
    c.목표TAG,
    c.원부자재,
    c.공임,
    c.아트웍,
    c.기타,
    c.발주수량,
    c.총원가USD,
    c.총원가KRW,
    c.원가율,
    c.markup,
  ].join(','));
  
  return [
    `# 시나리오: ${scenario.name}`,
    `# 시즌: ${scenario.state.시즌}`,
    `# 예상환율: ${scenario.state.예상환율}`,
    `# 전체Markup: ${scenario.state.전체Markup}`,
    '',
    headers.join(','),
    ...rows,
  ].join('\n');
}

/**
 * JSON에서 시나리오 가져오기
 */
export function importScenarioFromJSON(jsonString: string): Scenario | null {
  try {
    const scenario = JSON.parse(jsonString) as Scenario;
    // 유효성 검사
    if (!scenario.id || !scenario.name || !scenario.state) {
      return null;
    }
    return scenario;
  } catch {
    return null;
  }
}

/**
 * 새 시나리오 생성
 */
export function createNewScenario(
  name: string,
  state: SimulatorState,
  description?: string
): Scenario {
  return {
    id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    state,
  };
}

/**
 * 시나리오 복제
 */
export function duplicateScenario(scenario: Scenario, newName: string): Scenario {
  return createNewScenario(
    newName,
    JSON.parse(JSON.stringify(scenario.state)),
    `${scenario.name}에서 복제됨`
  );
}

