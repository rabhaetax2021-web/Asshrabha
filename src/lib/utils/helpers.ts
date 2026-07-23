import { type ClassValue, clsx } from 'clsx';

// ─── Class Names ──────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── Date Formatting ──────────────────────────────────────────────────────────

export function formatDate(date: Date | string, locale: string = 'en'): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string, locale: string = 'en'): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string, locale: string = 'en'): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (locale === 'ar') {
    if (seconds < 60) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return formatDate(date, locale);
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date, locale);
}

// ─── Price Formatting ─────────────────────────────────────────────────────────

export function formatPrice(price: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatCurrency(price: number, locale: string = 'en', currency: string = 'EGP'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

// ─── Number Formatting ────────────────────────────────────────────────────────

export function formatNumber(num: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(num);
}

export function formatCompactNumber(num: number, locale: string = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

// ─── String Helpers ───────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// ─── Localized Field Helper ───────────────────────────────────────────────────

export function getLocalizedField<T extends Record<string, unknown>>(
  item: T,
  field: string,
  locale: string
): string {
  const localizedKey = `${field}${locale === 'ar' ? 'AR' : 'EN'}` as keyof T;
  const fallbackKey = `${field}${locale === 'ar' ? 'EN' : 'AR'}` as keyof T;
  return (item[localizedKey] as string) || (item[fallbackKey] as string) || '';
}

// ─── Order Number Generator ──────────────────────────────────────────────────

export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ASH-${date}-${random}`;
}

// ─── OTP Generator ────────────────────────────────────────────────────────────

export function generateOTP(length: number = 6): string {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

export function normalizeEgyptMobile(mobile: string): string {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('20')) {
    return '0' + digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('2')) {
    return '0' + digits.slice(1);
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }
  return digits;
}

export function normalizeEgyptMobileToE164(mobile: string): string {
  const normalized = normalizeEgyptMobile(mobile);
  if (!normalized) return '';
  if (normalized.startsWith('0')) {
    return '+20' + normalized.slice(1);
  }
  return '+' + normalized;
}

// ─── File Helpers ─────────────────────────────────────────────────────────────

export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}

export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Status Color Mapping ─────────────────────────────────────────────────────

export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'warning',
    PENDING_APPROVAL: 'warning',
    APPROVED: 'success',
    ACTIVE: 'success',
    CONFIRMED: 'info',
    SHIPPED: 'info',
    DELIVERED: 'success',
    COMPLETED: 'success',
    REJECTED: 'error',
    SUSPENDED: 'error',
    DISABLED: 'error',
    CANCELLED: 'error',
    REFUNDED: 'warning',
    FROZEN: 'error',
    DRAFT: 'default',
    INACTIVE: 'default',
    ARCHIVED: 'default',
    MERGED: 'info',
    PROCESSING: 'info',
    FAILED: 'error',
    REVERSED: 'warning',
  };
  return colorMap[status] || 'default';
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
