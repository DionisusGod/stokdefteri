import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, X, Check, Tag, DollarSign, Layers } from 'lucide-react';
import { Product, StockUnit } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (data: Omit<Product, 'id' | 'createdAt'>, id?: string) => Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [isCoated, setIsCoated] = useState(false);
  const [defaultUnit, setDefaultUnit] = useState<StockUnit>('adet');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCode(productToEdit.code);
      setPriceStr(productToEdit.price.toString());
      setIsCoated(productToEdit.isCoated);
      setDefaultUnit(productToEdit.defaultUnit || 'adet');
      setNotes(productToEdit.notes || '');
    } else {
      setName('');
      setCode('');
      setPriceStr('');
      setIsCoated(false);
      setDefaultUnit('adet');
      setNotes('');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const price = parseFloat(priceStr.replace(',', '.')) || 0;

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          price,
          isCoated,
          defaultUnit,
          notes: notes.trim() || undefined,
        },
        productToEdit?.id
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col text-slate-100"
      >
        {/* Header with macOS styling */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-semibold">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                {productToEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Kartı Tanımla'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Ürün adı, stok kodu, fiyatı ve kaplama durumu
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

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Ürün Adı */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Ürün Adı <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              id="input-product-name"
              placeholder="Örn: M8x40 İmbus Civata, Alüminyum Profil..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
              required
              autoFocus
            />
          </div>

          {/* 2. Ürün Stok Kodu & Fiyatı */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Stok Kodu <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  id="input-product-code"
                  placeholder="STK-001"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs font-mono font-medium pl-8 pr-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Birim Fiyatı (₺)
              </label>
              <div className="relative">
                <span className="text-xs font-bold text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  ₺
                </span>
                <input
                  type="text"
                  id="input-product-price"
                  placeholder="0,00"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  className="w-full text-xs font-semibold pl-7 pr-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
                />
              </div>
            </div>
          </div>

          {/* 3. Kaplanmış / Kaplanmamış Durumu */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Kaplama Durumu
            </label>
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                id="btn-coated-true"
                onClick={() => setIsCoated(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  isCoated
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Kaplanmış</span>
              </button>
              <button
                type="button"
                id="btn-coated-false"
                onClick={() => setIsCoated(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  !isCoated
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Kaplanmamış (Ham)</span>
              </button>
            </div>
          </div>

          {/* 4. Varsayılan Birim (kg / adet) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Standart Birim
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDefaultUnit('adet')}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  defaultUnit === 'adet'
                    ? 'bg-blue-600/25 border-blue-500/60 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                Adet
              </button>
              <button
                type="button"
                onClick={() => setDefaultUnit('kg')}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  defaultUnit === 'kg'
                    ? 'bg-blue-600/25 border-blue-500/60 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                Kilogram (Kg)
              </button>
            </div>
          </div>

          {/* 5. Notlar (Opsiyonel) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Açıklama & Teknik Notlar (Opsiyonel)
            </label>
            <textarea
              rows={2}
              placeholder="Örn: 304 kalite paslanmaz, DIN 912 normunda..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !code.trim()}
              className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{productToEdit ? 'Değişiklikleri Kaydet' : 'Ürünü Kaydet'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
