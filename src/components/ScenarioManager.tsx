'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SimulatorState, Scenario } from '@/lib/types';
import {
  saveScenario,
  loadAllScenarios,
  deleteScenario,
  exportScenarioToJSON,
  exportScenarioToCSV,
  importScenarioFromJSON,
  createNewScenario,
  duplicateScenario,
} from '@/lib/simulator';

interface ScenarioManagerProps {
  currentState: SimulatorState | null;
  onLoadScenario: (state: SimulatorState) => void;
}

export function ScenarioManager({ currentState, onLoadScenario }: ScenarioManagerProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 시나리오 목록 로드
  useEffect(() => {
    setScenarios(loadAllScenarios());
  }, []);

  // 시나리오 저장
  const handleSave = () => {
    if (!currentState || !newScenarioName.trim()) return;
    
    const scenario = createNewScenario(
      newScenarioName.trim(),
      currentState,
      newScenarioDesc.trim() || undefined
    );
    
    saveScenario(scenario);
    setScenarios(loadAllScenarios());
    setSaveDialogOpen(false);
    setNewScenarioName('');
    setNewScenarioDesc('');
  };

  // 시나리오 불러오기
  const handleLoad = (scenario: Scenario) => {
    onLoadScenario(scenario.state);
    setLoadDialogOpen(false);
  };

  // 시나리오 삭제
  const handleDelete = (id: string) => {
    if (confirm('이 시나리오를 삭제하시겠습니까?')) {
      deleteScenario(id);
      setScenarios(loadAllScenarios());
    }
  };

  // 시나리오 복제
  const handleDuplicate = (scenario: Scenario) => {
    const duplicated = duplicateScenario(scenario, `${scenario.name} (복사본)`);
    saveScenario(duplicated);
    setScenarios(loadAllScenarios());
  };

  // JSON 내보내기
  const handleExportJSON = (scenario: Scenario) => {
    const json = exportScenarioToJSON(scenario);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV 내보내기
  const handleExportCSV = (scenario: Scenario) => {
    const csv = exportScenarioToCSV(scenario);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON 가져오기
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const scenario = importScenarioFromJSON(content);
      if (scenario) {
        // 새로운 ID 부여
        scenario.id = `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        scenario.name = `${scenario.name} (가져옴)`;
        saveScenario(scenario);
        setScenarios(loadAllScenarios());
        alert('시나리오를 가져왔습니다.');
      } else {
        alert('올바른 시나리오 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 현재 상태 빠른 내보내기
  const handleQuickExport = (format: 'json' | 'csv') => {
    if (!currentState) return;
    
    const tempScenario = createNewScenario(
      `${currentState.시즌}_시뮬레이션_${new Date().toLocaleDateString('ko-KR')}`,
      currentState
    );
    
    if (format === 'json') {
      handleExportJSON(tempScenario);
    } else {
      handleExportCSV(tempScenario);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 저장 다이얼로그 */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm" className="bg-violet-600 hover:bg-violet-700">
            💾 시나리오 저장
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>시나리오 저장</DialogTitle>
            <DialogDescription>
              현재 시뮬레이션 상태를 시나리오로 저장합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">시나리오 이름</label>
              <Input
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="예: 27S 공격적 시나리오"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">설명 (선택)</label>
              <Input
                value={newScenarioDesc}
                onChange={(e) => setNewScenarioDesc(e.target.value)}
                placeholder="예: 원부자재 10% 절감 가정"
                className="mt-1"
              />
            </div>
            {currentState && (
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">시즌</span>
                  <span className="font-medium">{currentState.시즌}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">전체 Markup</span>
                  <span className="font-medium">{currentState.전체Markup.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">예상 환율</span>
                  <span className="font-medium">₩{currentState.예상환율.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!newScenarioName.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 불러오기 다이얼로그 */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            📂 불러오기
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>시나리오 불러오기</DialogTitle>
            <DialogDescription>
              저장된 시나리오를 선택하거나 파일에서 가져옵니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* 파일 가져오기 */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-slate-600">JSON 파일에서 가져오기</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                파일 선택
              </Button>
            </div>

            {/* 저장된 시나리오 목록 */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  저장된 시나리오가 없습니다.
                </div>
              ) : (
                scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="p-3 border border-slate-200 rounded-lg hover:border-violet-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-slate-700">{scenario.name}</div>
                        {scenario.description && (
                          <div className="text-sm text-slate-500 mt-0.5">{scenario.description}</div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span>시즌: {scenario.state.시즌}</span>
                          <span>Markup: {scenario.state.전체Markup.toFixed(2)}</span>
                          <span>환율: ₩{scenario.state.예상환율.toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(scenario.updatedAt).toLocaleDateString('ko-KR')} 저장
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleLoad(scenario)}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          불러오기
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">⋮</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDuplicate(scenario)}>
                              📋 복제
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportJSON(scenario)}>
                              📄 JSON 내보내기
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportCSV(scenario)}>
                              📊 CSV 내보내기
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(scenario.id)}
                              className="text-rose-600"
                            >
                              🗑️ 삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 빠른 내보내기 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            📥 내보내기
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            📄 JSON으로 내보내기
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            📊 CSV로 내보내기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

