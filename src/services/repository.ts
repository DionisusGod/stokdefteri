import {
  AuditLogEntry,
  Category,
  FieldChange,
  Product,
  StockMovement,
  StockMovementType,
  StockUnit,
} from '../types';
import { formatDateToISO } from '../utils/formatters';

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'M8x40 İmbus Civata',
    code: 'STK-CIV-001',
    price: 4.5,
    isCoated: true,
    defaultUnit: 'adet',
    notes: 'Galvaniz kaplamalı çelik imbus',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Alüminyum Kutu Profil 40x40',
    code: 'STK-ALM-102',
    price: 185.0,
    isCoated: false,
    defaultUnit: 'kg',
    notes: 'Ham ekstrüzyon 6063 profil',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Pirinç Burç Ø25mm',
    code: 'STK-PRS-305',
    price: 75.0,
    isCoated: true,
    defaultUnit: 'adet',
    notes: 'Nikel kaplamalı hassas burç',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Paslanmaz Çelik Sac 2mm',
    code: 'STK-SAC-401',
    price: 240.0,
    isCoated: false,
    defaultUnit: 'kg',
    notes: '304 kalite taşlanmış plaka',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Kauçuk Sızdırmazlık Contası',
    code: 'STK-CON-012',
    price: 12.0,
    isCoated: false,
    defaultUnit: 'adet',
    notes: 'EPDM 70 Shore conta',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-in-1', name: 'Satın Alma Girişi', type: 'in', color: '#10b981', isDefault: true },
  { id: 'cat-in-2', name: 'Üretimden Giriş', type: 'in', color: '#059669', isDefault: true },
  { id: 'cat-in-3', name: 'Müşteri İadesi', type: 'in', color: '#34d399', isDefault: true },
  { id: 'cat-in-4', name: 'Sayım Fazlası', type: 'in', color: '#6ee7b7', isDefault: true },
  { id: 'cat-out-1', name: 'Üretime Çıkış', type: 'out', color: '#ef4444', isDefault: true },
  { id: 'cat-out-2', name: 'Sevkiyat / Satış', type: 'out', color: '#f97316', isDefault: true },
  { id: 'cat-out-3', name: 'Fire / Hurda', type: 'out', color: '#eab308', isDefault: true },
  { id: 'cat-out-4', name: 'Tedarikçiye İade', type: 'out', color: '#ec4899', isDefault: true },
  { id: 'cat-out-5', name: 'Numune Çıkışı', type: 'out', color: '#8b5cf6', isDefault: true },
];

export interface MovementFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  type?: StockMovementType;
  productId?: string;
  categoryId?: string;
  searchQuery?: string;
}

const STORAGE_KEYS = {
  MOVEMENTS: 'stok_defteri_movements_v1',
  PRODUCTS: 'stok_defteri_products_v1',
  CATEGORIES: 'stok_defteri_categories_v1',
};

