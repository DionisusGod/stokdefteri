import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Tag, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Category, StockMovementType } from '../types';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialType?: StockMovementType;
  onAddCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  onUpdateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => Promise<Category>;
  onDeleteCategory: (id: string) => Promise<boolean>;
}

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialType = 'in',
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [activeTab, setActiveTab] = useState<StockMovementType>(initialType);
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const currentCategories = categories.filter((c) => c.type === activeTab || c.type === 'both');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await onAddCategory({
      name: newCatName.trim(),
      type: activeTab,
      color: activeTab === 'in' ? '#10b981' : '#ef4444',
      isDefault: false,
    });
    setNewCatName('');
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    await onUpdateCategory(id, { name: editingName.trim() });
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`'${name}' kategorisini silmek istediğinizden emin misiniz?`)) {
      await onDeleteCategory(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-semibold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Stok Hareket Sebepleri / Kategoriler
              </h3>
              <p className="text-[11px] text-slate-400">
                Giriş ve Çıkış nedenlerini özelleştirin
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

        {/* Tab Seçimi (Giriş / Çıkış) */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('in')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'in'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Giriş Sebepleri ({categories.filter((c) => c.type === 'in').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('out')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'out'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Çıkış Sebepleri ({categories.filter((c) => c.type === 'out').length})
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto max-h-64 p-4 space-y-1.5">
          {currentCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-3 py-2 bg-slate-950 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-xs transition-colors"
            >
              {editingId === cat.id ? (
                <div className="flex items-center gap-1.5 flex-1 mr-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40 text-xs"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(cat.id)}
                    className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="p-1 text-slate-400 hover:bg-slate-800 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="font-semibold text-slate-200">{cat.name}</span>
              )}

              {editingId !== cat.id && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="p-1 text-slate-400 hover:text-blue-400 rounded-md hover:bg-slate-800"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Yeni Kategori Ekle Formu */}
        <form onSubmit={handleAdd} className="p-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Yeni ${activeTab === 'in' ? 'Giriş' : 'Çıkış'} sebebi...`}
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
          />
          <button
            type="submit"
            disabled={!newCatName.trim()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ekle</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
