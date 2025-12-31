import { CostRecord, CategorySummary, SeasonDetail, TrendData, DomesticType, SeasonSummary, ItemDetail, SeasonHierarchy, ItemData, StyleData } from './types';
import { filterByDomestic, filterByCategory, filterBySeason } from './data';

// 총 원가 계산 (USD)
export function calculateTotalCostUSD(record: CostRecord): number {
  return (
    record.USD_원자재 +
    record.USD_아트웍 +
    record.USD_부자재 +
    record.USD_택라벨 +
    record.USD_공임 +
    record.USD_본사공급자재 +
    record.USD_정상마진 +
    record.USD_기타마진경비
  );
}

// 총 원가 계산 (KRW)
export function calculateTotalCostKRW(record: CostRecord): number {
  return (
    record.KRW_원자재 +
    record.KRW_아트웍 +
    record.KRW_부자재 +
    record.KRW_택라벨 +
    record.KRW_공임 +
    record.KRW_본사공급자재 +
    record.KRW_정상마진 +
    record.KRW_기타마진경비
  );
}

// 원부자재단가 계산 (원자재 + 부자재 + 택/라벨 + 본사공급자재)
export function calculateMaterialCostUSD(record: CostRecord): number {
  return (
    record.USD_원자재 +
    record.USD_부자재 +
    record.USD_택라벨 +
    record.USD_본사공급자재
  );
}

// 기타경비단가 계산 (정상마진 + 기타마진/경비)
export function calculateOtherCostUSD(record: CostRecord): number {
  return record.USD_정상마진 + record.USD_기타마진경비;
}

// 중분류별 요약 계산 (특정 시즌)
export function calculateCategorySummary(
  records: CostRecord[],
  category: string,
  season: string,
  domesticTypes: DomesticType[]
): CategorySummary | null {
  let filtered = filterByDomestic(records, domesticTypes);
  filtered = filterByCategory(filtered, category);
  filtered = filterBySeason(filtered, season);

  if (filtered.length === 0) {
    return null;
  }

  const totalQty = filtered.reduce((sum, r) => sum + r.수량, 0);
  
  if (totalQty === 0) {
    return null;
  }

  // 가중평균 계산
  const weightedTAG = filtered.reduce((sum, r) => sum + r.TAG * r.수량, 0) / totalQty;
  const weightedCostUSD = filtered.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / totalQty;
  const weightedCostKRW = filtered.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / totalQty;
  const weightedExchangeRate = filtered.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / totalQty;

  return {
    중분류: category,
    발주수량: totalQty,
    평균TAG: Math.round(weightedTAG),
    평균원가USD: Math.round(weightedCostUSD * 100) / 100,
    평균원가KRW: Math.round(weightedCostKRW),
    원가율: Math.round((weightedCostKRW / weightedTAG) * 100 * 10) / 10,
    적용환율: Math.round(weightedExchangeRate * 100) / 100,
  };
}

// 특정 중분류의 시즌별 상세 데이터 계산
export function calculateSeasonDetails(
  records: CostRecord[],
  category: string,
  domesticTypes: DomesticType[]
): SeasonDetail[] {
  let filtered = filterByDomestic(records, domesticTypes);
  filtered = filterByCategory(filtered, category);

  // 시즌별 그룹화 (최근순 정렬)
  const seasons = [...new Set(filtered.map((r) => r.시즌))].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    return numB - numA; // 내림차순 (최근순)
  });

  return seasons.map((season) => {
    const seasonRecords = filtered.filter((r) => r.시즌 === season);
    const totalQty = seasonRecords.reduce((sum, r) => sum + r.수량, 0);

    if (totalQty === 0) {
      return {
        시즌: season,
        발주수량: 0,
        평균TAG: 0,
        평균원가USD: 0,
        평균원가KRW: 0,
        적용환율: 0,
        원부자재단가: 0,
        아트웍단가: 0,
        공임단가: 0,
        기타경비단가: 0,
      };
    }

    const weightedTAG = seasonRecords.reduce((sum, r) => sum + r.TAG * r.수량, 0) / totalQty;
    const weightedCostUSD = seasonRecords.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / totalQty;
    const weightedCostKRW = seasonRecords.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / totalQty;
    const weightedExchangeRate = seasonRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / totalQty;
    const weightedMaterialCost = seasonRecords.reduce((sum, r) => sum + calculateMaterialCostUSD(r) * r.수량, 0) / totalQty;
    const weightedArtworkCost = seasonRecords.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / totalQty;
    const weightedLaborCost = seasonRecords.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / totalQty;
    const weightedOtherCost = seasonRecords.reduce((sum, r) => sum + calculateOtherCostUSD(r) * r.수량, 0) / totalQty;

    return {
      시즌: season,
      발주수량: totalQty,
      평균TAG: Math.round(weightedTAG),
      평균원가USD: Math.round(weightedCostUSD * 100) / 100,
      평균원가KRW: Math.round(weightedCostKRW),
      적용환율: Math.round(weightedExchangeRate * 100) / 100,
      원부자재단가: Math.round(weightedMaterialCost * 100) / 100,
      아트웍단가: Math.round(weightedArtworkCost * 100) / 100,
      공임단가: Math.round(weightedLaborCost * 100) / 100,
      기타경비단가: Math.round(weightedOtherCost * 100) / 100,
    };
  });
}

