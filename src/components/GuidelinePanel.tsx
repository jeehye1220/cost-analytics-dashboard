'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuidelineResult, SimulatorState, TARGET_MARKUP } from '@/lib/types';

interface GuidelinePanelProps {
  guideline: GuidelineResult;
  state: SimulatorState;
}

export function GuidelinePanel({ guideline, state }: GuidelinePanelProps) {
  // 상태별 색상 및 메시지
  const getStatusInfo = () => {
    switch (guideline.현재상태) {
      case 'surplus':
        return {
          color: 'bg-emerald-50 border-emerald-200',
          iconColor: 'text-emerald-600',
          icon: '✅',
          title: '목표 달성',
          message: `Markup ${state.전체Markup.toFixed(2)} > 목표 ${TARGET_MARKUP.toFixed(1)} - 여유 마진 확보됨`,
        };
      case 'deficit':
        return {
          color: 'bg-rose-50 border-rose-200',
          iconColor: 'text-rose-600',
          icon: '⚠️',
          title: '조정 필요',
          message: `Markup ${state.전체Markup.toFixed(2)} < 목표 ${TARGET_MARKUP.toFixed(1)} - 원가 절감 또는 가격 인상 필요`,
        };
      default:
        return {
          color: 'bg-blue-50 border-blue-200',
          iconColor: 'text-blue-600',
          icon: '🎯',
          title: '목표 근접',
          message: `Markup ${state.전체Markup.toFixed(2)} ≈ 목표 ${TARGET_MARKUP.toFixed(1)}`,
        };
    }
  };

  const statusInfo = getStatusInfo();

  // 조정항목별 아이콘
  const getItemIcon = (item: string) => {
    switch (item) {
      case '목표TAG': return '🏷️';
      case '원부자재': return '🧵';
      case '공임': return '👷';
      case '아트웍': return '🎨';
      case '기타': return '📦';
      default: return '📌';
    }
  };

  // 조정항목별 색상
  const getItemColor = (item: string) => {
    switch (item) {
      case '목표TAG': return 'text-violet-600 bg-violet-50';
      case '원부자재': return 'text-blue-600 bg-blue-50';
      case '공임': return 'text-amber-600 bg-amber-50';
      case '아트웍': return 'text-purple-600 bg-purple-50';
      case '기타': return 'text-pink-600 bg-pink-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 가이드라인 상태 */}
      <Card className={`${statusInfo.color} border`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className={statusInfo.iconColor}>{statusInfo.icon}</span>
            <span className="text-slate-700">{statusInfo.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 mb-4">{statusInfo.message}</p>
          
          {/* Gap 표시 */}
          <div className="flex items-center gap-4 p-4 bg-white/50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">현재 Markup</div>
              <div className={`text-2xl font-bold ${state.전체Markup >= TARGET_MARKUP ? 'text-emerald-600' : 'text-rose-600'}`}>
                {state.전체Markup.toFixed(2)}
              </div>
            </div>
            <div className="text-2xl text-slate-300">→</div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">목표 Markup</div>
              <div className="text-2xl font-bold text-slate-700">{TARGET_MARKUP.toFixed(1)}</div>
            </div>
            <div className="text-2xl text-slate-300">=</div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Gap</div>
              <div className={`text-2xl font-bold ${guideline.gap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {guideline.gap >= 0 ? '+' : ''}{guideline.gap.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 원가율 대비 */}
          <div className="mt-4 p-4 bg-white/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">현재 원가율</span>
              <span className={`font-bold ${state.전체원가율 <= 22.2 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {state.전체원가율.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-500">목표 원가율</span>
              <span className="font-bold text-slate-700">22.2%</span>
            </div>
            <div className="mt-3 h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  state.전체원가율 <= 22.2 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min((state.전체원가율 / 30) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0%</span>
              <span className="text-emerald-600">22.2%</span>
              <span>30%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 조정 추천 */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
            <span className="text-violet-600">💡</span>
            조정 추천
            <span className="text-xs text-slate-400 font-normal ml-2">
              (영향도 순)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {guideline.suggestions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <span className="text-4xl mb-2 block">🎉</span>
              <p>현재 목표를 달성했습니다!</p>
              <p className="text-sm text-slate-400 mt-1">추가 조정이 필요하지 않습니다.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {guideline.suggestions.map((suggestion, idx) => (
                <div 
                  key={`${suggestion.중분류}-${suggestion.조정항목}-${idx}`}
                  className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getItemColor(suggestion.조정항목)}`}>
                        {getItemIcon(suggestion.조정항목)} {suggestion.조정항목}
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {suggestion.중분류}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      Math.abs(suggestion.영향도) > 0.5 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      영향도 {suggestion.영향도.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-slate-500">
                      {suggestion.조정항목 === '목표TAG' ? '₩' : '$'}{suggestion.현재값.toLocaleString()}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className={`font-medium ${suggestion.조정량 > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {suggestion.조정항목 === '목표TAG' ? '₩' : '$'}{suggestion.제안값.toLocaleString()}
                    </span>
                    <span className={`text-xs ${suggestion.조정률 > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ({suggestion.조정률 > 0 ? '+' : ''}{suggestion.조정률.toFixed(1)}%)
                    </span>
                  </div>
                  
                  <p className="mt-1 text-xs text-slate-500">{suggestion.설명}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 환율 민감도 분석 */}
      <Card className="bg-white border-slate-200 shadow-sm lg:col-span-2">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-lg text-slate-700 flex items-center gap-2">
            <span className="text-amber-600">📈</span>
            환율 민감도 분석
            <span className="text-xs text-slate-400 font-normal ml-2">
              (현재 환율: {state.예상환율.toLocaleString()} KRW/USD)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-4 gap-4">
            {guideline.환율민감도.map((item) => (
              <div 
                key={item.환율변화}
                className={`p-4 rounded-lg border ${
                  item.환율변화 < 0 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="text-sm text-slate-500 mb-1">
                  환율 {item.환율변화 > 0 ? '+' : ''}{item.환율변화}원
                </div>
                <div className="text-lg font-bold text-slate-700">
                  {(state.예상환율 + item.환율변화).toLocaleString()}
                </div>
                <div className={`text-sm mt-2 font-medium ${
                  item.markup영향 > 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  Markup {item.markup영향 > 0 ? '+' : ''}{item.markup영향.toFixed(2)}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {item.환율변화 < 0 ? '원가 하락' : '원가 상승'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-amber-600">💡</span>
              <span>
                환율이 50원 상승하면 Markup이 약 {Math.abs(guideline.환율민감도.find(s => s.환율변화 === 50)?.markup영향 || 0).toFixed(2)} 하락합니다.
                환율 변동에 대비한 원가 구조 개선이 필요합니다.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

