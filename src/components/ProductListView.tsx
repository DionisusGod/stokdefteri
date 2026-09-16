import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';
import { Product, StockMovement } from '../types';
import { formatCurrency, formatQuantity } from '../utils/formatters';

interface ProductListViewProps {
  products: Product[];
  movements: StockMovement[];
  onOpenCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => Promise<void>;
  onSelectProductForMovement?: (product: Product) => void;
}

export const ProductListView: React.FC<ProductListViewProps> = ({
  products,
  movements,
  onOpenCreateProduct,
  onEditProduct,
  onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [coatingFilter, setCoatingFilter] = useState<'all' | 'coated' | 'uncoated'>('all');

  // Her ürünün mevcut stok miktarını hesapla (Girişler - Çıkışlar)
  const productStockMap = useMemo(() => {
    const map = new Map<string, { inQty: number; outQty: number; currentStock: number }>();

    products.forEach((p) => {
      map.set(p.id, { inQty: 0, outQty: 0, currentStock: 0 });
    });

    movements.forEach((m) => {
      if (m.productId && map.has(m.productId)) {
        const item = map.get(m.productId)!;
        if (m.type === 'in') {
          item.inQty += m.quantity;
          item.currentStock += m.quantity;
        } else {
          item.outQty += m.quantity;
          item.currentStock -= m.quantity;
        }
      }
    });

    return map;
  }, [products, movements]);

  // Filtreleme
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (coatingFilter === 'coated' && !p.isCoated) return false;
      if (coatingFilter === 'uncoated' && p.isCoated) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, coatingFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 text-slate-100">
      {/* Üst Başlık & Araç Çubuğu */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-950/60 text-blue-400 border border-blue-800/60 flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 leading-tight">
              Ürün Kataloğu & Stok Listesi
            </h2>
            <p className="text-xs text-slate-400">
              Kayıtlı ürünleri görüntüleyin, yeni ürün kartı tanımlayın veya düzenleyin
            </p>
          </div>
        </div>

        {/* Yeni Ürün Oluştur Butonu */}
        <button
          id="btn-create-product"
          onClick={onOpenCreateProduct}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Ürün Kartı Ekle</span>
        </button>
      </div>

      {/* Arama & Filtre Şeridi */}
      <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Ürün adı, stok kodu veya açıklamalarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          {/* Kaplama Filtresi */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0">
            <button
              onClick={() => setCoatingFilter('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                coatingFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setCoatingFilter('coated')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                coatingFilter === 'coated'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kaplanmış
            </button>
            <button
              onClick={() => setCoatingFilter('uncoated')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                coatingFilter === 'uncoated'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kaplanmamış
            </button>
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-medium">
          Toplam <strong>{filteredProducts.length}</strong> ürün listeleniyor
        </div>
      </div>

      {/* Ürün Kartları Tablosu / Listesi */}
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length > 0 ? (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-6">Stok Kodu</th>
                <th className="py-2.5 px-4">Ürün Adı</th>
                <th className="py-2.5 px-4">Kaplama Durumu</th>
                <th className="py-2.5 px-4 text-right">Birim Fiyat</th>
                <th className="py-2.5 px-4 text-right">Mevcut Stok</th>
                <th className="py-2.5 px-6 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900">
              {filteredProducts.map((p) => {
                const stock = productStockMap.get(p.id) || { currentStock: 0, inQty: 0, outQty: 0 };
                return (
                  <tr
                    key={p.id}
                    id={`product-row-${p.id}`}
                    onDoubleClick={() => onEditProduct(p)}
                    title="Düzenlemek için çift tıklayın"
                    className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  >
                    {/* Stok Kodu */}
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {p.code}
                      </span>
                    </td>

                    {/* Ürün Adı & Notlar */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100 text-xs">{p.name}</div>
                      {p.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.notes}</div>
                      )}
                    </td>

                    {/* Kaplama Durumu */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.isCoated ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/70">
                          <Layers className="w-3 h-3" />
                          Kaplanmış
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Kaplanmamış (Ham)
                        </span>
                      )}
                    </td>

                    {/* Fiyat */}
                    <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-300">
                      {p.price > 0 ? formatCurrency(p.price) : '—'}
                    </td>

                    {/* Mevcut Stok */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-semibold font-mono text-xs px-2 py-0.5 rounded-md border ${
                          stock.currentStock > 0
                            ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                            : stock.currentStock < 0
                            ? 'text-rose-400 bg-rose-950/60 border-rose-800/60'
                            : 'text-slate-400 bg-slate-800 border-slate-700'
                        }`}
                      >
                        {formatQuantity(stock.currentStock, p.defaultUnit || 'adet')}
                      </span>
                    </td>

                    {/* Aksiyonlar */}
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProduct(p);
                          }}
                          title="Ürünü Düzenle"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`'${p.name}' ürün kartını silmek istediğinizden emin misiniz?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          title="Ürünü Sil"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-3 text-slate-400 border border-slate-700">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Ürün Bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Arama kriterlerine uygun ürün yok veya henüz ürün kartı eklenmedi.
            </p>
            <button
              onClick={onOpenCreateProduct}
              className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              İlk Ürünü Ekle
            </button>
          </div>
        )}
      </div>

      {/* Tablo Alt Bilgi */}
      <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Kayıtlı {products.length} Ürün Kartı</span>
        <span className="font-medium text-slate-400">Stok Defteri Ürün Kataloğu</span>
      </div>
    </div>
  );
};