// 추이 그래프용 데이터 계산
export function calculateTrendData(
  records: CostRecord[],
  categories: string[],
  domesticTypes: DomesticType[]
): TrendData[] {
  const result: TrendData[] = [];
  const filtered = filterByDomestic(records, domesticTypes);

  for (const category of categories) {
    const categoryRecords = filterByCategory(filtered, category);
    const seasons = [...new Set(categoryRecords.map((r) => r.시즌))].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numA - numB;
    });

    for (const season of seasons) {
      const seasonRecords = categoryRecords.filter((r) => r.시즌 === season);
      const totalQty = seasonRecords.reduce((sum, r) => sum + r.수량, 0);

      if (totalQty === 0) continue;

      const weightedTAG = seasonRecords.reduce((sum, r) => sum + r.TAG * r.수량, 0) / totalQty;
      const weightedCostUSD = seasonRecords.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / totalQty;
      const weightedCostKRW = seasonRecords.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / totalQty;
      const weightedExchangeRate = seasonRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / totalQty;
      const weightedMaterialCost = seasonRecords.reduce((sum, r) => sum + calculateMaterialCostUSD(r) * r.수량, 0) / totalQty;
      const weightedArtworkCost = seasonRecords.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / totalQty;
      const weightedLaborCost = seasonRecords.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / totalQty;
      const weightedOtherCost = seasonRecords.reduce((sum, r) => sum + calculateOtherCostUSD(r) * r.수량, 0) / totalQty;

      result.push({
        시즌: season,
        중분류: category,
        적용환율: Math.round(weightedExchangeRate * 100) / 100,
        평균TAG: Math.round(weightedTAG),
        평균원가USD: Math.round(weightedCostUSD * 100) / 100,
        원가율: Math.round((weightedCostKRW / weightedTAG) * 100 * 10) / 10,
        원부자재단가: Math.round(weightedMaterialCost * 100) / 100,
        아트웍단가: Math.round(weightedArtworkCost * 100) / 100,
        공임단가: Math.round(weightedLaborCost * 100) / 100,
        기타경비단가: Math.round(weightedOtherCost * 100) / 100,
      });
    }
  }

  return result;
}

// 모든 중분류 요약 계산
export function calculateAllCategorySummaries(
  records: CostRecord[],
  season: string,
  domesticTypes: DomesticType[]
): CategorySummary[] {
  const categories = [...new Set(records.map((r) => r.중분류))].filter(Boolean);
  
  return categories
    .map((category) => calculateCategorySummary(records, category, season, domesticTypes))
    .filter((summary): summary is CategorySummary => summary !== null);
}

