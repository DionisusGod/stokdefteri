import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Command, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Genel' | 'Navigasyon' | 'İşlemler';
}

const shortcuts: ShortcutItem[] = [
  { keys: ['⌘', '1'], description: 'Stok Defteri (Günlük Hareketler) Görünümüne Geç', category: 'Genel' },
  { keys: ['⌘', '2'], description: 'Tarih Aralığı (Filtreli Liste) Görünümüne Geç', category: 'Genel' },
  { keys: ['⌘', '3'], description: 'Ürün Listesi & Kataloğu Görünümüne Geç', category: 'Genel' },
  { keys: ['⌘', 'K'], description: 'Ürünlerde ve Hareketlerde Hızlı Arama Yap', category: 'Genel' },
  { keys: ['⌘', '/'], description: 'Klavye Kısayolları Rehberini Aç/Kapat', category: 'Genel' },
  { keys: ['N'], description: 'Yeni Stok Hareketi Giriş Alanına Odaklan', category: 'İşlemler' },
  { keys: ['G'], description: 'Giriş / Çıkış Türü Arasında Geçiş Yap', category: 'İşlemler' },
  { keys: ['P'], description: 'Yeni Ürün Kartı Tanımlama Penceresini Aç', category: 'İşlemler' },
  { keys: ['T'], description: 'Bugünün Tarihine Git', category: 'Navigasyon' },
  { keys: ['←', '→'], description: '1 Gün Geri / İleri Git', category: 'Navigasyon' },
  { keys: ['⇧', '← / →'], description: '7 Gün (1 Hafta) Geri / İleri Git', category: 'Navigasyon' },
  { keys: ['Esc'], description: 'Açık Pencereleri / Aramayı Kapat', category: 'Genel' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-semibold">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                macOS Klavye Kısayolları
              </h3>
              <p className="text-[11px] text-slate-400">
                Stok hareketlerini ve ürünleri klavyenizden ışık hızında yönetin
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

        {/* Shortcuts list grouped */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4">
          {(['Genel', 'İşlemler', 'Navigasyon'] as const).map((cat) => {
            const items = shortcuts.filter((s) => s.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  {cat}
                </h4>
                <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="text-slate-300 font-medium">
                        {item.description}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 ml-3">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Kapatmak için <kbd className="font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-200">Esc</kbd> tuşuna basın</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 font-semibold transition-colors border border-slate-700"
          >
            Anladım
          </button>
        </div>
      </motion.div>
    </div>
  );
};
