import React from 'react';
import { CalendarMode, Language } from '../../types';
import { formatDateWithCalendar } from '../../utils/nepaliCalendar';
import { Calendar, Globe } from 'lucide-react';

interface CalendarToggleProps {
  currentMode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
  lang?: Language;
  showTodayBadge?: boolean;
}

export const CalendarToggle: React.FC<CalendarToggleProps> = ({
  currentMode,
  onModeChange,
  lang = 'en',
  showTodayBadge = true,
}) => {
  const todayStr = formatDateWithCalendar(new Date(), 'BOTH', lang);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showTodayBadge && (
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 font-mono">
          <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
          <span>{todayStr}</span>
        </div>
      )}

      <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => onModeChange('AD')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
            currentMode === 'AD'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Gregorian Calendar (A.D)"
        >
          A.D
        </button>

        <button
          type="button"
          onClick={() => onModeChange('BS')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
            currentMode === 'BS'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Bikram Sambat Nepali Calendar (B.S)"
        >
          B.S. (नेपाली)
        </button>

        <button
          type="button"
          onClick={() => onModeChange('BOTH')}
          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
            currentMode === 'BOTH'
              ? 'bg-white text-blue-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Show both A.D. and B.S. dates together"
        >
          Both
        </button>
      </div>
    </div>
  );
};