// 시즌별 전체 요약 계산 (모든 중분류 합산)
export function calculateSeasonSummary(
  records: CostRecord[],
  season: string,
  domesticTypes: DomesticType[]
): SeasonSummary | null {
  let filtered = filterByDomestic(records, domesticTypes);
  filtered = filterBySeason(filtered, season);

  if (filtered.length === 0) {
    return null;
  }

  const totalQty = filtered.reduce((sum, r) => sum + r.수량, 0);
  
  if (totalQty === 0) {
    return null;
  }

  const weightedTAG = filtered.reduce((sum, r) => sum + r.TAG * r.수량, 0) / totalQty;
  const weightedCostUSD = filtered.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / totalQty;
  const weightedCostKRW = filtered.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / totalQty;
  const weightedExchangeRate = filtered.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / totalQty;
  
  // 단가 구성 항목 계산
  const weightedMaterialCost = filtered.reduce((sum, r) => sum + calculateMaterialCostUSD(r) * r.수량, 0) / totalQty;
  const weightedArtworkCost = filtered.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / totalQty;
  const weightedLaborCost = filtered.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / totalQty;
  const weightedOtherCost = filtered.reduce((sum, r) => sum + calculateOtherCostUSD(r) * r.수량, 0) / totalQty;

  return {
    시즌: season,
    발주수량: totalQty,
    평균TAG: Math.round(weightedTAG),
    평균원가USD: Math.round(weightedCostUSD * 100) / 100,
    평균원가KRW: Math.round(weightedCostKRW),
    원가율: Math.round((weightedCostKRW / weightedTAG) * 100 * 10) / 10,
    적용환율: Math.round(weightedExchangeRate * 100) / 100,
    원부자재단가: Math.round(weightedMaterialCost * 100) / 100,
    아트웍단가: Math.round(weightedArtworkCost * 100) / 100,
    공임단가: Math.round(weightedLaborCost * 100) / 100,
    기타경비단가: Math.round(weightedOtherCost * 100) / 100,
  };
}

// 최근 N개 시즌 전체 요약 계산
export function calculateRecentSeasonSummaries(
  records: CostRecord[],
  domesticTypes: DomesticType[],
  count: number = 4
): SeasonSummary[] {
  // 시즌 목록 추출 및 최근순 정렬
  const seasons = [...new Set(records.map((r) => r.시즌))]
    .sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''));
      const numB = parseInt(b.replace(/\D/g, ''));
      return numB - numA; // 내림차순 (최근순)
    })
    .slice(0, count);

  return seasons
    .map((season) => calculateSeasonSummary(records, season, domesticTypes))
    .filter((summary): summary is SeasonSummary => summary !== null);
}

// 아이템별 상세 계산
export function calculateItemDetails(
  records: CostRecord[],
  category: string,
  domesticTypes: DomesticType[]
): ItemDetail[] {
  let filtered = filterByDomestic(records, domesticTypes);
  filtered = filterByCategory(filtered, category);

  // 아이템명별 그룹화
  const items = [...new Set(filtered.map((r) => r.아이템명))].filter(Boolean);

  return items.map((item) => {
    const itemRecords = filtered.filter((r) => r.아이템명 === item);
    const totalQty = itemRecords.reduce((sum, r) => sum + r.수량, 0);

    if (totalQty === 0) {
      return {
        키: item,
        발주수량: 0,
        평균TAG: 0,
        평균원가USD: 0,
        평균원가KRW: 0,
        적용환율: 0,
        원부자재단가: 0,
        아트웍단가: 0,
        공임단가: 0,
        기타경비단가: 0,
      };
    }

    const weightedTAG = itemRecords.reduce((sum, r) => sum + r.TAG * r.수량, 0) / totalQty;
    const weightedCostUSD = itemRecords.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / totalQty;
    const weightedCostKRW = itemRecords.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / totalQty;
    const weightedExchangeRate = itemRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / totalQty;
    const weightedMaterialCost = itemRecords.reduce((sum, r) => sum + calculateMaterialCostUSD(r) * r.수량, 0) / totalQty;
    const weightedArtworkCost = itemRecords.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / totalQty;
    const weightedLaborCost = itemRecords.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / totalQty;
    const weightedOtherCost = itemRecords.reduce((sum, r) => sum + calculateOtherCostUSD(r) * r.수량, 0) / totalQty;

    return {
      키: item,
      발주수량: totalQty,
      평균TAG: Math.round(weightedTAG),
      평균원가USD: Math.round(weightedCostUSD * 100) / 100,
      평균원가KRW: Math.round(weightedCostKRW),
      적용환율: Math.round(weightedExchangeRate * 100) / 100,
      원부자재단가: Math.round(weightedMaterialCost * 100) / 100,
      아트웍단가: Math.round(weightedArtworkCost * 100) / 100,
      공임단가: Math.round(weightedLaborCost * 100) / 100,
      기타경비단가: Math.round(weightedOtherCost * 100) / 100,
    };
  }).sort((a, b) => b.발주수량 - a.발주수량); // 발주수량 내림차순
}

