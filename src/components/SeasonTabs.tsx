'use client';

import { SeasonTab, SEASON_TABS } from '@/lib/types';

interface SeasonTabsProps {
  currentTab: SeasonTab;
  onTabChange: (tab: SeasonTab) => void;
}

export function SeasonTabs({ currentTab, onTabChange }: SeasonTabsProps) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 shadow-inner">
      {SEASON_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onTabChange(tab.value)}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            currentTab === tab.value
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
