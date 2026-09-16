import React, { useState, useEffect, useCallback } from 'react';
import { Inbox } from 'lucide-react';
import {
  ActiveView,
  Category,
  Product,
  StockMovement,
  StockMovementType,
  ToastState,
} from './types';
import { stockRepository } from './services/repository';
import { formatDateToISO } from './utils/formatters';

// Bileşenler
import { MacWindowChrome } from './components/MacWindowChrome';
import { DayNavigator } from './components/DayNavigator';
import { NewMovementBar } from './components/NewMovementBar';
import { MovementRow } from './components/MovementRow';
import { MovementEditSheet } from './components/MovementEditSheet';
import { HistoryRangeView } from './components/HistoryRangeView';
import { ProductListView } from './components/ProductListView';
import { ProductModal } from './components/ProductModal';
import { CategoryManageModal } from './components/CategoryManageModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ToastAlert } from './components/ToastAlert';

export function App() {
  // Navigation & View State
  const [activeView, setActiveView] = useState<ActiveView>('register');
  const [currentDate, setCurrentDate] = useState<string>(() => formatDateToISO(new Date()));
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modals & Sheets
  const [selectedMovementForEdit, setSelectedMovementForEdit] = useState<StockMovement | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState<boolean>(false);
  const [categoryManageType, setCategoryManageType] = useState<StockMovementType>('in');
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Toast bildirim tetikleyicisi
  const triggerToast = useCallback(
    (type: 'info' | 'alert' | 'success', message: string, title?: string) => {
      setToast({
        id: `toast-${Date.now()}`,
        type,
        title,
        message,
      });
    },
    []
  );

  // Verileri yükleme fonksiyonu
  const loadData = useCallback(async () => {
    try {
      const [allMovements, allProducts, allCats] = await Promise.all([
        stockRepository.getMovements(),
        stockRepository.getProducts(),
        stockRepository.getCategories(),
      ]);
      setMovements(allMovements);
      setProducts(allProducts);
      setCategories(allCats);
    } catch (e) {
      console.error('Veriler yüklenirken hata oluştu:', e);
      triggerToast('alert', 'Veriler yüklenirken bir problem oluştu.');
    }
  }, [triggerToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global macOS Klavye Kısayolları Dinleyicisi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInputFocused = targetTag === 'input' || targetTag === 'select' || targetTag === 'textarea';

      // ⌘ + / -> Kısayollar penceresi
      if (isCmdOrCtrl && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // Esc -> açık pencereleri veya aramayı kapat
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (isProductModalOpen) {
          setIsProductModalOpen(false);
          return;
        }
        if (isCategoryManageOpen) {
          setIsCategoryManageOpen(false);
          return;
        }
        if (selectedMovementForEdit) {
          setSelectedMovementForEdit(null);
          return;
        }
        if (searchQuery) {
          setSearchQuery('');
          return;
        }
        (e.target as HTMLElement)?.blur?.();
      }

      // ⌘ + 1 -> Stok Defteri (Günlük)
      if (isCmdOrCtrl && e.key === '1') {
        e.preventDefault();
        setActiveView('register');
        return;
      }

      // ⌘ + 2 -> Tarih Aralığı
      if (isCmdOrCtrl && e.key === '2') {
        e.preventDefault();
        setActiveView('history');
        return;
      }

      // ⌘ + 3 -> Ürün Listesi
      if (isCmdOrCtrl && e.key === '3') {
        e.preventDefault();
        setActiveView('products');
        return;
      }

      // ⌘ + K -> Arama kutusuna odaklan
      if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        searchInput?.focus();
        return;
      }

      // Input odakta değilse tek tuş kısayolları
      if (!isInputFocused) {
        // N -> Miktar alanına odaklan
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          const qtyInput = document.getElementById('input-quantity');
          qtyInput?.focus();
          return;
        }

        // P -> Yeni Ürün Oluştur Modalını Aç
        if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setSelectedProductForEdit(null);
          setIsProductModalOpen(true);
          return;
        }

        // G -> Giriş / Çıkış Geçişi
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          const inBtn = document.getElementById('type-in') as HTMLButtonElement;
          const outBtn = document.getElementById('type-out') as HTMLButtonElement;
          if (inBtn && outBtn) {
            if (inBtn.classList.contains('bg-emerald-600')) {
              outBtn.click();
            } else {
              inBtn.click();
            }
          }
          return;
        }

        // T -> Bugünün Tarihine Git
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          setCurrentDate(formatDateToISO(new Date()));
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isProductModalOpen, isCategoryManageOpen, selectedMovementForEdit, searchQuery]);

  // --- STOK HAREKETLERİ AKSİYONLARI ---
  const handleAddMovement = async (data: {
    type: StockMovementType;
    productId?: string;
    productName?: string;
    productCode?: string;
    categoryId: string;
    quantity: number;
    unit: 'adet' | 'kg';
    date: string;
    description?: string;
    extraDetailNote?: string;
    attachedFiles: any[];
  }) => {
    try {
      await stockRepository.createMovement(data);
      await loadData();
      triggerToast(
        'success',
        `${data.type === 'in' ? 'Giriş' : 'Çıkış'} hareketi başarıyla kaydedildi.`
      );
    } catch (e) {
      console.error(e);
      triggerToast('alert', 'Stok hareketi kaydedilemedi.');
    }
  };

  const handleUpdateMovement = async (id: string, updates: Partial<StockMovement>) => {
    try {
      const { logged } = await stockRepository.updateMovement(id, updates);
      await loadData();
      if (logged) {
        triggerToast('success', 'Stok hareketi güncellendi ve denetim günlüğüne kaydedildi.');
      } else {
        triggerToast('info', 'Değişiklik kaydedildi.');
      }
    } catch (e) {
      console.error(e);
      triggerToast('alert', 'Güncelleme sırasında hata oluştu.');
    }
  };

  const handleDeleteMovement = async (id: string) => {
    try {
      await stockRepository.deleteMovement(id);
      await loadData();
      triggerToast('info', 'Stok hareketi silindi.');
    } catch (e) {
      console.error(e);
      triggerToast('alert', 'Silme işlemi başarısız.');
    }
  };

  // --- ÜRÜN İŞLEMLERİ (CRUD) ---
  const handleSaveProduct = async (
    data: Omit<Product, 'id' | 'createdAt'>,
    id?: string
  ) => {
    try {
      if (id) {
        await stockRepository.updateProduct(id, data);
        triggerToast('success', `'${data.name}' ürünü başarıyla güncellendi.`);
      } else {
        await stockRepository.createProduct(data);
        triggerToast('success', `'${data.name}' ürün kartı başarıyla oluşturuldu.`);
      }
      await loadData();
    } catch (e) {
      console.error(e);
      triggerToast('alert', 'Ürün kaydedilirken bir hata meydana geldi.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await stockRepository.deleteProduct(id);
      await loadData();
      triggerToast('info', 'Ürün kaydı silindi.');
    } catch (e) {
      console.error(e);
      triggerToast('alert', 'Ürün silinemedi.');
    }
  };

  // --- KATEGORİ İŞLEMLERİ ---
  const handleAddCategory = async (cat: Omit<Category, 'id'>) => {
    const created = await stockRepository.addCategory(cat);
    await loadData();
    triggerToast('success', `'${cat.name}' kategorisi eklendi.`);
    return created;
  };

  const handleUpdateCategory = async (id: string, updates: Partial<Omit<Category, 'id'>>) => {
    const updated = await stockRepository.updateCategory(id, updates);
    await loadData();
    triggerToast('success', 'Kategori güncellendi.');
    return updated;
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await stockRepository.deleteCategory(id);
    if (res) {
      await loadData();
      triggerToast('info', 'Kategori silindi.');
    }
    return res;
  };

  // Günlük Hareketler ve Filtreleme
  const dayMovements = movements.filter((m) => {
    if (m.date !== currentDate) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pName = m.productName?.toLowerCase() || '';
      const pCode = m.productCode?.toLowerCase() || '';
      const desc = m.description?.toLowerCase() || '';
      const extra = m.extraDetailNote?.toLowerCase() || '';
      return pName.includes(q) || pCode.includes(q) || desc.includes(q) || extra.includes(q);
    }
    return true;
  });

  const dayInCount = dayMovements.filter((m) => m.type === 'in').length;
  const dayOutCount = dayMovements.filter((m) => m.type === 'out').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-0 sm:p-4 text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Bildirimi */}
      <ToastAlert toast={toast} onClose={() => setToast(null)} />

      {/* macOS Window Frame Konteyneri */}
      <main className="w-full max-w-6xl h-screen sm:h-[95vh] max-h-[960px] bg-slate-900 sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] border border-slate-800 sm:ring-1 sm:ring-white/10 flex flex-col overflow-hidden relative">
        {/* macOS Window Header & Toolbar */}
        <MacWindowChrome
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenCreateProduct={() => {
            setSelectedProductForEdit(null);
            setIsProductModalOpen(true);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 1. GÖRÜNÜM: Günlük Stok Defteri */}
        {activeView === 'register' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
            {/* Gün Navigasyonu */}
            <DayNavigator
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              dayInCount={dayInCount}
              dayOutCount={dayOutCount}
            />

            {/* Yeni Stok Hareketi Ekleme Satırı */}
            <NewMovementBar
              currentDate={currentDate}
              categories={categories}
              products={products}
              onAddMovement={handleAddMovement}
              onAddCategory={handleAddCategory}
              onOpenManageCategories={(type) => {
                setCategoryManageType(type);
                setIsCategoryManageOpen(true);
              }}
              onOpenCreateProduct={() => {
                setSelectedProductForEdit(null);
                setIsProductModalOpen(true);
              }}
            />

            {/* Günlük Stok Hareketi Listesi */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 bg-slate-900">
              {dayMovements.length > 0 ? (
                <div>
                  {dayMovements.map((mov) => {
                    const cat = categories.find((c) => c.id === mov.categoryId);
                    const prod = products.find((p) => p.id === mov.productId);
                    return (
                      <MovementRow
                        key={mov.id}
                        movement={mov}
                        category={cat}
                        product={prod}
                        onEdit={(m) => setSelectedMovementForEdit(m)}
                        onDelete={handleDeleteMovement}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3 text-slate-400 border border-slate-700">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    {searchQuery ? 'Arama kriterine uygun hareket bulunamadı' : 'Bu tarihte kayıtlı stok hareketi yok'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    {searchQuery
                      ? 'Farklı bir arama terimi deneyin.'
                      : 'Yukarıdaki hızlı kayıt panelinden bu güne ait yeni bir giriş veya çıkış ekleyebilirsiniz.'}
                  </p>
                </div>
              )}
            </div>

            {/* Liste Alt Bilgi */}
            <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Toplam {dayMovements.length} hareket</span>
              <span className="font-medium text-slate-400">Stok Defteri</span>
            </div>
          </div>
        )}

        {/* 2. GÖRÜNÜM: Tarih Aralığı (Filtreli Hareket Listesi) */}
        {activeView === 'history' && (
          <HistoryRangeView
            movements={movements}
            categories={categories}
            products={products}
            onEditMovement={(m) => setSelectedMovementForEdit(m)}
            onDeleteMovement={handleDeleteMovement}
            searchQuery={searchQuery}
          />
        )}

        {/* 3. GÖRÜNÜM: Ürün Listesi & Kataloğu (Dashboard Yerine) */}
        {activeView === 'products' && (
          <ProductListView
            products={products}
            movements={movements}
            onOpenCreateProduct={() => {
              setSelectedProductForEdit(null);
              setIsProductModalOpen(true);
            }}
            onEditProduct={(p) => {
              setSelectedProductForEdit(p);
              setIsProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
          />
        )}
      </main>

      {/* MODALLAR */}

      {/* 1. Ürün Oluşturma & Düzenleme Modal Popupu */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProductForEdit(null);
        }}
        productToEdit={selectedProductForEdit}
        onSave={handleSaveProduct}
      />

      {/* 2. Stok Hareketi Düzenleme Yan Paneli (Audit Log Korumalı) */}
      <MovementEditSheet
        movement={selectedMovementForEdit}
        categories={categories}
        products={products}
        isOpen={!!selectedMovementForEdit}
        onClose={() => setSelectedMovementForEdit(null)}
        onSave={handleUpdateMovement}
        onDelete={handleDeleteMovement}
      />

      {/* 3. Kategori / Hareket Sebebi Yönetimi Modalı */}
      <CategoryManageModal
        isOpen={isCategoryManageOpen}
        onClose={() => setIsCategoryManageOpen(false)}
        categories={categories}
        initialType={categoryManageType}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* 4. macOS Klavye Kısayolları Modalı */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

export default App;