// 스타일별 상세 계산
export function calculateStyleDetails(
  records: CostRecord[],
  category: string,
  domesticTypes: DomesticType[]
): ItemDetail[] {
  let filtered = filterByDomestic(records, domesticTypes);
  filtered = filterByCategory(filtered, category);

  // 스타일별 그룹화
  const styles = [...new Set(filtered.map((r) => r.스타일))].filter(Boolean);

  return styles.map((style) => {
    const styleRecords = filtered.filter((r) => r.스타일 === style);
    const totalQty = styleRecords.reduce((sum, r) => sum + r.수량, 0);

    if (totalQty === 0) {
      return {
        키: style,
        발주수량: 0,
        평균TAG: 0,
        평균원가USD: 0,
        평균원가KRW: 0,
        적용환율: 0,
        원부자재단가: 0,
        아트웍단가: 0,
        공임단가: 0,
        기타경비단가: 0,
      };
    }

    const weightedTAG = styleRecords.reduce((sum, r) => sum + r.TAG * r.수량, 0) / totalQty;
    const weightedCostUSD = styleRecords.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / totalQty;
    const weightedCostKRW = styleRecords.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / totalQty;
    const weightedExchangeRate = styleRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / totalQty;
    const weightedMaterialCost = styleRecords.reduce((sum, r) => sum + calculateMaterialCostUSD(r) * r.수량, 0) / totalQty;
    const weightedArtworkCost = styleRecords.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / totalQty;
    const weightedLaborCost = styleRecords.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / totalQty;
    const weightedOtherCost = styleRecords.reduce((sum, r) => sum + calculateOtherCostUSD(r) * r.수량, 0) / totalQty;

    return {
      키: style,
      발주수량: totalQty,
      평균TAG: Math.round(weightedTAG),
      평균원가USD: Math.round(weightedCostUSD * 100) / 100,
      평균원가KRW: Math.round(weightedCostKRW),
      적용환율: Math.round(weightedExchangeRate * 100) / 100,
      원부자재단가: Math.round(weightedMaterialCost * 100) / 100,
      아트웍단가: Math.round(weightedArtworkCost * 100) / 100,
      공임단가: Math.round(weightedLaborCost * 100) / 100,
      기타경비단가: Math.round(weightedOtherCost * 100) / 100,
    };
  }).sort((a, b) => b.발주수량 - a.발주수량); // 발주수량 내림차순
}

