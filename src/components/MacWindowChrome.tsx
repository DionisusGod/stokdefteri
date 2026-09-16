import React, { useState } from 'react';
import {
  Boxes,
  Calendar,
  CalendarRange,
  Package,
  Search,
  Command,
  Plus
} from 'lucide-react';
import { ActiveView } from '../types';

interface MacWindowChromeProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onOpenShortcuts: () => void;
  onOpenCreateProduct: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const MacWindowChrome: React.FC<MacWindowChromeProps> = ({
  activeView,
  onViewChange,
  onOpenShortcuts,
  onOpenCreateProduct,
  searchQuery,
  onSearchChange,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="relative flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 select-none">
      {/* Sol: Uygulama Başlığı & Rozeti (Trafik ışıkları kullanıcı isteğiyle kaldırıldı) */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Boxes className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-slate-100 tracking-tight">
            Stok Defteri
          </h1>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">
            v2.0
          </span>
        </div>
      </div>

      {/* Segmented Control: Günlük Stok / Tarih Aralığı / Ürün Listesi */}
      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
        <button
          id="btn-view-register"
          onClick={() => onViewChange('register')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeView === 'register'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700/70'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Günlük Stok</span>
        </button>

        <button
          id="btn-view-history"
          onClick={() => onViewChange('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeView === 'history'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700/70'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Tarih Aralığı</span>
        </button>

        <button
          id="btn-view-products"
          onClick={() => onViewChange('products')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeView === 'products'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700/70'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Ürün Listesi</span>
        </button>
      </div>

      {/* Sağ Taraf: Hızlı Arama & Kısayollar & Yeni Ürün Butonu */}
      <div className="flex items-center gap-2">
        {/* Arama Alanı */}
        <div
          className={`relative transition-all duration-200 ${
            isSearchFocused ? 'w-44 sm:w-56' : 'w-32 sm:w-44'
          }`}
        >
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="global-search-input"
            placeholder="Ara... (⌘K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full text-xs pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Yeni Ürün Hızlı Ekle Butonu */}
        <button
          onClick={onOpenCreateProduct}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition-colors shadow-2xs"
          title="Yeni Ürün Kartı Tanımla (P)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ürün Ekle</span>
        </button>

        {/* Klavye Kısayolları Butonu */}
        <button
          id="btn-shortcuts-guide"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors border border-slate-800 shadow-2xs"
          title="Klavye Kısayolları Rehberi (⌘ + /)"
        >
          <Command className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
