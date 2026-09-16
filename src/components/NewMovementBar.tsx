import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Paperclip,
  Check,
  ChevronDown,
  X,
  Package,
  FileText
} from 'lucide-react';
import { AttachedFile, Category, Product, StockMovementType, StockUnit } from '../types';
import { formatDateToISO } from '../utils/formatters';

interface NewMovementBarProps {
  currentDate: string; // YYYY-MM-DD
  categories: Category[];
  products: Product[];
  onAddMovement: (data: {
    type: StockMovementType;
    productId?: string;
    productName?: string;
    productCode?: string;
    categoryId: string;
    quantity: number;
    unit: StockUnit;
    date: string;
    description?: string;
    extraDetailNote?: string;
    attachedFiles: AttachedFile[];
  }) => Promise<void>;
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  onOpenManageCategories?: (type: StockMovementType) => void;
  onOpenCreateProduct?: () => void;
}

export const NewMovementBar: React.FC<NewMovementBarProps> = ({
  currentDate,
  categories,
  products,
  onAddMovement,
  onAddCategory,
  onOpenManageCategories,
  onOpenCreateProduct,
}) => {
  const todayISO = formatDateToISO(new Date());
  const isViewingToday = currentDate === todayISO;

  // Form State
  const [isOpen, setIsOpen] = useState(true);
  const [type, setType] = useState<StockMovementType>('in'); // Giriş (in) / Çıkış (out)
  const [productId, setProductId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [quantityStr, setQuantityStr] = useState<string>('');
  const [unit, setUnit] = useState<StockUnit>('adet'); // kg / adet
  const [customDate, setCustomDate] = useState<string>(currentDate);
  const [description, setDescription] = useState<string>('');

  // "+" Hover Popover State (Detay Notu + Dosya Ekleme)
  const [isRowHovered, setIsRowHovered] = useState(false);
  const [isPlusPopoverOpen, setIsPlusPopoverOpen] = useState(false);
  const [extraDetailNote, setExtraDetailNote] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Hızlı Kategori Ekleme
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Tarih senkronizasyonu
  useEffect(() => {
    setCustomDate(currentDate);
  }, [currentDate]);

  // Ürün seçildiğinde o ürünün varsayılan birimini ayarla
  const handleProductSelect = (selectedId: string) => {
    if (selectedId === '__create_new_product__') {
      if (onOpenCreateProduct) onOpenCreateProduct();
      return;
    }
    setProductId(selectedId);
    const prod = products.find((p) => p.id === selectedId);
    if (prod && prod.defaultUnit) {
      setUnit(prod.defaultUnit);
    }
  };

  // Kategorileri türe göre filtrele
  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  // Varsayılan kategoriyi ayarla
  useEffect(() => {
    if (filteredCategories.length > 0 && (!categoryId || !filteredCategories.some((c) => c.id === categoryId))) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, categories]);

  // Dışa tıklama popover kapatma
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsPlusPopoverOpen(false);
      }
    };
    if (isPlusPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlusPopoverOpen]);

  // Dosya Yükleme (Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const newFile: AttachedFile = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'document',
        uploadedAt: new Date().toISOString(),
      };
      setAttachedFiles((prev) => [...prev, newFile]);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleQuickAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await onAddCategory({
        name: newCatName.trim(),
        type: type,
        color: type === 'in' ? 'emerald' : 'rose',
      });
      setCategoryId(created.id);
      setNewCatName('');
      setIsAddingNewCat(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQty = parseFloat(quantityStr.replace(',', '.'));
    if (isNaN(cleanQty) || cleanQty <= 0) return;
    if (!categoryId) return;

    const selectedProduct = products.find((p) => p.id === productId);
    const movDate = isViewingToday ? todayISO : customDate;

    await onAddMovement({
      type,
      productId: selectedProduct?.id || undefined,
      productName: selectedProduct?.name || undefined,
      productCode: selectedProduct?.code || undefined,
      categoryId,
      quantity: cleanQty,
      unit,
      date: movDate,
      description: description.trim() || undefined,
      extraDetailNote: extraDetailNote.trim() || undefined,
      attachedFiles,
    });

    // Formu temizle
    setQuantityStr('');
    setDescription('');
    setExtraDetailNote('');
    setAttachedFiles([]);
    setIsPlusPopoverOpen(false);
  };

  return (
    <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Hızlı Stok Hareketi Girişi
          </span>
        </div>

        <button
          id="btn-toggle-new-movement"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border shadow-xs ${
            isOpen
              ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
          <span>{isOpen ? 'Girişi Kapat' : 'Yeni Stok Hareketi'}</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="overflow-visible"
          >
            <div
              id="new-movement-row"
              onMouseEnter={() => setIsRowHovered(true)}
              onMouseLeave={() => setIsRowHovered(false)}
              className="group relative flex flex-wrap lg:flex-nowrap items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800 shadow-inner hover:border-slate-700 transition-colors"
            >
              {/* 1) TÜR SEÇİMİ (Giriş / Çıkış) */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                <button
                  type="button"
                  id="type-in"
                  onClick={() => setType('in')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    type === 'in'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Giriş (+)
                </button>
                <button
                  type="button"
                  id="type-out"
                  onClick={() => setType('out')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    type === 'out'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Çıkış (-)
                </button>
              </div>

              {/* 2) ÜRÜN SEÇİMİ (Daha önceden tanımlanmış ürün kayıtlarından seçilir) */}
              <div className="relative min-w-[170px] max-w-[230px] flex-1">
                <div className="relative">
                  <Package className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="select-product"
                    value={productId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full text-xs font-medium pl-8 pr-7 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-300">— Ürün Seçin (İsteğe bağlı) —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                        {p.code} - {p.name} {p.isCoated ? '(Kaplı)' : '(Ham)'}
                      </option>
                    ))}
                    <option value="__create_new_product__" className="bg-slate-900 text-blue-400 font-semibold">+ Yeni Ürün Kartı Tanımla...</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 3) KATEGORİ (Giriş / Çıkış Sebebi) */}
              <div className="relative min-w-[140px] max-w-[190px] flex-1">
                <select
                  id="select-category"
                  value={categoryId}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingNewCat(true);
                    } else if (e.target.value === '__manage_cats__') {
                      if (onOpenManageCategories) onOpenManageCategories(type);
                    } else {
                      setCategoryId(e.target.value);
                    }
                  }}
                  className="w-full text-xs font-medium pl-2.5 pr-7 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.name}
                    </option>
                  ))}
                  <option value="__add_new__" className="bg-slate-900 text-blue-400 font-semibold">+ Yeni Kategori Ekle...</option>
                  <option value="__manage_cats__" className="bg-slate-900 text-slate-400">⚙️ Kategorileri Düzenle / Sil...</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Hızlı Kategori Ekleme Popover */}
              {isAddingNewCat && (
                <div className="absolute top-full left-48 mt-2 z-50 p-3 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-64">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">
                      Yeni Kategori ({type === 'in' ? 'Giriş' : 'Çıkış'})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(false)}
                      className="text-slate-400 hover:text-slate-200 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Kategori Adı..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-md mb-2 text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(false)}
                      className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddCategory}
                      className="px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              )}

              {/* 4) MİKTAR & BİRİM SEÇİMİ (KG VEYA ADET) */}
              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  id="input-quantity"
                  placeholder="Miktar"
                  value={quantityStr}
                  onChange={(e) => setQuantityStr(e.target.value)}
                  className="w-24 text-xs font-semibold px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 text-center"
                  required
                />
                <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUnit('adet')}
                    className={`px-2 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                      unit === 'adet'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Adet
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('kg')}
                    className={`px-2 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                      unit === 'kg'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Kg
                  </button>
                </div>
              </div>

              {/* 5) TARİH: Görüntülenen gün bugünden farklı ise görünür */}
              {!isViewingToday && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative shrink-0"
                >
                  <input
                    type="date"
                    id="input-custom-date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="text-xs font-medium px-2.5 py-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                    title="Görüntülenen gün bugünden farklı olduğu için tarih seçicisi aktiftir"
                  />
                </motion.div>
              )}

              {/* 6) AÇIKLAMA (Opsiyonel) */}
              <div className="relative flex-1 min-w-[130px]">
                <input
                  type="text"
                  id="input-description"
                  placeholder="Açıklama (İrsaliye, cari, sipariş no...)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* 7) "+" MENÜSÜ: Mouse imleci satırın üzerine geldiğinde (onHover) görünür */}
              <div className="relative shrink-0">
                <div
                  className={`transition-opacity duration-200 ${
                    isRowHovered || isPlusPopoverOpen || attachedFiles.length > 0 || extraDetailNote
                      ? 'opacity-100 pointer-events-auto'
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <button
                    type="button"
                    id="btn-plus-extra-details"
                    onClick={() => setIsPlusPopoverOpen(!isPlusPopoverOpen)}
                    className={`relative p-2 rounded-lg border transition-all ${
                      isPlusPopoverOpen || attachedFiles.length > 0 || extraDetailNote
                        ? 'bg-blue-900/40 border-blue-600/60 text-blue-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    title="İrsaliye / Belge No ve Dosya Ekleme (+ Menüsü)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {(attachedFiles.length > 0 || extraDetailNote) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
                    )}
                  </button>
                </div>

                {/* "+" Popover: Belge / İrsaliye No + Dosya Ekleme */}
                <AnimatePresence>
                  {isPlusPopoverOpen && (
                    <motion.div
                      ref={popoverRef}
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 p-4 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 z-50 text-slate-100"
                    >
                      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span>İrsaliye & Ekli Belgeler</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPlusPopoverOpen(false)}
                          className="text-slate-400 hover:text-slate-200 text-xs"
                        >
                          ✕
                        </button>
                      </div>

                      {/* İrsaliye / Sevk Notu */}
                      <div className="mb-3">
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">
                          İrsaliye / Parti / İş Emri No
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: İrsaliye No: 2026-994, Kantar Fişi..."
                          value={extraDetailNote}
                          onChange={(e) => setExtraDetailNote(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      {/* Dosya Ekleme */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-medium text-slate-400">
                            Ekli Belgeler (İrsaliye, Sertifika, PDF)
                          </label>
                          <label className="cursor-pointer text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
                            <Paperclip className="w-3 h-3" />
                            <span>Dosya Seç</span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              onChange={handleFileUpload}
                              className="sr-only"
                              accept="image/*,application/pdf"
                            />
                          </label>
                        </div>

                        {attachedFiles.length > 0 ? (
                          <div className="space-y-1.5 max-h-24 overflow-y-auto">
                            {attachedFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-md border border-slate-800 text-xs"
                              >
                                <span className="truncate max-w-[180px] font-medium text-slate-300">
                                  {file.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFile(file.id)}
                                  className="text-rose-400 hover:text-rose-300 p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">Henüz belge eklenmedi.</p>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsPlusPopoverOpen(false)}
                          className="px-3 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-md"
                        >
                          Tamam
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* KAYDET BUTONU */}
              <button
                type="submit"
                id="btn-submit-movement"
                disabled={!quantityStr || !categoryId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kaydet</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
