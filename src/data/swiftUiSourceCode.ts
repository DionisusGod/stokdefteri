export interface SwiftCodeFile {
  filename: string;
  category: 'Models' | 'Repository' | 'ViewModels' | 'Views';
  description: string;
  code: string;
}

export const SWIFT_FILES: SwiftCodeFile[] = [
  {
    filename: 'Models/CashTransaction.swift',
    category: 'Models',
    description: 'SwiftData @Model sınıfları, İlişkiler ve Değişiklik Geçmişi (AuditLog) Modeli',
    code: `import Foundation
import SwiftData

public enum TransactionType: String, Codable, CaseIterable {
    case income = "Gelir"
    case expense = "Gider"
}

@Model
public final class AuditLog {
    public var id: UUID
    public var timestamp: Date
    public var summary: String
    public var changedFieldsDescription: String

    public init(summary: String, changedFieldsDescription: String) {
        self.id = UUID()
        self.timestamp = Date()
        self.summary = summary
        self.changedFieldsDescription = changedFieldsDescription
    }
}

@Model
public final class CategoryItem {
    @Attribute(.unique) public var id: String
    public var name: String
    public var typeRaw: String
    public var colorHex: String
    
    public var type: TransactionType {
        get { TransactionType(rawValue: typeRaw) ?? .expense }
        set { typeRaw = newValue.rawValue }
    }
    
    public init(name: String, type: TransactionType, colorHex: String = "#ef4444") {
        self.id = UUID().uuidString
        self.name = name
        self.typeRaw = type.rawValue
        self.colorHex = colorHex
    }
}

@Model
public final class PaymentMethodItem {
    @Attribute(.unique) public var id: String
    public var name: String
    public var detailPlaceholder: String
    
    public init(name: String, detailPlaceholder: String = "Ödeme/tahsilat detay notu") {
        self.id = UUID().uuidString
        self.name = name
        self.detailPlaceholder = detailPlaceholder
    }
}

@Model
public final class CashTransaction {
    @Attribute(.unique) public var id: UUID
    public var typeRaw: String
    public var amount: Double
    public var date: Date
    public var note: String
    public var paymentDetailNote: String
    public var attachedFileName: String?
    public var createdAt: Date
    public var updatedAt: Date?
    
    // İlişkiler
    @Relationship(deleteRule: .nullify) public var category: CategoryItem?
    @Relationship(deleteRule: .nullify) public var paymentMethod: PaymentMethodItem?
    @Relationship(deleteRule: .cascade) public var auditLogs: [AuditLog]
    
    public var type: TransactionType {
        get { TransactionType(rawValue: typeRaw) ?? .expense }
        set { typeRaw = newValue.rawValue }
    }
    
    public init(
        type: TransactionType,
        amount: Double,
        date: Date = Date(),
        category: CategoryItem?,
        note: String = "",
        paymentMethod: PaymentMethodItem? = nil,
        paymentDetailNote: String = "",
        attachedFileName: String? = nil
    ) {
        self.id = UUID()
        self.typeRaw = type.rawValue
        self.amount = amount
        self.date = date
        self.category = category
        self.note = note
        self.paymentMethod = paymentMethod
        self.paymentDetailNote = paymentDetailNote
        self.attachedFileName = attachedFileName
        self.createdAt = Date()
        self.auditLogs = []
    }
    
    /// Bir güncelleme yapıldığında geçmiş logu kaydeder (Sadece değişiklik varsa eklenir)
    public func recordChangeIfEdited(
        newAmount: Double,
        newType: TransactionType,
        newCategory: CategoryItem?,
        newDate: Date,
        newNote: String,
        newPaymentMethod: PaymentMethodItem?,
        newPaymentDetail: String
    ) {
        var changes: [String] = []
        let nf = NumberFormatter()
        nf.numberStyle = .currency
        nf.currencySymbol = "₺"
        
        if self.amount != newAmount {
            changes.append("Tutar: \\(nf.string(from: NSNumber(value: self.amount)) ?? "") ➔ \\(nf.string(from: NSNumber(value: newAmount)) ?? "")")
            self.amount = newAmount
        }
        if self.type != newType {
            changes.append("Tür: \\(self.type.rawValue) ➔ \\(newType.rawValue)")
            self.type = newType
        }
        if self.category?.id != newCategory?.id {
            changes.append("Kategori: \\(self.category?.name ?? "Yok") ➔ \\(newCategory?.name ?? "Yok")")
            self.category = newCategory
        }
        if !Calendar.current.isDate(self.date, inSameDayAs: newDate) {
            let df = DateFormatter()
            df.dateStyle = .medium
            changes.append("Tarih: \\(df.string(from: self.date)) ➔ \\(df.string(from: newDate))")
            self.date = newDate
        }
        if self.note != newNote {
            changes.append("Açıklama güncellendi")
            self.note = newNote
        }
        if self.paymentMethod?.id != newPaymentMethod?.id {
            changes.append("Ödeme Türü: \\(self.paymentMethod?.name ?? "Yok") ➔ \\(newPaymentMethod?.name ?? "Yok")")
            self.paymentMethod = newPaymentMethod
        }
        if self.paymentDetailNote != newPaymentDetail {
            changes.append("Ödeme Detay Notu güncellendi")
            self.paymentDetailNote = newPaymentDetail
        }
        
        if !changes.isEmpty {
            let log = AuditLog(
                summary: "\\(changes.count) alan güncellendi",
                changedFieldsDescription: changes.joined(separator: "\\n")
            )
            self.auditLogs.insert(log, at: 0)
            self.updatedAt = Date()
        }
    }
}`
  },
  {
    filename: 'Repository/CashRepositoryProtocol.swift',
    category: 'Repository',
    description: 'Repository Pattern Soyutlaması (Local SwiftData ve Gelecekteki REST/gRPC API Katmanı)',
    code: `import Foundation
import SwiftData

/// 1. Mimari Kuralı: Local-First & API-Ready Repository Protokolü
public protocol CashRepositoryProtocol {
    func fetchTransactions(for date: Date) async throws -> [CashTransaction]
    func fetchAllTransactions() async throws -> [CashTransaction]
    func insertTransaction(_ transaction: CashTransaction) async throws
    func updateTransaction(_ transaction: CashTransaction) async throws
    func deleteTransaction(_ transaction: CashTransaction) async throws
    
    func fetchCategories() async throws -> [CategoryItem]
    func insertCategory(_ category: CategoryItem) async throws
    
    func fetchPaymentMethods() async throws -> [PaymentMethodItem]
    func insertPaymentMethod(_ method: PaymentMethodItem) async throws
}

/// SwiftData ile çalışan yerel (Local-First) repository implementasyonu
public final class SwiftDataCashRepository: CashRepositoryProtocol {
    private let modelContext: ModelContext
    
    public init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }
    
    public func fetchTransactions(for date: Date) async throws -> [CashTransaction] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        guard let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) else {
            return []
        }
        
        let descriptor = FetchDescriptor<CashTransaction>(
            predicate: #Predicate { $0.date >= startOfDay && $0.date < endOfDay },
            sortBy: [SortDescriptor(\\CashTransaction.createdAt, order: .reverse)]
        )
        return try modelContext.fetch(descriptor)
    }
    
    public func fetchAllTransactions() async throws -> [CashTransaction] {
        let descriptor = FetchDescriptor<CashTransaction>(
            sortBy: [SortDescriptor(\\CashTransaction.date, order: .reverse)]
        )
        return try modelContext.fetch(descriptor)
    }
    
    public func insertTransaction(_ transaction: CashTransaction) async throws {
        modelContext.insert(transaction)
        try modelContext.save()
    }
    
    public func updateTransaction(_ transaction: CashTransaction) async throws {
        try modelContext.save()
    }
    
    public func deleteTransaction(_ transaction: CashTransaction) async throws {
        modelContext.delete(transaction)
        try modelContext.save()
    }
    
    public func fetchCategories() async throws -> [CategoryItem] {
        let descriptor = FetchDescriptor<CategoryItem>(sortBy: [SortDescriptor(\\CategoryItem.name)])
        return try modelContext.fetch(descriptor)
    }
    
    public func insertCategory(_ category: CategoryItem) async throws {
        modelContext.insert(category)
        try modelContext.save()
    }
    
    public func fetchPaymentMethods() async throws -> [PaymentMethodItem] {
        let descriptor = FetchDescriptor<PaymentMethodItem>(sortBy: [SortDescriptor(\\PaymentMethodItem.name)])
        return try modelContext.fetch(descriptor)
    }
    
    public func insertPaymentMethod(_ method: PaymentMethodItem) async throws {
        modelContext.insert(method)
        try modelContext.save()
    }
}

/// İleride bulut backend veya REST/GraphQL sunucu bağlandığında kullanılacak hazır servis katmanı
public final class RemoteAPICashRepository: CashRepositoryProtocol {
    private let baseURL: URL
    private let session: URLSession
    
    public init(baseURL: URL = URL(string: "https://api.kasadefteri.com/v1")!, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }
    
    public func fetchTransactions(for date: Date) async throws -> [CashTransaction] {
        // Sunucu REST/GraphQL sorgusu yapılacak yer
        return []
    }
    public func fetchAllTransactions() async throws -> [CashTransaction] { return [] }
    public func insertTransaction(_ transaction: CashTransaction) async throws {}
    public func updateTransaction(_ transaction: CashTransaction) async throws {}
    public func deleteTransaction(_ transaction: CashTransaction) async throws {}
    public func fetchCategories() async throws -> [CategoryItem] { return [] }
    public func insertCategory(_ category: CategoryItem) async throws {}
    public func fetchPaymentMethods() async throws -> [PaymentMethodItem] { return [] }
    public func insertPaymentMethod(_ method: PaymentMethodItem) async throws {}
}`
  },
  {
    filename: 'ViewModels/CashRegisterViewModel.swift',
    category: 'ViewModels',
    description: 'macOS @Observable State Yönetimi, Gün Navigasyonu ve Aylık Özet Kontrolü',
    code: `import Foundation
import SwiftUI
import SwiftData

@Observable
public final class CashRegisterViewModel {
    public var selectedDate: Date = Date()
    public var transactions: [CashTransaction] = []
    public var allTransactions: [CashTransaction] = []
    public var categories: [CategoryItem] = []
    public var paymentMethods: [PaymentMethodItem] = []
    
    // UI State
    public var isAddingTransaction: Bool = false
    public var selectedTransactionForEdit: CashTransaction? = nil
    public var isMonthlySummaryPresented: Bool = false
    public var activeTab: AppTab = .daily
    
    // Alert & Toast
    public var toastMessage: String? = nil
    public var showToast: Bool = false
    
    private let repository: CashRepositoryProtocol
    
    public enum AppTab {
        case daily
        case dashboard
    }
    
    public init(repository: CashRepositoryProtocol) {
        self.repository = repository
    }
    
    @MainActor
    public func loadData() async {
        do {
            self.transactions = try await repository.fetchTransactions(for: selectedDate)
            self.allTransactions = try await repository.fetchAllTransactions()
            self.categories = try await repository.fetchCategories()
            self.paymentMethods = try await repository.fetchPaymentMethods()
            checkFirstDayOfMonthTrigger()
        } catch {
            showNotification(error.localizedDescription)
        }
    }
    
    // MARK: - Gün Navigasyonu (HIG Navigasyon Standartları)
    public func navigateDays(by offset: Int) {
        if let newDate = Calendar.current.date(byAdding: .day, value: offset, to: selectedDate) {
            selectedDate = newDate
            Task { await loadData() }
        }
    }
    
    public func navigateWeeks(by offset: Int) {
        if let newDate = Calendar.current.date(byAdding: .weekOfYear, value: offset, to: selectedDate) {
            selectedDate = newDate
            Task { await loadData() }
        }
    }
    
    public func jumpToToday() {
        selectedDate = Date()
        Task { await loadData() }
    }
    
    public var isViewingToday: Bool {
        Calendar.current.isDateInToday(selectedDate)
    }
    
    // MARK: - Ayın İlk Günü Kontrolü
    private func checkFirstDayOfMonthTrigger() {
        let calendar = Calendar.current
        let day = calendar.component(.day, from: Date())
        let currentMonthKey = "\\(calendar.component(.year, from: Date()))-\\(\\calendar.component(.month, from: Date()))"
        let lastSeenKey = UserDefaults.standard.string(forKey: "LastSeenMonthlySummaryKey")
        
        // Ayın 1. günüyse ve bu ay henüz gösterilmediyse otomatik tetikle
        if day == 1 && lastSeenKey != currentMonthKey {
            self.isMonthlySummaryPresented = true
            UserDefaults.standard.set(currentMonthKey, forKey: "LastSeenMonthlySummaryKey")
        }
    }
    
    public func showNotification(_ text: String) {
        self.toastMessage = text
        self.showToast = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            self.showToast = false
        }
    }
}`
  },
  {
    filename: 'Views/CashRegisterMainView.swift',
    category: 'Views',
    description: 'Ana Ekran: Gün Navigasyonu, Satır Hover Akışı ve Soldan Sağa Veri Giriş Mantığı',
    code: `import SwiftUI
import SwiftData

public struct CashRegisterMainView: View {
    @Bindable var viewModel: CashRegisterViewModel
    
    // Yeni Hareket Giriş Satırı State'i
    @State private var newType: TransactionType = .expense
    @State private var selectedCategory: CategoryItem?
    @State private var amountText: String = ""
    @State private var customDate: Date = Date()
    @State private var note: String = ""
    @State private var selectedPaymentMethod: PaymentMethodItem?
    @State private var paymentDetail: String = ""
    @State private var attachedFileName: String?
    
    @State private var isAddRowHovered: Bool = false
    @State private var isPlusMenuPresented: Bool = false
    
    public var body: some View {
        VStack(spacing: 0) {
            // macOS HIG Toolbar & Gün Navigasyonu
            topNavigationBar
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
                .background(.regularMaterial)
            
            Divider()
            
            // Yeni Hareket Ekleme Çubuğu (4. Kural: Soldan Sağa Kesin Sıralama)
            newTransactionInputBar
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
                .background(Color(nsColor: .controlBackgroundColor))
            
            Divider()
            
            // Günlük Hareket Listesi (Çift Tıklama Destekli)
            transactionListView
        }
        .sheet(item: $viewModel.selectedTransactionForEdit) { tx in
            TransactionEditSheet(transaction: tx, viewModel: viewModel)
        }
        .sheet(isPresented: $viewModel.isMonthlySummaryPresented) {
            MonthlySummarySheet(allTransactions: viewModel.allTransactions)
        }
    }
    
    // MARK: - 2. Navigasyon Bar (<<, <, Gün Başlığı, >, >>)
    private var topNavigationBar: some View {
        HStack(spacing: 16) {
            HStack(spacing: 6) {
                Button { viewModel.navigateWeeks(by: -1) } label: {
                    Image(systemName: "chevron.left.2")
                }
                .help("1 Hafta Geri (<<)")
                
                Button { viewModel.navigateDays(by: -1) } label: {
                    Image(systemName: "chevron.left")
                }
                .help("1 Gün Geri (<)")
            }
            .buttonStyle(.plain)
            
            // Seçili Gün Başlığı
            HStack(spacing: 8) {
                Text(viewModel.selectedDate, format: .dateTime.day().month(.wide).year())
                    .font(.system(size: 16, weight: .semibold, design: .rounded))
                
                if viewModel.isViewingToday {
                    Text("Bugün")
                        .font(.caption2.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.accentColor.opacity(0.15))
                        .foregroundStyle(Color.accentColor)
                        .clipShape(Capsule())
                } else {
                    Button("Bugüne Dön") {
                        viewModel.jumpToToday()
                    }
                    .buttonStyle(.link)
                    .font(.caption)
                }
            }
            
            HStack(spacing: 6) {
                Button { viewModel.navigateDays(by: 1) } label: {
                    Image(systemName: "chevron.right")
                }
                .help("1 Gün İleri (>)")
                
                Button { viewModel.navigateWeeks(by: 1) } label: {
                    Image(systemName: "chevron.right.2")
                }
                .help("1 Hafta İleri (>>)")
            }
            .buttonStyle(.plain)
            
            Spacer()
            
            // Manuel Aylık Özet Butonu
            Button {
                viewModel.isMonthlySummaryPresented = true
            } label: {
                Label("Aylık Özet", systemImage: "calendar.badge.clock")
            }
            .buttonStyle(.bordered)
        }
    }
    
    // MARK: - 4. Yeni Hareket Satır UI (Soldan Sağa Kesin Sıralama & onHover +)
    private var newTransactionInputBar: some View {
        HStack(spacing: 12) {
            // 1) Tür Seçimi (Gider / Gelir)
            Picker("", selection: $newType) {
                Text("Gider").tag(TransactionType.expense)
                Text("Gelir").tag(TransactionType.income)
            }
            .pickerStyle(.segmented)
            .frame(width: 140)
            
            // 2) Kategori Seçimi (Açılır liste & Yeni Ekleme)
            Picker("Kategori", selection: $selectedCategory) {
                Text("Kategori Seçin").tag(nil as CategoryItem?)
                ForEach(viewModel.categories.filter { $0.type == newType }) { cat in
                    Text(cat.name).tag(cat as CategoryItem?)
                }
            }
            .frame(width: 160)
            
            // 3) Tutar Girişi (₺)
            HStack(spacing: 4) {
                Text("₺").foregroundStyle(.secondary)
                TextField("0.00", text: $amountText)
                    .textFieldStyle(.roundedBorder)
                    .frame(width: 110)
            }
            
            // 4) Tarih: SADECE görüntülenen gün, bugünün tarihi DEĞİLSE görünür!
            if !viewModel.isViewingToday {
                DatePicker("", selection: $customDate, displayedComponents: .date)
                    .labelsHidden()
                    .frame(width: 110)
                    .transition(.opacity.combined(with: .scale))
            }
            
            // 5) Açıklama (Opsiyonel)
            TextField("Açıklama (Opsiyonel)", text: $note)
                .textFieldStyle(.roundedBorder)
            
            // 6) "+" Menüsü: Sadece mouse üzerine gelince (onHover) görünür!
            ZStack {
                if isAddRowHovered || isPlusMenuPresented {
                    Button {
                        isPlusMenuPresented.toggle()
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Color.accentColor)
                    }
                    .buttonStyle(.plain)
                    .popover(isPresented: $isPlusMenuPresented, arrowEdge: .bottom) {
                        plusMenuPopoverContent
                            .frame(width: 280)
                            .padding()
                    }
                    .transition(.scale.combined(with: .opacity))
                } else {
                    Color.clear.frame(width: 24, height: 24)
                }
            }
            
            // Kaydet Butonu
            Button("Ekle") {
                commitNewTransaction()
            }
            .buttonStyle(.borderedProminent)
            .disabled(amountText.isEmpty || selectedCategory == nil)
        }
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.15)) {
                self.isAddRowHovered = hovering
            }
        }
    }
    
    // "+" Menüsü Popover İçeriği (Ödeme Türü + Detay Metin Kutusu + Dosya Ekleme)
    private var plusMenuPopoverContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ek Detaylar").font(.headline)
            
            // Ödeme Türü
            Picker("Ödeme Türü", selection: $selectedPaymentMethod) {
                Text("Belirtilmemiş").tag(nil as PaymentMethodItem?)
                ForEach(viewModel.paymentMethods) { pm in
                    Text(pm.name).tag(pm as PaymentMethodItem?)
                }
            }
            
            // Ödeme Detay Notu
            TextField(selectedPaymentMethod?.detailPlaceholder ?? "Ödeme detay notu (örn: son 4 hane, çek no)", text: $paymentDetail)
                .textFieldStyle(.roundedBorder)
            
            Divider()
            
            // Dosya Ekleme
            Button {
                // Dosya seçici tetikleme
                self.attachedFileName = "dekont_belgesi.pdf"
            } label: {
                Label(attachedFileName ?? "Dosya / Belge Ekle", systemImage: "doc.badge.plus")
            }
            .buttonStyle(.borderless)
        }
    }
    
    // MARK: - 5. İşlem Listesi ve Çift Tıklama
    private var transactionListView: some View {
        List {
            ForEach(viewModel.transactions) { tx in
                TransactionRowView(transaction: tx)
                    // 5. Kural: Çift Tıklama ile Detay / Düzenleme Açılması
                    .onTapGesture(count: 2) {
                        viewModel.selectedTransactionForEdit = tx
                    }
            }
        }
        .listStyle(.inset(alternatesRowBackgrounds: true))
    }
    
    private func commitNewTransaction() {
        guard let amount = Double(amountText.replacingOccurrences(of: ",", with: ".")),
              let cat = selectedCategory else { return }
        
        let tx = CashTransaction(
            type: newType,
            amount: amount,
            date: viewModel.isViewingToday ? Date() : customDate,
            category: cat,
            note: note,
            paymentMethod: selectedPaymentMethod,
            paymentDetailNote: paymentDetail,
            attachedFileName: attachedFileName
        )
        // Reset inputs
        amountText = ""
        note = ""
        paymentDetail = ""
        attachedFileName = nil
    }
}`
  },
  {
    filename: 'Views/TransactionEditSheet.swift',
    category: 'Views',
    description: 'Çift Tıklama Düzenleme Sekmesi, "Tüm bilgileri göster" Açılır Grubu, "..." Log Menüsü',
    code: `import SwiftUI
import SwiftData

public struct TransactionEditSheet: View {
    @Bindable var transaction: CashTransaction
    @Bindable var viewModel: CashRegisterViewModel
    @Environment(\\.dismiss) private var dismiss
    
    // Düzenleme Değerleri
    @State private var editType: TransactionType
    @State private var editAmount: Double
    @State private var editCategory: CategoryItem?
    @State private var editDate: Date
    @State private var editNote: String
    @State private var editPaymentMethod: PaymentMethodItem?
    @State private var editPaymentDetail: String
    
    // 5. Kural: Ekranı boğmamak için sadece temel girişler ilk başta görünür
    @State private var showAllDetails: Bool = false
    
    // 6. Kural: Log Kayıtları ve Toast Kontrolü
    @State private var isAuditLogPresented: Bool = false
    @State private var showNoLogAlert: Bool = false
    
    public init(transaction: CashTransaction, viewModel: CashRegisterViewModel) {
        self.transaction = transaction
        self.viewModel = viewModel
        _editType = State(initialValue: transaction.type)
        _editAmount = State(initialValue: transaction.amount)
        _editCategory = State(initialValue: transaction.category)
        _editDate = State(initialValue: transaction.date)
        _editNote = State(initialValue: transaction.note)
        _editPaymentMethod = State(initialValue: transaction.paymentMethod)
        _editPaymentDetail = State(initialValue: transaction.paymentDetailNote)
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            // macOS Sheet Üst Başlık & Sağ Üst "..." Menüsü
            HStack {
                Text("Hareketi Düzenle")
                    .font(.system(size: 16, weight: .bold))
                
                Spacer()
                
                // 6. Kural: "..." (Üç nokta) Log Menüsü
                Menu {
                    Button {
                        // Eğer log kaydı yoksa zarif alert/toast ver
                        if transaction.auditLogs.isEmpty {
                            showNoLogAlert = true
                        } else {
                            isAuditLogPresented = true
                        }
                    } label: {
                        Label("Değişiklik Geçmişi (Logs)", systemImage: "clock.arrow.circlepath")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title3)
                }
                .menuStyle(.borderlessButton)
            }
            .padding()
            .background(.regularMaterial)
            
            Divider()
            
            Form {
                Section("Temel Bilgiler") {
                    Picker("Tür", selection: $editType) {
                        Text("Gider").tag(TransactionType.expense)
                        Text("Gelir").tag(TransactionType.income)
                    }
                    .pickerStyle(.segmented)
                    
                    TextField("Tutar (₺)", value: $editAmount, format: .currency(code: "TRY"))
                    
                    Picker("Kategori", selection: $editCategory) {
                        ForEach(viewModel.categories) { cat in
                            Text(cat.name).tag(cat as CategoryItem?)
                        }
                    }
                    
                    DatePicker("Tarih", selection: $editDate, displayedComponents: .date)
                    
                    TextField("Açıklama", text: $editNote)
                }
                
                // 5. Kural: İkincil detaylar SADECE "Tüm bilgileri göster"e tıklanınca açılır!
                Section {
                    DisclosureGroup(isExpanded: $showAllDetails) {
                        VStack(alignment: .leading, spacing: 14) {
                            Picker("Ödeme Türü", selection: $editPaymentMethod) {
                                Text("Seçilmemiş").tag(nil as PaymentMethodItem?)
                                ForEach(viewModel.paymentMethods) { pm in
                                    Text(pm.name).tag(pm as PaymentMethodItem?)
                                }
                            }
                            
                            TextField("Ödeme Detay Notu (Kart son 4 hane, çek no vb.)", text: $editPaymentDetail)
                            
                            if let fileName = transaction.attachedFileName {
                                HStack {
                                    Image(systemName: "doc.fill").foregroundStyle(.blue)
                                    Text(fileName).font(.callout)
                                }
                            }
                        }
                        .padding(.top, 6)
                    } label: {
                        Text(showAllDetails ? "Detayları Gizle" : "Tüm bilgileri göster (Show all details)")
                            .font(.subheadline)
                            .foregroundStyle(Color.accentColor)
                    }
                }
            }
            .formStyle(.grouped)
            
            Divider()
            
            // Alt Butonlar
            HStack {
                Button("Vazgeç") { dismiss() }
                Spacer()
                Button("Kaydet") {
                    saveChanges()
                }
                .buttonStyle(.borderedProminent)
            }
            .padding()
        }
        .frame(width: 480, height: 500)
        // 6. Kural Bildirimi: "Log kaydı bulunamadı" Alert
        .alert("Değişiklik Geçmişi", isPresented: $showNoLogAlert) {
            Button("Tamam", role: .cancel) {}
        } message: {
            Text("Log kaydı bulunamadı. Bu hareket üzerinde henüz hiçbir düzenleme yapılmamıştır.")
        }
        .sheet(isPresented: $isAuditLogPresented) {
            AuditLogHistorySheet(auditLogs: transaction.auditLogs)
        }
    }
    
    private func saveChanges() {
        transaction.recordChangeIfEdited(
            newAmount: editAmount,
            newType: editType,
            newCategory: editCategory,
            newDate: editDate,
            newNote: editNote,
            newPaymentMethod: editPaymentMethod,
            newPaymentDetail: editPaymentDetail
        )
        dismiss()
    }
}`
  },
  {
    filename: 'Views/DashboardAnalyticsView.swift',
    category: 'Views',
    description: 'Gelişmiş Dashboard: Swift Charts (Pie, Line, Bar) Pürüzsüz Geçiş Animasyonu',
    code: `import SwiftUI
import Charts

public struct DashboardAnalyticsView: View {
    let transactions: [CashTransaction]
    
    public enum ChartFormat: String, CaseIterable, Identifiable {
        case pie = "Dairesel (Pie)"
        case line = "Çizgisel (Line)"
        case bar = "Sütun (Bar)"
        public var id: String { self.rawValue }
    }
    
    @State private var selectedFormat: ChartFormat = .bar
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            // Kontrol Başlığı ve Grafik Türü Seçici
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Finansal Analiz & Dashboard")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                    Text("Gelir, gider ve kategori dağılımlarını görselleştirin")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
                
                Spacer()
                
                // Pürüzsüz Animasyonlu Format Seçici
                Picker("Grafik Biçimi", selection: $selectedFormat.animation(.smooth(duration: 0.35))) {
                    ForEach(ChartFormat.allCases) { format in
                        Text(format.rawValue).tag(format)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 340)
            }
            
            // KPI Özet Kartları
            HStack(spacing: 16) {
                KPICard(title: "Toplam Gelir", amount: totalIncome, color: .green)
                KPICard(title: "Toplam Gider", amount: totalExpense, color: .red)
                KPICard(title: "Net Kasa", amount: totalIncome - totalExpense, color: .blue)
            }
            
            // 3. Kural: Grafikler Arası Pürüzsüz Animasyon
            ZStack {
                switch selectedFormat {
                case .pie:
                    pieChartView
                        .transition(.asymmetric(insertion: .scale(scale: 0.9).combined(with: .opacity), removal: .opacity))
                case .line:
                    lineChartView
                        .transition(.asymmetric(insertion: .slide.combined(with: .opacity), removal: .opacity))
                case .bar:
                    barChartView
                        .transition(.asymmetric(insertion: .opacity.combined(with: .move(edge: .bottom)), removal: .opacity))
                }
            }
            .frame(height: 320)
            .padding()
            .background(Color(nsColor: .controlBackgroundColor))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(24)
    }
    
    private var pieChartView: some View {
        Chart(categoryBreakdown) { item in
            SectorMark(
                angle: .value("Tutar", item.amount),
                innerRadius: .ratio(0.55),
                angularInset: 1.5
            )
            .foregroundStyle(by: .value("Kategori", item.name))
        }
    }
    
    private var lineChartView: some View {
        Chart(dailyTotals) { item in
            LineMark(
                x: .value("Tarih", item.date, unit: .day),
                y: .value("Tutar (₺)", item.netAmount)
            )
            .interpolationMethod(.catmullRom)
            .symbol(.circle)
        }
    }
    
    private var barChartView: some View {
        Chart(categoryBreakdown) { item in
            BarMark(
                x: .value("Kategori", item.name),
                y: .value("Tutar (₺)", item.amount)
            )
            .foregroundStyle(item.type == .income ? Color.green : Color.red)
        }
    }
    
    // Veri Hesaplayıcılar
    private var totalIncome: Double {
        transactions.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
    }
    private var totalExpense: Double {
        transactions.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
    }
    
    struct CategoryData: Identifiable {
        var id: String { name }
        let name: String
        let amount: Double
        let type: TransactionType
    }
    
    private var categoryBreakdown: [CategoryData] {
        // Kategori bazında gruplama hesaplaması
        Dictionary(grouping: transactions, by: { $0.category?.name ?? "Diğer" })
            .map { key, values in
                CategoryData(
                    name: key,
                    amount: values.reduce(0) { $0 + $1.amount },
                    type: values.first?.type ?? .expense
                )
            }
    }
    
    struct DailyData: Identifiable {
        var id: Date { date }
        let date: Date
        let netAmount: Double
    }
    
    private var dailyTotals: [DailyData] { [] }
}

struct KPICard: View {
    let title: String
    let amount: Double
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.caption).foregroundStyle(.secondary)
            Text(amount, format: .currency(code: "TRY"))
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(Color(nsColor: .controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}`
  }
];