export class LocalStockRepository {
  private movements: StockMovement[] = [];
  private products: Product[] = [];
  private categories: Category[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    try {
      // 1. Ürünler
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProducts) {
        this.products = JSON.parse(storedProducts);
      } else {
        this.products = [...DEFAULT_PRODUCTS];
        this.saveProducts();
      }

      // 2. Kategoriler
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (storedCategories) {
        this.categories = JSON.parse(storedCategories);
      } else {
        this.categories = [...DEFAULT_CATEGORIES];
        this.saveCategories();
      }

      // 3. Hareketler
      const storedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      if (storedMovements) {
        this.movements = JSON.parse(storedMovements);
      } else {
        this.movements = this.generateSeedMovements();
        this.saveMovements();
      }

      this.initialized = true;
    } catch {
      this.products = [...DEFAULT_PRODUCTS];
      this.categories = [...DEFAULT_CATEGORIES];
      this.movements = this.generateSeedMovements();
      this.initialized = true;
    }
  }

  private saveProducts() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
    } catch (e) {
      console.warn('LocalStorage save products failed', e);
    }
  }

  private saveCategories() {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(this.categories));
    } catch (e) {
      console.warn('LocalStorage save categories failed', e);
    }
  }

  private saveMovements() {
    try {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(this.movements));
    } catch (e) {
      console.warn('LocalStorage save movements failed', e);
    }
  }

  private generateSeedMovements(): StockMovement[] {
    const today = new Date();
    const todayISO = formatDateToISO(today);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = formatDateToISO(yesterday);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoISO = formatDateToISO(twoDaysAgo);

    return [
      {
        id: 'mov-seed-1',
        type: 'in',
        productId: 'prod-1',
        productName: 'M8x40 İmbus Civata',
        productCode: 'STK-CIV-001',
        categoryId: 'cat-in-1',
        quantity: 500,
        unit: 'adet',
        date: todayISO,
        description: 'Bursa Civata A.Ş. İrsaliye teslimi',
        extraDetailNote: 'İrsaliye No: 2026-8812',
        attachedFiles: [],
        createdAt: new Date().toISOString(),
        auditLogs: [],
      },
      {
        id: 'mov-seed-2',
        type: 'out',
        productId: 'prod-2',
        productName: 'Alüminyum Kutu Profil 40x40',
        productCode: 'STK-ALM-102',
        categoryId: 'cat-out-1',
        quantity: 85.5,
        unit: 'kg',
        date: todayISO,
        description: 'CNC Kesim Hattı Sipariş #412 için sevk',
        extraDetailNote: 'İş Emri No: WO-9140',
        attachedFiles: [],
        createdAt: new Date().toISOString(),
        auditLogs: [],
      },
      {
        id: 'mov-seed-3',
        type: 'in',
        productId: 'prod-4',
        productName: 'Paslanmaz Çelik Sac 2mm',
        productCode: 'STK-SAC-401',
        categoryId: 'cat-in-1',
        quantity: 350.2,
        unit: 'kg',
        date: yesterdayISO,
        description: 'Gebze Haddehane 2 palet teslim alındı',
        extraDetailNote: 'Kantar Fişi No: 9941',
        attachedFiles: [],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        auditLogs: [
          {
            id: 'log-seed-1',
            movementId: 'mov-seed-3',
            timestamp: new Date(Date.now() - 40000000).toISOString(),
            summary: 'Miktar güncellendi',
            changes: [
              {
                fieldName: 'quantity',
                displayName: 'Miktar',
                oldValue: '300 kg',
                newValue: '350.2 kg',
              },
            ],
          },
        ],
      },
      {
        id: 'mov-seed-4',
        type: 'out',
        productId: 'prod-3',
        productName: 'Pirinç Burç Ø25mm',
        productCode: 'STK-PRS-305',
        categoryId: 'cat-out-2',
        quantity: 120,
        unit: 'adet',
        date: twoDaysAgoISO,
        description: 'Ege Makine montaj hattına sevkiyat',
        extraDetailNote: 'Sevk İrsaliyesi: IR-7721',
        attachedFiles: [],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        auditLogs: [],
      },
    ];
  }

  // --- HAREKET İŞLEMLERİ (MOVEMENTS) ---
  async getMovements(filter?: MovementFilter): Promise<StockMovement[]> {
    let result = [...this.movements];

    if (filter?.date) {
      result = result.filter((m) => m.date === filter.date);
    }
    if (filter?.startDate) {
      result = result.filter((m) => m.date >= filter.startDate!);
    }
    if (filter?.endDate) {
      result = result.filter((m) => m.date <= filter.endDate!);
    }
    if (filter?.type) {
      result = result.filter((m) => m.type === filter.type);
    }
    if (filter?.productId) {
      result = result.filter((m) => m.productId === filter.productId);
    }
    if (filter?.categoryId) {
      result = result.filter((m) => m.categoryId === filter.categoryId);
    }
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.productName?.toLowerCase().includes(q) ||
          m.productCode?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.extraDetailNote?.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  async createMovement(
    data: Omit<StockMovement, 'id' | 'createdAt' | 'auditLogs'>
  ): Promise<StockMovement> {
    const newMovement: StockMovement = {
      ...data,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      auditLogs: [],
    };

    this.movements.unshift(newMovement);
    this.saveMovements();
    return { ...newMovement };
  }

  // Halihazırdaki log kuralını KORU: Her düzenlemede detaylı AuditLog oluşturulur
  async updateMovement(
    id: string,
    updates: Partial<StockMovement>
  ): Promise<{ movement: StockMovement; logged: boolean }> {
    const index = this.movements.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Stok hareketi bulunamadı');
    }

    const current = this.movements[index];
    const changes: FieldChange[] = [];

    if (updates.quantity !== undefined && updates.quantity !== current.quantity) {
      changes.push({
        fieldName: 'quantity',
        displayName: 'Miktar',
        oldValue: `${current.quantity} ${current.unit}`,
        newValue: `${updates.quantity} ${updates.unit || current.unit}`,
      });
    }

    if (updates.unit !== undefined && updates.unit !== current.unit) {
      changes.push({
        fieldName: 'unit',
        displayName: 'Birim',
        oldValue: current.unit,
        newValue: updates.unit,
      });
    }

    if (updates.type !== undefined && updates.type !== current.type) {
      changes.push({
        fieldName: 'type',
        displayName: 'Hareket Türü',
        oldValue: current.type === 'in' ? 'Giriş' : 'Çıkış',
        newValue: updates.type === 'in' ? 'Giriş' : 'Çıkış',
      });
    }

    if (updates.productId !== undefined && updates.productId !== current.productId) {
      changes.push({
        fieldName: 'productId',
        displayName: 'Ürün',
        oldValue: current.productName || 'Belirtilmemiş',
        newValue: updates.productName || 'Belirtilmemiş',
      });
    }

    if (updates.categoryId !== undefined && updates.categoryId !== current.categoryId) {
      const oldCat = this.categories.find((c) => c.id === current.categoryId)?.name || current.categoryId;
      const newCat = this.categories.find((c) => c.id === updates.categoryId)?.name || updates.categoryId;
      changes.push({
        fieldName: 'categoryId',
        displayName: 'Kategori',
        oldValue: oldCat,
        newValue: newCat,
      });
    }

    if (updates.date !== undefined && updates.date !== current.date) {
      changes.push({
        fieldName: 'date',
        displayName: 'Tarih',
        oldValue: current.date,
        newValue: updates.date,
      });
    }

    if (updates.description !== undefined && updates.description !== current.description) {
      changes.push({
        fieldName: 'description',
        displayName: 'Açıklama',
        oldValue: current.description || 'Yok',
        newValue: updates.description || 'Yok',
      });
    }

    if (updates.extraDetailNote !== undefined && updates.extraDetailNote !== current.extraDetailNote) {
      changes.push({
        fieldName: 'extraDetailNote',
        displayName: 'Detay Notu / Belge No',
        oldValue: current.extraDetailNote || 'Yok',
        newValue: updates.extraDetailNote || 'Yok',
      });
    }

    let updatedAuditLogs = current.auditLogs || [];
    let logged = false;

    if (changes.length > 0) {
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        movementId: id,
        timestamp: new Date().toISOString(),
        summary: `${changes.map((c) => c.displayName).join(', ')} güncellendi`,
        changes,
      };
      updatedAuditLogs = [newLog, ...updatedAuditLogs];
      logged = true;
    }

    const updatedMovement: StockMovement = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      auditLogs: updatedAuditLogs,
    };

    this.movements[index] = updatedMovement;
    this.saveMovements();
    return { movement: { ...updatedMovement }, logged };
  }

  async deleteMovement(id: string): Promise<boolean> {
    const initialLen = this.movements.length;
    this.movements = this.movements.filter((m) => m.id !== id);
    if (this.movements.length !== initialLen) {
      this.saveMovements();
      return true;
    }
    return false;
  }

  // --- ÜRÜN İŞLEMLERİ (PRODUCTS) ---
  async getProducts(): Promise<Product[]> {
    return [...this.products].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.products.unshift(newProduct);
    this.saveProducts();
    return { ...newProduct };
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Ürün bulunamadı');

    const current = this.products[index];
    const updated: Product = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.products[index] = updated;
    this.saveProducts();

    // Ayrıca hareketlerdeki ürün adı ve kodunu da senkronize edebiliriz
    if (updates.name || updates.code) {
      this.movements = this.movements.map((m) => {
        if (m.productId === id) {
          return {
            ...m,
            productName: updates.name || m.productName,
            productCode: updates.code || m.productCode,
          };
        }
        return m;
      });
      this.saveMovements();
    }

    return { ...updated };
  }

  async deleteProduct(id: string): Promise<boolean> {
    const initLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    if (this.products.length !== initLen) {
      this.saveProducts();
      return true;
    }
    return false;
  }

  // --- KATEGORİ İŞLEMLERİ (CATEGORIES) ---
  async getCategories(): Promise<Category[]> {
    return [...this.categories];
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const newCat: Category = {
      ...category,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.categories.push(newCat);
    this.saveCategories();
    return { ...newCat };
  }

  async updateCategory(id: string, updates: Partial<Omit<Category, 'id'>>): Promise<Category> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Kategori bulunamadı');
    this.categories[index] = { ...this.categories[index], ...updates };
    this.saveCategories();
    return { ...this.categories[index] };
  }

  async deleteCategory(id: string): Promise<boolean> {
    const initLen = this.categories.length;
    this.categories = this.categories.filter((c) => c.id !== id);
    if (this.categories.length !== initLen) {
      this.saveCategories();
      return true;
    }
    return false;
  }
}

export const stockRepository = new LocalStockRepository();
