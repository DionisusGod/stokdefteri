import React, { useState, useMemo } from 'react';
import {
  CalendarRange,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  FileSpreadsheet,
  Inbox,
  ArrowUpDown,
} from 'lucide-react';
import { Category, Product, StockMovement } from '../types';
import { formatDateToISO, formatDateToDisplay } from '../utils/formatters';
import { DateRangePickerModal } from './DateRangePickerModal';
import { MovementRow } from './MovementRow';

interface HistoryRangeViewProps {
  movements: StockMovement[];
  categories: Category[];
  products: Product[];
  onEditMovement: (movement: StockMovement) => void;
  onDeleteMovement: (id: string) => Promise<void>;
  searchQuery: string;
}

export const HistoryRangeView: React.FC<HistoryRangeViewProps> = ({
  movements,
  categories,
  products,
  onEditMovement,
  onDeleteMovement,
  searchQuery,
}) => {
  // Varsayılan: Bu ayın ilk gününden bugüne
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return formatDateToISO(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState<string>(() => formatDateToISO(new Date()));
  const [isRangeModalOpen, setIsRangeModalOpen] = useState<boolean>(false);

  // Filtreler
  const [typeFilter, setTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'qty-desc' | 'qty-asc'>('date-desc');

  // Hızlı Hazır Aralıklar
  const setQuickRange = (preset: 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all') => {
    const today = new Date();
    const todayStr = formatDateToISO(today);

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'this_week') {
      const day = today.getDay();
      const diffToMon = (day + 6) % 7;
      const mon = new Date(today);
      mon.setDate(today.getDate() - diffToMon);
      setStartDate(formatDateToISO(mon));
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateToISO(first));
      setEndDate(todayStr);
    } else if (preset === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(formatDateToISO(first));
      setEndDate(formatDateToISO(last));
    } else if (preset === 'this_year') {
      const first = new Date(today.getFullYear(), 0, 1);
      setStartDate(formatDateToISO(first));
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('2020-01-01');
      setEndDate(todayStr);
    }
  };

  // Filtrelenmiş ve Sıralanmış Hareketler
  const filteredMovements = useMemo(() => {
    return movements
      .filter((m) => {
        // Tarih Aralığı
        if (startDate && m.date < startDate) return false;
        if (endDate && m.date > endDate) return false;

        // Tür Filtresi
        if (typeFilter !== 'all' && m.type !== typeFilter) return false;

        // Ürün Filtresi
        if (productFilter !== 'all' && m.productId !== productFilter) return false;

        // Kategori Filtresi
        if (categoryFilter !== 'all' && m.categoryId !== categoryFilter) return false;

        // Arama sorgusu
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const pName = m.productName?.toLowerCase() || '';
          const pCode = m.productCode?.toLowerCase() || '';
          const desc = m.description?.toLowerCase() || '';
          const note = m.extraDetailNote?.toLowerCase() || '';
          const catName = categories.find((c) => c.id === m.categoryId)?.name.toLowerCase() || '';

          return (
            pName.includes(q) ||
            pCode.includes(q) ||
            desc.includes(q) ||
            note.includes(q) ||
            catName.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'date-desc') {
          return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
        }
        if (sortOrder === 'date-asc') {
          return a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt);
        }
        if (sortOrder === 'qty-desc') {
          return b.quantity - a.quantity;
        }
        if (sortOrder === 'qty-asc') {
          return a.quantity - b.quantity;
        }
        return 0;
      });
  }, [
    movements,
    startDate,
    endDate,
    typeFilter,
    productFilter,
    categoryFilter,
    searchQuery,
    sortOrder,
    categories,
  ]);

  // Giriş / Çıkış Miktar İstatistikleri
  const summary = useMemo(() => {
    let inCount = 0;
    let outCount = 0;
    let totalKgIn = 0;
    let totalKgOut = 0;
    let totalAdetIn = 0;
    let totalAdetOut = 0;

    filteredMovements.forEach((m) => {
      if (m.type === 'in') {
        inCount++;
        if (m.unit === 'kg') totalKgIn += m.quantity;
        else totalAdetIn += m.quantity;
      } else {
        outCount++;
        if (m.unit === 'kg') totalKgOut += m.quantity;
        else totalAdetOut += m.quantity;
      }
    });

    return { inCount, outCount, totalKgIn, totalKgOut, totalAdetIn, totalAdetOut };
  }, [filteredMovements]);

  // CSV İndirme
  const handleExportCSV = () => {
    const rows = [
      ['STOK DEFTERİ - HAREKET RAPORU'],
      [`Tarih Aralığı: ${formatDateToDisplay(startDate)} - ${formatDateToDisplay(endDate)}`],
      [`Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}`],
      [''],
      ['Tarih', 'Tür', 'Ürün Adı', 'Stok Kodu', 'Miktar', 'Birim', 'Kategori', 'Açıklama', 'İrsaliye / Belge No'],
    ];

    filteredMovements.forEach((m) => {
      const cat = categories.find((c) => c.id === m.categoryId)?.name || '';
      rows.push([
        m.date,
        m.type === 'in' ? 'Giriş' : 'Çıkış',
        `"${(m.productName || '').replace(/"/g, '""')}"`,
        m.productCode || '',
        m.quantity.toString().replace('.', ','),
        m.unit,
        `"${cat.replace(/"/g, '""')}"`,
        `"${(m.description || '').replace(/"/g, '""')}"`,
        `"${(m.extraDetailNote || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Stok_Defteri_Rapor_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 text-slate-100">
      {/* 1. Üst Filtre & Tarih Şeridi */}
      <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Sol: Tarih Aralığı Seçici & Hazır Butonlar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsRangeModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-2xs transition-colors"
          >
            <CalendarRange className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {formatDateToDisplay(startDate)} — {formatDateToDisplay(endDate)}
            </span>
          </button>

          {/* Hızlı Preset Butonları */}
          <div className="hidden sm:flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-[11px] font-medium text-slate-300">
            <button onClick={() => setQuickRange('today')} className="px-2 py-1 rounded-md hover:bg-slate-700 transition-colors">
              Bugün
            </button>
            <button onClick={() => setQuickRange('this_week')} className="px-2 py-1 rounded-md hover:bg-slate-700 transition-colors">
              Bu Hafta
            </button>
            <button onClick={() => setQuickRange('this_month')} className="px-2 py-1 rounded-md hover:bg-slate-700 transition-colors">
              Bu Ay
            </button>
            <button onClick={() => setQuickRange('last_month')} className="px-2 py-1 rounded-md hover:bg-slate-700 transition-colors">
              Geçen Ay
            </button>
            <button onClick={() => setQuickRange('all')} className="px-2 py-1 rounded-md hover:bg-slate-700 transition-colors">
              Tümü
            </button>
          </div>
        </div>

        {/* Sağ: Dışa Aktar CSV */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            title="Excel uyumlu CSV İndir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV Dışa Aktar</span>
          </button>
        </div>
      </div>

      {/* 2. Filtre ve Sıralama Çubuğu */}
      <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
            <Filter className="w-3 h-3" />
            <span>Filtre:</span>
          </div>

          {/* Tür Filtresi */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                typeFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setTypeFilter('in')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                typeFilter === 'in'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Giriş
            </button>
            <button
              onClick={() => setTypeFilter('out')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                typeFilter === 'out'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Çıkış
            </button>
          </div>

          {/* Ürün Filtresi */}
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">Tüm Ürünler</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          {/* Kategori Filtresi */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sıralama */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
            <ArrowUpDown className="w-3 h-3" />
            <span>Sırala:</span>
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          >
            <option value="date-desc">Tarihe göre (Yeniden eskiye)</option>
            <option value="date-asc">Tarihe göre (Eskiden yeniye)</option>
            <option value="qty-desc">Miktara göre (Büyükten küçüğe)</option>
            <option value="qty-asc">Miktara göre (Küçükten büyüğe)</option>
          </select>
        </div>
      </div>

      {/* 3. Miktar Özet Kartları (Net TL Yerine Giriş / Çıkış Miktarları) */}
      <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Giriş Adedi
            </div>
            <div className="text-sm font-bold font-mono text-emerald-200">
              {summary.inCount} Hareket
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/50 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shrink-0 font-bold text-xs">
            ∑
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              Toplam Giren
            </div>
            <div className="text-xs font-bold font-mono text-emerald-200">
              {summary.totalAdetIn > 0 && `${summary.totalAdetIn} adet `}
              {summary.totalKgIn > 0 && `${summary.totalKgIn.toFixed(1)} kg`}
              {summary.totalAdetIn === 0 && summary.totalKgIn === 0 && '0'}
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900/60 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
              Çıkış Adedi
            </div>
            <div className="text-sm font-bold font-mono text-rose-200">
              {summary.outCount} Hareket
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-950 text-rose-400 border border-rose-800/60 flex items-center justify-center shrink-0 font-bold text-xs">
            ∑
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-rose-400">
              Toplam Çıkan
            </div>
            <div className="text-xs font-bold font-mono text-rose-200">
              {summary.totalAdetOut > 0 && `${summary.totalAdetOut} adet `}
              {summary.totalKgOut > 0 && `${summary.totalKgOut.toFixed(1)} kg`}
              {summary.totalAdetOut === 0 && summary.totalKgOut === 0 && '0'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filtrelenmiş Hareket Listesi */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
        {filteredMovements.length > 0 ? (
          <div>
            {filteredMovements.map((m) => {
              const cat = categories.find((c) => c.id === m.categoryId);
              const prod = products.find((p) => p.id === m.productId);
              return (
                <MovementRow
                  key={m.id}
                  movement={m}
                  category={cat}
                  product={prod}
                  onEdit={onEditMovement}
                  onDelete={onDeleteMovement}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3 text-slate-400 border border-slate-700">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Kayıtlı Hareket Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Seçili tarih aralığı veya filtre kriterlerine uyan stok hareketi bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Alt Bilgi */}
      <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Filtrelenen {filteredMovements.length} stok hareketi</span>
        <span className="font-medium text-slate-400">Stok Defteri Geçmişi</span>
      </div>

      {/* Tarih Aralığı Modal */}
      <DateRangePickerModal
        isOpen={isRangeModalOpen}
        onClose={() => setIsRangeModalOpen(false)}
        startDate={startDate}
        endDate={endDate}
        onApplyRange={(s, e) => {
          setStartDate(s);
          setEndDate(e);
        }}
      />
    </div>
  );
};
