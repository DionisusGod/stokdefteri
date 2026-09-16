export type StockMovementType = 'in' | 'out'; // Giriş / Çıkış
export type StockUnit = 'adet' | 'kg'; // Adet veya Kg

export interface Product {
  id: string;
  name: string; // Ürün Adı
  code: string; // Ürün Stok Kodu (örn: STK-1001)
  price: number; // Fiyatı (₺)
  isCoated: boolean; // Kaplanmış (true) / Kaplanmamış (false)
  defaultUnit: StockUnit; // Varsayılan birim: kg veya adet
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: StockMovementType | 'both';
  icon?: string;
  color?: string;
  isDefault?: boolean;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
  uploadedAt: string;
}

export interface FieldChange {
  fieldName: string;
  displayName: string;
  oldValue: string;
  newValue: string;
}

export interface AuditLogEntry {
  id: string;
  movementId: string;
  timestamp: string; // ISO string
  summary: string;
  changes: FieldChange[];
}

export interface StockMovement {
  id: string;
  type: StockMovementType; // 'in' (Giriş) | 'out' (Çıkış)
  productId?: string; // Seçilen ürünün ID'si
  productName?: string; // Kolay arama ve saklama için ürün adı
  productCode?: string; // Ürün stok kodu
  categoryId: string; // Kategori ID
  quantity: number; // Tutar yerine miktar
  unit: StockUnit; // 'kg' | 'adet'
  date: string; // YYYY-MM-DD
  description?: string; // Açıklama
  extraDetailNote?: string; // + Menüsündeki detay notu (irsaliye no, parti no, vb.)
  attachedFiles: AttachedFile[]; // Ekli belgeler
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  auditLogs: AuditLogEntry[];
}

export type ActiveView = 'register' | 'history' | 'products';

export interface ToastState {
  id: string;
  type: 'info' | 'alert' | 'success';
  title?: string;
  message: string;
}
