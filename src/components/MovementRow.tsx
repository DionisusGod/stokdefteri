import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Layers,
  History,
  Trash2,
  Edit2,
  Paperclip,
} from 'lucide-react';
import { Category, Product, StockMovement } from '../types';
import { formatDisplayDate, formatQuantity, formatTimeFromISO } from '../utils/formatters';

interface MovementRowProps {
  movement: StockMovement;
  category?: Category;
  product?: Product;
  onEdit: (mov: StockMovement) => void;
  onDelete: (id: string) => void;
}

export const MovementRow: React.FC<MovementRowProps> = ({
  movement,
  category,
  product,
  onEdit,
  onDelete,
}) => {
  const isIn = movement.type === 'in';
  const hasAuditLogs = movement.auditLogs && movement.auditLogs.length > 0;
  const hasFiles = movement.attachedFiles && movement.attachedFiles.length > 0;
  const { formattedDate } = formatDisplayDate(movement.date);
  const timeStr = formatTimeFromISO(movement.createdAt);

  return (
    <div
      id={`movement-row-${movement.id}`}
      onDoubleClick={() => onEdit(movement)}
      title="Düzenlemek için çift tıklayın (Double-click)"
      className="group relative flex items-center justify-between px-6 py-3 hover:bg-slate-800/50 border-b border-slate-800/80 transition-colors select-none cursor-pointer text-slate-200"
    >
      {/* Sol: Tür İkonu, Ürün Adı, Kategori, Açıklama, Belge Notu */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Tür İkon Rozeti (Giriş: Yeşil, Çıkış: Kırmızı) */}
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
            isIn
              ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
              : 'bg-rose-950/70 text-rose-400 border-rose-800/60'
          }`}
        >
          {isIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
        </div>

        {/* Bilgiler */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Ürün Adı veya Stok Kodu */}
            {movement.productName ? (
              <span className="text-xs font-bold text-slate-100 truncate flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{movement.productName}</span>
                {movement.productCode && (
                  <span className="font-mono text-[11px] font-normal text-slate-400 bg-slate-800 px-1 rounded-xs border border-slate-700/60">
                    ({movement.productCode})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500 italic">
                Ürün Seçilmedi
              </span>
            )}

            {/* Tür Rozeti (Giriş / Çıkış) */}
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                isIn
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/70'
                  : 'bg-rose-950/80 text-rose-400 border-rose-800/70'
              }`}
            >
              {isIn ? 'Giriş' : 'Çıkış'}
            </span>

            {/* Kategori Rozeti */}
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
              {category?.name || 'Kategori Yok'}
            </span>

            {/* Ürün Kaplama Durumu (Eğer ürün varsa) */}
            {product && (
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                <Layers className="w-3 h-3 text-slate-500" />
                <span>{product.isCoated ? 'Kaplı' : 'Ham'}</span>
              </span>
            )}

            {/* Ekli Dosya Rozeti */}
            {hasFiles && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-sky-950/80 text-sky-400 border border-sky-800/70"
                title={`${movement.attachedFiles.length} ekli belge`}
              >
                <Paperclip className="w-2.5 h-2.5" />
                <span>{movement.attachedFiles.length}</span>
              </span>
            )}

            {/* Değişiklik Günlüğü (Audit Log) Rozeti */}
            {hasAuditLogs && (
              <span
                className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-950/80 text-amber-400 border border-amber-800/70"
                title={`${movement.auditLogs.length} değişiklik kaydı`}
              >
                <History className="w-2.5 h-2.5" />
                <span>Düzenlendi</span>
              </span>
            )}
          </div>

          {/* Açıklama & İrsaliye / Belge Detay Notu */}
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 truncate">
            {movement.description ? (
              <span className="truncate">{movement.description}</span>
            ) : (
              <span className="italic text-slate-500">Açıklama belirtilmedi</span>
            )}

            {movement.extraDetailNote && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-mono text-[11px] truncate bg-slate-800 px-1.5 py-0.2 rounded-xs border border-slate-700/60">
                  {movement.extraDetailNote}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sağ: Miktar (kg/adet) ve Hover Aksiyonları */}
      <div className="flex items-center gap-4 shrink-0 pl-3">
        {/* Miktar */}
        <div className="text-right">
          <div
            className={`text-sm font-bold font-mono tracking-tight ${
              isIn ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isIn ? '+' : '-'}
            {formatQuantity(movement.quantity, movement.unit)}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-mono">
            <span>{formattedDate}</span>
            {timeStr && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-medium">{timeStr}</span>
              </>
            )}
          </div>
        </div>

        {/* Hover Action Buttons */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(movement);
            }}
            title="Detay / Düzenle (Çift tıklama)"
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Bu stok hareketini silmek istediğinizden emin misiniz?')) {
                onDelete(movement.id);
              }
            }}
            title="Sil"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
