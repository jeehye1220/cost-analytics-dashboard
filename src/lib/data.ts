import Papa from 'papaparse';
import { CostRecord, DomesticType } from './types';

// CSV 컬럼명 매핑
const COLUMN_MAP: Record<string, keyof CostRecord> = {
  '브랜드': '브랜드',
  '시즌': '시즌',
  '스타일': '스타일',
  '중분류': '중분류',
  '아이템명': '아이템명',
  'PO': 'PO',
  'TAG': 'TAG',
  '수량': '수량',
  '원가견적번호': '원가견적번호',
  '발주통화': '발주통화',
  '제조업체': '제조업체',
  '견적서제출일자': '견적서제출일자',
  'PO_CLS': 'PO_CLS',
  '마감형태': '마감형태',
  '내수구분': '내수구분',
  '적용환율': '적용환율',
  '(USD)_원자재': 'USD_원자재',
  '(USD)_아트웍': 'USD_아트웍',
  '(USD)_부자재': 'USD_부자재',
  '(USD)_택/라벨': 'USD_택라벨',
  '(USD)_공임': 'USD_공임',
  '(USD)_본사공급자재': 'USD_본사공급자재',
  '(USD)_정상마진': 'USD_정상마진',
  '(USD)_기타마진/경비': 'USD_기타마진경비',
  '(KRW)_원자재': 'KRW_원자재',
  '(KRW)_아트웍': 'KRW_아트웍',
  '(KRW)_부자재': 'KRW_부자재',
  '(KRW)_택/라벨': 'KRW_택라벨',
  '(KRW)_공임': 'KRW_공임',
  '(KRW)_본사공급자재': 'KRW_본사공급자재',
  '(KRW)_정상마진': 'KRW_정상마진',
  '(KRW)_기타마진/경비': 'KRW_기타마진경비',
};

// CSV 로우를 CostRecord로 변환
function parseRow(row: Record<string, string>): CostRecord {
  const record: Partial<CostRecord> = {};
  
  for (const [csvCol, recordKey] of Object.entries(COLUMN_MAP)) {
    const value = row[csvCol];
    
    // 숫자 필드 처리
    if ([
      'TAG', '수량', '적용환율',
      'USD_원자재', 'USD_아트웍', 'USD_부자재', 'USD_택라벨', 'USD_공임', 
      'USD_본사공급자재', 'USD_정상마진', 'USD_기타마진경비',
      'KRW_원자재', 'KRW_아트웍', 'KRW_부자재', 'KRW_택라벨', 'KRW_공임',
      'KRW_본사공급자재', 'KRW_정상마진', 'KRW_기타마진경비'
    ].includes(recordKey)) {
      (record as Record<string, number | string>)[recordKey] = parseFloat(value) || 0;
    } else {
      (record as Record<string, number | string>)[recordKey] = value || '';
    }
  }
  
  return record as CostRecord;
}

// CSV 파일 파싱
export async function loadCostData(csvPath: string): Promise<CostRecord[]> {
  const response = await fetch(csvPath);
  const csvText = await response.text();
  
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const records = results.data.map((row) => parseRow(row as Record<string, string>));
        resolve(records);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

// 데이터 필터링 (내수구분 기준)
export function filterByDomestic(
  records: CostRecord[],
  selectedTypes: DomesticType[]
): CostRecord[] {
  if (selectedTypes.length === 0) return [];
  return records.filter((record) => 
    selectedTypes.includes(record.내수구분 as DomesticType)
  );
}

// 데이터 필터링 (시즌 기준)
export function filterBySeason(
  records: CostRecord[],
  season: string
): CostRecord[] {
  return records.filter((record) => record.시즌 === season);
}

// 데이터 필터링 (중분류 기준)
export function filterByCategory(
  records: CostRecord[],
  category: string
): CostRecord[] {
  return records.filter((record) => record.중분류 === category);
}

// 사용 가능한 시즌 목록 추출 (정렬)
export function getAvailableSeasons(records: CostRecord[]): string[] {
  const seasons = [...new Set(records.map((r) => r.시즌))];
  return seasons.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    return numA - numB;
  });
}

// 사용 가능한 중분류 목록 추출
export function getAvailableCategories(records: CostRecord[]): string[] {
  return [...new Set(records.map((r) => r.중분류))].filter(Boolean);
}




