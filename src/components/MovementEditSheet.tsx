import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  Trash2,
  Paperclip,
  History,
  Calendar,
  Layers,
  Package,
  FileText
} from 'lucide-react';
import { AttachedFile, Category, Product, StockMovement, StockMovementType, StockUnit } from '../types';
import { AuditLogModal } from './AuditLogModal';

interface MovementEditSheetProps {
  movement: StockMovement | null;
  categories: Category[];
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<StockMovement>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MovementEditSheet: React.FC<MovementEditSheetProps> = ({
  movement,
  categories,
  products,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<StockMovementType>('in');
  const [productId, setProductId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [quantityStr, setQuantityStr] = useState<string>('');
  const [unit, setUnit] = useState<StockUnit>('adet');
  const [date, setDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [extraDetailNote, setExtraDetailNote] = useState<string>('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (movement) {
      setType(movement.type);
      setProductId(movement.productId || '');
      setCategoryId(movement.categoryId);
      setQuantityStr(movement.quantity.toString());
      setUnit(movement.unit || 'adet');
      setDate(movement.date);
      setDescription(movement.description || '');
      setExtraDetailNote(movement.extraDetailNote || '');
      setAttachedFiles(movement.attachedFiles || []);
    }
  }, [movement]);

  if (!isOpen || !movement) return null;

  const filteredCategories = categories.filter((c) => c.type === type || c.type === 'both');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newFile: AttachedFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type || 'document',
      uploadedAt: new Date().toISOString(),
    };

    setAttachedFiles((prev) => [...prev, newFile]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQty = parseFloat(quantityStr.replace(',', '.'));
    if (isNaN(cleanQty) || cleanQty <= 0) return;

    const selectedProduct = products.find((p) => p.id === productId);

    setIsSaving(true);
    try {
      await onSave(movement.id, {
        type,
        productId: selectedProduct?.id || undefined,
        productName: selectedProduct?.name || undefined,
        productCode: selectedProduct?.code || undefined,
        categoryId,
        quantity: cleanQty,
        unit,
        date,
        description: description.trim() || undefined,
        extraDetailNote: extraDetailNote.trim() || undefined,
        attachedFiles,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bu stok hareketini kalıcı olarak silmek istediğinizden emin misiniz?')) {
      await onDelete(movement.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-2xs flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-slate-900 h-full shadow-2xl border-l border-slate-800 flex flex-col z-40 text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Stok Hareketini Düzenle
              </h3>
              <p className="text-[11px] text-slate-400">
                ID: {movement.id.substring(0, 15)}...
              </p>
            </div>
            <div className="flex items-center gap-1">
              {movement.auditLogs && movement.auditLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAuditModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
                  title="Değişiklik Günlüğü (Audit Logs)"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Geçmiş ({movement.auditLogs.length})</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Hareket Türü (Giriş / Çıkış) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Hareket Türü
              </label>
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('in')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    type === 'in'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Giriş (+)
                </button>
                <button
                  type="button"
                  onClick={() => setType('out')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    type === 'out'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Çıkış (-)
                </button>
              </div>
            </div>

            {/* Ürün Seçimi */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ürün Kaydı
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    const p = products.find((pr) => pr.id === e.target.value);
                    if (p && p.defaultUnit) setUnit(p.defaultUnit);
                  }}
                  className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="">— Ürün Seçilmedi —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} {p.isCoated ? '(Kaplı)' : '(Ham)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Miktar & Birim (Adet / Kg) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Miktar ve Birim
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quantityStr}
                  onChange={(e) => setQuantityStr(e.target.value)}
                  className="flex-1 text-xs font-semibold px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                  required
                />
                <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setUnit('adet')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
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
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      unit === 'kg'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Kg
                  </button>
                </div>
              </div>
            </div>

            {/* Kategori */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Kategori / Hareket Sebebi
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tarih */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Tarih
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
                required
              />
            </div>

            {/* İrsaliye / Belge / İş Emri No */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                İrsaliye / Parti / İş Emri No
              </label>
              <input
                type="text"
                value={extraDetailNote}
                onChange={(e) => setExtraDetailNote(e.target.value)}
                placeholder="Örn: İrsaliye No: 2026-8812"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
              />
            </div>

            {/* Açıklama */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Açıklama
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Stok hareketi açıklaması..."
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>

            {/* Ekli Belgeler */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Ekli Belgeler ({attachedFiles.length})
                </label>
                <label className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Dosya Ekle</span>
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
                <div className="space-y-1.5">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                    >
                      <span className="truncate max-w-[240px] font-medium text-slate-300">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Ekli belge bulunmuyor.</p>
              )}
            </div>

            {/* Alt Butonlar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hareketi Sil</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs transition-colors disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Kaydediliyor...' : 'Kaydet'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Audit Log Modal (Geçmiş Değişiklikler) */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        auditLogs={movement.auditLogs || []}
      />
    </>
  );
};
