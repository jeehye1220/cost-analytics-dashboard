// 원가 데이터 타입 정의

export interface CostRecord {
  브랜드: string;
  시즌: string;
  스타일: string;
  중분류: string;
  아이템명: string;
  PO: string;
  TAG: number;
  수량: number;
  원가견적번호: string;
  발주통화: string;
  제조업체: string;
  견적서제출일자: string;
  PO_CLS: string;
  마감형태: string;
  내수구분: '내수' | '직송' | '중국생산' | string;
  적용환율: number;
  // USD 단가
  USD_원자재: number;
  USD_아트웍: number;
  USD_부자재: number;
  USD_택라벨: number;
  USD_공임: number;
  USD_본사공급자재: number;
  USD_정상마진: number;
  USD_기타마진경비: number;
  // KRW 단가
  KRW_원자재: number;
  KRW_아트웍: number;
  KRW_부자재: number;
  KRW_택라벨: number;
  KRW_공임: number;
  KRW_본사공급자재: number;
  KRW_정상마진: number;
  KRW_기타마진경비: number;
}

export interface CategorySummary {
  중분류: string;
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  원가율: number;
  적용환율: number;
}

export interface SeasonDetail {
  시즌: string;
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  적용환율: number;
  원부자재단가: number;
  아트웍단가: number;
  공임단가: number;
  기타경비단가: number;
}

export interface TrendData {
  시즌: string;
  중분류: string;
  적용환율: number;
  평균TAG: number;
  평균원가USD: number;
  원가율: number;
  원부자재단가: number;
  아트웍단가: number;
  공임단가: number;
  기타경비단가: number;
}

// 시즌별 전체 요약 (모든 중분류 합산)
export interface SeasonSummary {
  시즌: string;
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  원가율: number;
  적용환율: number;
  // 단가 구성 항목 (USD)
  원부자재단가: number;
  아트웍단가: number;
  공임단가: number;
  기타경비단가: number;
}

// 아이템별/스타일별 상세
export interface ItemDetail {
  키: string; // 아이템명 또는 스타일코드
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  적용환율: number;
  원부자재단가: number;
  아트웍단가: number;
  공임단가: number;
  기타경비단가: number;
}

export type DetailViewType = '시즌별' | '아이템별' | '스타일별';

// 계층 구조 데이터 타입 (시즌 → 아이템 → 스타일)
export interface StyleData {
  스타일: string;
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  적용환율: number;
  원부자재단가: number;
  아트웍단가: number;
  공임단가: number;
  기타경비단가: number;
}

export interface ItemData {
  아이템명: string;
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  적용환율: number;
  원부자재단가: number;
  아트웍단가: number;
  공임단가: number;
  기타경비단가: number;
  styles: StyleData[];
}

// 비교 기능용 타입
export type CompareLevel = 'season' | 'item' | 'style';

export interface CompareItem {
  id: string;
  level: CompareLevel;
  label: string;
  시즌?: string;
  아이템명?: string;
  스타일?: string;
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  적용환율: number;
  원부자재단가: number;
  아트웍단가: number;
  공임단가: number;
  기타경비단가: number;
}

export interface SeasonHierarchy {
  시즌: string;
  발주수량: number;
  평균TAG: number;
  평균원가USD: number;
  평균원가KRW: number;
  적용환율: number;
  items: ItemData[];
}

export type DomesticType = '내수' | '직송' | '중국생산';

// 탭 구분 (의류 S시즌 / 의류 F시즌 / ACC)
export type SeasonTab = 'S' | 'F' | 'ACC';

export const SEASON_TABS: { value: SeasonTab; label: string }[] = [
  { value: 'S', label: '의류(S시즌)' },
  { value: 'F', label: '의류(F시즌)' },
  { value: 'ACC', label: 'ACC' },
];

export const CATEGORIES = [
  'Headwear',
  'Bag',
  'Outer',
  'Bottom',
  'Acc_etc',
  'Inner',
  'Shoes',
  'Wear_etc',
] as const;

export const SEASONS = ['23S', '24S', '25S', '26S'] as const;

export const DOMESTIC_TYPES: DomesticType[] = ['내수', '직송', '중국생산'];

// ============================================
// 시뮬레이터 관련 타입
// ============================================

// 시뮬레이터 중분류 데이터 (편집 가능)
export interface SimulatorCategory {
  id: string;
  중분류: string;
  목표TAG: number;         // 편집 가능
  원부자재: number;        // 편집 가능 (USD)
  공임: number;            // 편집 가능 (USD)
  아트웍: number;          // 편집 가능 (USD)
  기타: number;            // 편집 가능 (USD)
  발주수량: number;        // 편집 가능
  // 계산 필드
  총원가USD: number;
  총원가KRW: number;
  원가율: number;
  markup: number;
  // 조정 가능 범위 설정
  constraints: CategoryConstraints;
  // 잠금 상태 (조정 제외)
  locked: boolean;
}

// 중분류별 조정 가능 범위
export interface CategoryConstraints {
  목표TAG_min: number;
  목표TAG_max: number;
  원부자재_min: number;
  원부자재_max: number;
  공임_min: number;
  공임_max: number;
  아트웍_min: number;
  아트웍_max: number;
  기타_min: number;
  기타_max: number;
  priority: number; // 조정 우선순위 (낮을수록 먼저 조정)
}

// 시뮬레이터 전체 상태
export interface SimulatorState {
  시즌: string;              // 27S, 27F, 27N 등
  예상환율: number;          // 사용자 입력
  categories: SimulatorCategory[];
  // 시즌 전체 KPI (계산)
  전체발주수량: number;
  전체TAG금액: number;
  전체원가금액KRW: number;
  전체Markup: number;
  전체원가율: number;
  목표Markup: number;        // 기본값 4.5
  markupGap: number;         // 목표 대비 Gap
}

// 조정 추천 항목
export interface AdjustmentSuggestion {
  중분류: string;
  조정항목: '목표TAG' | '원부자재' | '공임' | '아트웍' | '기타';
  현재값: number;
  제안값: number;
  조정량: number;
  조정률: number;           // %
  영향도: number;           // 전체 Markup에 미치는 영향
  설명: string;
}

// 가이드라인 결과
export interface GuidelineResult {
  현재상태: 'surplus' | 'deficit' | 'optimal';  // 여유/부족/적정
  gap: number;
  suggestions: AdjustmentSuggestion[];
  환율민감도: {
    환율변화: number;        // ±원
    markup영향: number;      // 변화량
  }[];
}

// 시나리오
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  state: SimulatorState;
}

// 시뮬레이터 탭 타입
export type SimulatorTab = 'S' | 'F' | 'ACC';

export const SIMULATOR_TABS: { value: SimulatorTab; label: string; nextSeason: string }[] = [
  { value: 'S', label: '의류(S시즌)', nextSeason: '27S' },
  { value: 'F', label: '의류(F시즌)', nextSeason: '27F' },
  { value: 'ACC', label: 'ACC', nextSeason: '27N' },
];

// 목표 Markup 상수
export const TARGET_MARKUP = 4.5;
export const TARGET_COST_RATE = 22.2; // 100 / 4.5 ≈ 22.2%
