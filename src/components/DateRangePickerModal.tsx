import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, X, Check, Clock } from 'lucide-react';
import { formatDateToISO, parseISODate } from '../utils/formatters';

interface DateRangePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onApply: (start: string, end: string) => void;
}

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onApply,
}) => {
  if (!isOpen) return null;

  const todayStr = useMemo(() => formatDateToISO(new Date()), []);
  const [tempStart, setTempStart] = useState<string>(startDate || todayStr);
  const [tempEnd, setTempEnd] = useState<string>(endDate || todayStr);
  const [selectingStep, setSelectingStep] = useState<'start' | 'end'>('start');

  const initialDate = useMemo(() => {
    return parseISODate(tempStart || todayStr);
  }, [tempStart, todayStr]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-11

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const years = useMemo(() => {
    const list: number[] = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 5; y <= currentYear + 3; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const startDayOffset = useMemo(() => {
    const day = new Date(viewYear, viewMonth, 1).getDay();
    return (day + 6) % 7;
  }, [viewYear, viewMonth]);

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

  const handleDayClick = (dayNumber: number) => {
    const d = new Date(viewYear, viewMonth, dayNumber);
    const clickedStr = formatDateToISO(d);

    if (selectingStep === 'start') {
      setTempStart(clickedStr);
      if (tempEnd && clickedStr > tempEnd) {
        setTempEnd(clickedStr);
      }
      setSelectingStep('end');
    } else {
      if (clickedStr < tempStart) {
        setTempStart(clickedStr);
        setSelectingStep('end');
      } else {
        setTempEnd(clickedStr);
        setSelectingStep('start');
      }
    }
  };

  const applyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'last30' | 'year') => {
    const now = new Date();
    let s = new Date();
    let e = new Date();

    if (preset === 'today') {
      s = now;
      e = now;
    } else if (preset === 'yesterday') {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      e = s;
    } else if (preset === 'week') {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
      e = now;
    } else if (preset === 'month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'last30') {
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      e = now;
    } else if (preset === 'year') {
      s = new Date(now.getFullYear(), 0, 1);
      e = new Date(now.getFullYear(), 11, 31);
    }

    const sStr = formatDateToISO(s);
    const eStr = formatDateToISO(e);
    setTempStart(sStr);
    setTempEnd(eStr);
    setViewYear(s.getFullYear());
    setViewMonth(s.getMonth());
  };

  const handleSave = () => {
    let finalStart = tempStart;
    let finalEnd = tempEnd;
    if (finalStart > finalEnd) {
      const swap = finalStart;
      finalStart = finalEnd;
      finalEnd = swap;
    }
    onApply(finalStart, finalEnd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Tarih Aralığı Seç
              </h3>
              <p className="text-[11px] text-slate-400">
                Stok hareketleri analizleri için başlangıç ve bitiş tarihi belirleyin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-5 pt-3.5 pb-2 bg-slate-950/50 border-b border-slate-800/80">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Hızlı Aralıklar</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => applyPreset('today')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-200 transition-colors"
            >
              Bugün
            </button>
            <button
              onClick={() => applyPreset('yesterday')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-200 transition-colors"
            >
              Dün
            </button>
            <button
              onClick={() => applyPreset('week')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-200 transition-colors"
            >
              Bu Hafta
            </button>
            <button
              onClick={() => applyPreset('month')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-200 transition-colors"
            >
              Bu Ay
            </button>
            <button
              onClick={() => applyPreset('last30')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-200 transition-colors"
            >
              Son 30 Gün
            </button>
            <button
              onClick={() => applyPreset('year')}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-400 text-slate-200 transition-colors"
            >
              Bu Yıl
            </button>
          </div>
        </div>

        {/* Selected Range Display & Selection step toggle */}
        <div className="px-5 pt-3 flex items-center gap-2">
          <button
            onClick={() => setSelectingStep('start')}
            className={`flex-1 p-2 rounded-xl border text-left transition-all ${
              selectingStep === 'start'
                ? 'bg-blue-600/20 border-blue-500/80 shadow-2xs'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Başlangıç Tarihi
            </span>
            <span className="text-xs font-bold text-slate-100">
              {tempStart || 'Seçiniz'}
            </span>
          </button>

          <span className="text-slate-500 text-xs font-bold">→</span>

          <button
            onClick={() => setSelectingStep('end')}
            className={`flex-1 p-2 rounded-xl border text-left transition-all ${
              selectingStep === 'end'
                ? 'bg-blue-600/20 border-blue-500/80 shadow-2xs'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Bitiş Tarihi
            </span>
            <span className="text-xs font-bold text-slate-100">
              {tempEnd || 'Seçiniz'}
            </span>
          </button>
        </div>

        {/* Calendar Navigators */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Month Dropdown */}
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden"
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-hidden"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="px-5 grid grid-cols-7 gap-1 text-center py-1 border-b border-slate-800">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
            <span key={day} className="text-[10px] font-bold text-slate-500">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Day Grid */}
        <div className="p-5 pt-2 grid grid-cols-7 gap-1">
          {/* Offset empty spaces */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`offset-${i}`} className="h-8" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const d = new Date(viewYear, viewMonth, dayNum);
            const dStr = formatDateToISO(d);
            const isStart = dStr === tempStart;
            const isEnd = dStr === tempEnd;
            const isInRange = tempStart && tempEnd && dStr > tempStart && dStr < tempEnd;
            const isToday = dStr === todayStr;

            return (
              <button
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`h-8 w-full text-xs font-semibold flex items-center justify-center transition-all ${
                  isStart || isEnd
                    ? 'bg-blue-600 text-white rounded-lg shadow-sm font-bold scale-105 z-10'
                    : isInRange
                    ? 'bg-blue-900/40 text-blue-200 rounded-none'
                    : isToday
                    ? 'border border-blue-500/70 text-blue-400 rounded-lg hover:bg-slate-800'
                    : 'text-slate-300 hover:bg-slate-800 rounded-lg'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            Vazgeç
          </button>
          <button
            id="apply-date-range-btn"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aralığı Uygula</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
