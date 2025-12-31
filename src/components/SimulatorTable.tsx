'use client';

import { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SimulatorCategory, TARGET_MARKUP } from '@/lib/types';
import { updateCategoryCalculations } from '@/lib/simulator';

interface SimulatorTableProps {
  categories: SimulatorCategory[];
  exchangeRate: number;
  onCategoryUpdate: (categoryId: string, field: keyof SimulatorCategory, value: number | boolean) => void;
}

export function SimulatorTable({ categories, exchangeRate, onCategoryUpdate }: SimulatorTableProps) {
  // 카테고리 계산 필드 업데이트
  const getUpdatedCategory = useCallback((category: SimulatorCategory) => {
    return updateCategoryCalculations(category, exchangeRate);
  }, [exchangeRate]);

  // Markup 색상
  const getMarkupColor = (markup: number) => {
    if (markup >= TARGET_MARKUP) return 'text-emerald-600 bg-emerald-50';
    if (markup >= TARGET_MARKUP - 0.3) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  // 원가율 색상
  const getCostRateColor = (costRate: number) => {
    const targetRate = 100 / TARGET_MARKUP; // 22.2%
    if (costRate <= targetRate) return 'text-emerald-600';
    if (costRate <= targetRate + 2) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
          <span className="text-violet-600">📊</span>
          중분류별 시뮬레이션
          <span className="text-xs text-slate-400 font-normal ml-2">
            (값을 직접 수정하여 시뮬레이션)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 px-2 text-slate-500 font-medium w-8">잠금</th>
              <th className="text-left py-3 px-2 text-slate-500 font-medium">중분류</th>
              <th className="text-right py-3 px-2 text-violet-600 font-medium">목표TAG</th>
              <th className="text-right py-3 px-2 text-blue-600 font-medium">원부자재</th>
              <th className="text-right py-3 px-2 text-amber-600 font-medium">공임</th>
              <th className="text-right py-3 px-2 text-purple-600 font-medium">아트웍</th>
              <th className="text-right py-3 px-2 text-pink-600 font-medium">기타</th>
              <th className="text-right py-3 px-2 text-slate-500 font-medium">발주수량</th>
              <th className="text-right py-3 px-2 text-slate-500 font-medium bg-slate-50">총원가USD</th>
              <th className="text-right py-3 px-2 text-slate-500 font-medium bg-slate-50">원가KRW</th>
              <th className="text-right py-3 px-2 text-slate-500 font-medium bg-slate-50">원가율</th>
              <th className="text-center py-3 px-2 text-slate-500 font-medium bg-slate-50">Markup</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const updated = getUpdatedCategory(category);
              return (
                <tr 
                  key={category.id} 
                  className={`border-b border-slate-100 hover:bg-slate-50/50 ${category.locked ? 'bg-slate-100/50' : ''}`}
                >
                  {/* 잠금 */}
                  <td className="py-2 px-2">
                    <Checkbox
                      checked={category.locked}
                      onCheckedChange={(checked) => onCategoryUpdate(category.id, 'locked', !!checked)}
                      className="border-slate-300"
                    />
                  </td>

                  {/* 중분류 */}
                  <td className="py-2 px-2 font-medium text-slate-700">
                    {category.중분류}
                  </td>

                  {/* 목표TAG - 편집 가능 */}
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      value={category.목표TAG}
                      onChange={(e) => onCategoryUpdate(category.id, '목표TAG', Number(e.target.value))}
                      disabled={category.locked}
                      className="w-24 text-right text-violet-600 font-medium h-8 disabled:opacity-50"
                    />
                  </td>

                  {/* 원부자재 - 편집 가능 */}
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={category.원부자재}
                      onChange={(e) => onCategoryUpdate(category.id, '원부자재', Number(e.target.value))}
                      disabled={category.locked}
                      className="w-20 text-right text-blue-600 font-medium h-8 disabled:opacity-50"
                    />
                  </td>

                  {/* 공임 - 편집 가능 */}
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={category.공임}
                      onChange={(e) => onCategoryUpdate(category.id, '공임', Number(e.target.value))}
                      disabled={category.locked}
                      className="w-20 text-right text-amber-600 font-medium h-8 disabled:opacity-50"
                    />
                  </td>

                  {/* 아트웍 - 편집 가능 */}
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={category.아트웍}
                      onChange={(e) => onCategoryUpdate(category.id, '아트웍', Number(e.target.value))}
                      disabled={category.locked}
                      className="w-20 text-right text-purple-600 font-medium h-8 disabled:opacity-50"
                    />
                  </td>

                  {/* 기타 - 편집 가능 */}
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={category.기타}
                      onChange={(e) => onCategoryUpdate(category.id, '기타', Number(e.target.value))}
                      disabled={category.locked}
                      className="w-20 text-right text-pink-600 font-medium h-8 disabled:opacity-50"
                    />
                  </td>

                  {/* 발주수량 - 편집 가능 */}
                  <td className="py-2 px-2">
                    <Input
                      type="number"
                      value={category.발주수량}
                      onChange={(e) => onCategoryUpdate(category.id, '발주수량', Number(e.target.value))}
                      disabled={category.locked}
                      className="w-24 text-right text-slate-600 font-medium h-8 disabled:opacity-50"
                    />
                  </td>

                  {/* 총원가USD - 계산값 */}
                  <td className="py-2 px-2 text-right text-slate-700 font-medium bg-slate-50">
                    ${updated.총원가USD.toFixed(2)}
                  </td>

                  {/* 원가KRW - 계산값 */}
                  <td className="py-2 px-2 text-right text-slate-700 font-medium bg-slate-50">
                    ₩{updated.총원가KRW.toLocaleString()}
                  </td>

                  {/* 원가율 - 계산값 */}
                  <td className={`py-2 px-2 text-right font-medium bg-slate-50 ${getCostRateColor(updated.원가율)}`}>
                    {updated.원가율.toFixed(1)}%
                  </td>

                  {/* Markup - 계산값 */}
                  <td className="py-2 px-2 text-center bg-slate-50">
                    <span className={`px-2 py-1 rounded-lg font-bold ${getMarkupColor(updated.markup)}`}>
                      {updated.markup.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* 합계 행 */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-100 font-bold">
              <td className="py-3 px-2"></td>
              <td className="py-3 px-2 text-slate-700">합계</td>
              <td className="py-3 px-2 text-right text-violet-600">
                ₩{Math.round(
                  categories.reduce((sum, c) => sum + c.목표TAG * c.발주수량, 0) /
                  categories.reduce((sum, c) => sum + c.발주수량, 0) || 0
                ).toLocaleString()}
                <span className="text-xs text-slate-400 block">가중평균</span>
              </td>
              <td className="py-3 px-2 text-right text-blue-600" colSpan={4}>
                $
                {(
                  categories.reduce((sum, c) => {
                    const updated = getUpdatedCategory(c);
                    return sum + updated.총원가USD * c.발주수량;
                  }, 0) / categories.reduce((sum, c) => sum + c.발주수량, 0) || 0
                ).toFixed(2)}
                <span className="text-xs text-slate-400 block">가중평균 원가</span>
              </td>
              <td className="py-3 px-2 text-right text-slate-700">
                {categories.reduce((sum, c) => sum + c.발주수량, 0).toLocaleString()}
              </td>
              <td className="py-3 px-2 bg-slate-50" colSpan={4}></td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}

