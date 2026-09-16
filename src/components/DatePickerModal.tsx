import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { formatDateToISO, parseISODate } from '../utils/formatters';

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
}) => {
  if (!isOpen) return null;

  const initialDate = useMemo(() => parseISODate(selectedDate), [selectedDate]);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-11

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const years = useMemo(() => {
    const list: number[] = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 6; y <= currentYear + 4; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Days in selected viewMonth
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  // First day offset (0 = Sunday, 1 = Monday, ...)
  const startDayOffset = useMemo(() => {
    const day = new Date(viewYear, viewMonth, 1).getDay();
    // Monday as start of week: Monday = 0, Sunday = 6
    return (day + 6) % 7;
  }, [viewYear, viewMonth]);

  const handleDayClick = (dayNumber: number) => {
    const d = new Date(viewYear, viewMonth, dayNumber);
    onSelectDate(formatDateToISO(d));
    onClose();
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectToday = () => {
    const today = new Date();
    onSelectDate(formatDateToISO(today));
    onClose();
  };

  const isCurrentSelected = (day: number) => {
    const dStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dStr === selectedDate;
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Tarih Seçimi
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Year & Month Pickers */}
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Ay Seçici */}
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            {/* Yıl Seçici */}
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Hafta Günleri Başlıkları */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400">
            <span>Pt</span>
            <span>Sa</span>
            <span>Ça</span>
            <span>Pe</span>
            <span>Cu</span>
            <span>Ct</span>
            <span>Pz</span>
          </div>

          {/* Günler Grid'i */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = isCurrentSelected(day);
              const isToday = isTodayDate(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer with Today Shortcut */}
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleSelectToday}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Bugüne Git</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </div>
  );
};