// 계층 구조 데이터 계산 (시즌 → 아이템 → 스타일)
export function calculateHierarchyData(
  records: CostRecord[],
  category: string,
  domesticTypes: DomesticType[]
): SeasonHierarchy[] {
  let filtered = filterByDomestic(records, domesticTypes);
  filtered = filterByCategory(filtered, category);

  // 시즌별 그룹화 (최근순)
  const seasons = [...new Set(filtered.map((r) => r.시즌))].sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    return numB - numA;
  });

  return seasons.map((season) => {
    const seasonRecords = filtered.filter((r) => r.시즌 === season);
    const seasonTotalQty = seasonRecords.reduce((sum, r) => sum + r.수량, 0);

    // 시즌 레벨 요약
    const seasonWeightedTAG = seasonTotalQty > 0 
      ? seasonRecords.reduce((sum, r) => sum + r.TAG * r.수량, 0) / seasonTotalQty 
      : 0;
    const seasonWeightedCostUSD = seasonTotalQty > 0 
      ? seasonRecords.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / seasonTotalQty 
      : 0;
    const seasonWeightedCostKRW = seasonTotalQty > 0 
      ? seasonRecords.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / seasonTotalQty 
      : 0;
    const seasonWeightedExchangeRate = seasonTotalQty > 0 
      ? seasonRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / seasonTotalQty 
      : 0;

    // 아이템별 그룹화
    const items = [...new Set(seasonRecords.map((r) => r.아이템명))].filter(Boolean);
    
    const itemsData: ItemData[] = items.map((item) => {
      const itemRecords = seasonRecords.filter((r) => r.아이템명 === item);
      const itemTotalQty = itemRecords.reduce((sum, r) => sum + r.수량, 0);

      // 아이템 레벨 요약
      const itemWeightedTAG = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + r.TAG * r.수량, 0) / itemTotalQty 
        : 0;
      const itemWeightedCostUSD = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / itemTotalQty 
        : 0;
      const itemWeightedCostKRW = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / itemTotalQty 
        : 0;
      const itemWeightedExchangeRate = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / itemTotalQty 
        : 0;
      const itemWeightedMaterialCost = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + calculateMaterialCostUSD(r) * r.수량, 0) / itemTotalQty 
        : 0;
      const itemWeightedArtworkCost = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / itemTotalQty 
        : 0;
      const itemWeightedLaborCost = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / itemTotalQty 
        : 0;
      const itemWeightedOtherCost = itemTotalQty > 0 
        ? itemRecords.reduce((sum, r) => sum + calculateOtherCostUSD(r) * r.수량, 0) / itemTotalQty 
        : 0;

      // 스타일별 그룹화
      const styles = [...new Set(itemRecords.map((r) => r.스타일))].filter(Boolean);
      
      const stylesData: StyleData[] = styles.map((style) => {
        const styleRecords = itemRecords.filter((r) => r.스타일 === style);
        const styleTotalQty = styleRecords.reduce((sum, r) => sum + r.수량, 0);

        const styleWeightedTAG = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + r.TAG * r.수량, 0) / styleTotalQty 
          : 0;
        const styleWeightedCostUSD = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + calculateTotalCostUSD(r) * r.수량, 0) / styleTotalQty 
          : 0;
        const styleWeightedCostKRW = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + calculateTotalCostKRW(r) * r.수량, 0) / styleTotalQty 
          : 0;
        const styleWeightedExchangeRate = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + r.적용환율 * r.수량, 0) / styleTotalQty 
          : 0;
        const styleWeightedMaterialCost = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + calculateMaterialCostUSD(r) * r.수량, 0) / styleTotalQty 
          : 0;
        const styleWeightedArtworkCost = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + r.USD_아트웍 * r.수량, 0) / styleTotalQty 
          : 0;
        const styleWeightedLaborCost = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + r.USD_공임 * r.수량, 0) / styleTotalQty 
          : 0;
        const styleWeightedOtherCost = styleTotalQty > 0 
          ? styleRecords.reduce((sum, r) => sum + calculateOtherCostUSD(r) * r.수량, 0) / styleTotalQty 
          : 0;

        return {
          스타일: style,
          발주수량: styleTotalQty,
          평균TAG: Math.round(styleWeightedTAG),
          평균원가USD: Math.round(styleWeightedCostUSD * 100) / 100,
          평균원가KRW: Math.round(styleWeightedCostKRW),
          적용환율: Math.round(styleWeightedExchangeRate * 100) / 100,
          원부자재단가: Math.round(styleWeightedMaterialCost * 100) / 100,
          아트웍단가: Math.round(styleWeightedArtworkCost * 100) / 100,
          공임단가: Math.round(styleWeightedLaborCost * 100) / 100,
          기타경비단가: Math.round(styleWeightedOtherCost * 100) / 100,
        };
      }).sort((a, b) => b.발주수량 - a.발주수량);

      return {
        아이템명: item,
        발주수량: itemTotalQty,
        평균TAG: Math.round(itemWeightedTAG),
        평균원가USD: Math.round(itemWeightedCostUSD * 100) / 100,
        평균원가KRW: Math.round(itemWeightedCostKRW),
        적용환율: Math.round(itemWeightedExchangeRate * 100) / 100,
        원부자재단가: Math.round(itemWeightedMaterialCost * 100) / 100,
        아트웍단가: Math.round(itemWeightedArtworkCost * 100) / 100,
        공임단가: Math.round(itemWeightedLaborCost * 100) / 100,
        기타경비단가: Math.round(itemWeightedOtherCost * 100) / 100,
        styles: stylesData,
      };
    }).sort((a, b) => b.발주수량 - a.발주수량);

    return {
      시즌: season,
      발주수량: seasonTotalQty,
      평균TAG: Math.round(seasonWeightedTAG),
      평균원가USD: Math.round(seasonWeightedCostUSD * 100) / 100,
      평균원가KRW: Math.round(seasonWeightedCostKRW),
      적용환율: Math.round(seasonWeightedExchangeRate * 100) / 100,
      items: itemsData,
    };
  });
}

