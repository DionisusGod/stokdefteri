import React, { useState } from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Calendar, RotateCcw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDisplayDate, shiftDate, formatDateToISO } from '../utils/formatters';
import { DatePickerModal } from './DatePickerModal';

interface DayNavigatorProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  dayInCount: number;
  dayOutCount: number;
}

export const DayNavigator: React.FC<DayNavigatorProps> = ({
  currentDate,
  onDateChange,
  dayInCount,
  dayOutCount,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { isToday, dayName, formattedDate } = formatDisplayDate(currentDate);

  const handleShift = (days: number) => {
    onDateChange(shiftDate(currentDate, days));
  };

  const handleJumpToday = () => {
    onDateChange(formatDateToISO(new Date()));
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800">
        {/* Tarih Navigasyonu */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Geri Butonları */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 shadow-2xs">
            <button
              id="nav-far-prev"
              onClick={() => handleShift(-7)}
              title="7 Gün Geri"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              id="nav-prev"
              onClick={() => handleShift(-1)}
              title="1 Gün Geri"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Tarih Başlığı */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDatePickerOpen(true)}
              title="Tarih seçmek için tıklayın"
              className="flex items-baseline gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800/80 transition-colors text-left"
            >
              <span className="text-sm sm:text-base font-semibold text-slate-100">
                {formattedDate}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {dayName}
              </span>
            </button>

            {isToday ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-blue-950/80 text-blue-300 rounded-full border border-blue-800/60">
                Bugün
              </span>
            ) : (
              <button
                onClick={handleJumpToday}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 text-blue-400 hover:bg-blue-900/40 bg-blue-950/60 rounded-full transition-colors border border-blue-800/50"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Bugüne Dön</span>
              </button>
            )}

            <button
              onClick={() => setIsDatePickerOpen(true)}
              title="Takvim Seçiciyi Aç"
              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          {/* İleri Butonları */}
          <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800 shadow-2xs">
            <button
              id="nav-next"
              onClick={() => handleShift(1)}
              title="1 Gün İleri"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              id="nav-far-next"
              onClick={() => handleShift(7)}
              title="7 Gün İleri"
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Günlük Hareket Adet Göstergesi */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-800/60">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span className="font-semibold">{dayInCount} Giriş</span>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-950/60 text-rose-400 px-2.5 py-1 rounded-lg border border-rose-800/60">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="font-semibold">{dayOutCount} Çıkış</span>
          </div>
        </div>
      </div>

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={currentDate}
        onSelectDate={onDateChange}
      />
    </>
  );
};
