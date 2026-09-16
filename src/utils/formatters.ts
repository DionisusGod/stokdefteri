/**
 * Tarih ve Sayı / Miktar formatlama yardımcı fonksiyonları (macOS TR Yerelleştirmesi)
 */

export function formatQuantity(qty: number, unit: 'kg' | 'adet' = 'adet'): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: unit === 'kg' ? 2 : 0,
    maximumFractionDigits: unit === 'kg' ? 3 : 2,
  }).format(qty);

  return `${formatted} ${unit}`;
}

export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return `₺${formatted}`;
}

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function formatDisplayDate(dateStr: string): {
  isToday: boolean;
  dayName: string;
  dayLabel: string;
  formattedDate: string;
} {
  const target = parseISODate(dateStr);
  const today = new Date();
  const isToday =
    target.getFullYear() === today.getFullYear() &&
    target.getMonth() === today.getMonth() &&
    target.getDate() === today.getDate();

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayName = dayNames[target.getDay()];
  const monthName = monthNames[target.getMonth()];

  return {
    isToday,
    dayName,
    dayLabel: dayName,
    formattedDate: `${target.getDate()} ${monthName} ${target.getFullYear()}`
  };
}

export function formatDateToDisplay(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const target = parseISODate(dateStr);
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${target.getDate()} ${monthNames[target.getMonth()]} ${target.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export function formatTimeFromISO(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function shiftDate(dateStr: string, days: number): string {
  const current = parseISODate(dateStr);
  current.setDate(current.getDate() + days);
  return formatDateToISO(current);
}

export function isFirstDayOfMonth(date: Date = new Date()): boolean {
  return date.getDate() === 1;
}
