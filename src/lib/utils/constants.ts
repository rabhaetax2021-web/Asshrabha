// ─── Application Constants ────────────────────────────────────────────────────

export const APP_NAME = 'Ashrabha';
export const APP_NAME_AR = 'أشربها';

// ─── Pagination ───────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ─── Upload ───────────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGES_PER_PRODUCT = 10;

export const UPLOAD_CATEGORIES = {
  PRODUCTS: 'products',
  STORES: 'stores',
  AVATARS: 'avatars',
  LOCATIONS: 'locations',
  CATEGORIES: 'categories',
} as const;

// ─── OTP ──────────────────────────────────────────────────────────────────────

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ─── Rate Limiting ────────────────────────────────────────────────────────────

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MINUTES = 15;

// ─── Password ─────────────────────────────────────────────────────────────────

export const PASSWORD_MIN_LENGTH = 8;
export const BCRYPT_SALT_ROUNDS = 12;

// ─── Order ────────────────────────────────────────────────────────────────────

export const ORDER_PREFIX = 'ASH';

// ─── Stock ────────────────────────────────────────────────────────────────────

export const LOW_STOCK_THRESHOLD = 5;

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const CHAT_MESSAGE_MAX_LENGTH = 1000;
export const CHAT_POLL_INTERVAL = 3000; // 3 seconds

// ─── Notification ─────────────────────────────────────────────────────────────

export const NOTIFICATION_POLL_INTERVAL = 5000; // 5 seconds

// ─── Status Labels ────────────────────────────────────────────────────────────

export const ACCOUNT_STATUS_LABELS = {
  PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
  APPROVED: { en: 'Approved', ar: 'تمت الموافقة' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض' },
  SUSPENDED: { en: 'Suspended', ar: 'موقوف' },
  DISABLED: { en: 'Disabled', ar: 'معطل' },
} as const;

export const ORDER_STATUS_LABELS = {
  PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
  CONFIRMED: { en: 'Confirmed', ar: 'مؤكد' },
  SHIPPED: { en: 'Shipped', ar: 'تم الشحن' },
  DELIVERED: { en: 'Delivered', ar: 'تم التوصيل' },
  COMPLETED: { en: 'Completed', ar: 'مكتمل' },
  CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
  REFUNDED: { en: 'Refunded', ar: 'مسترجع' },
} as const;

export const PRODUCT_STATUS_LABELS = {
  DRAFT: { en: 'Draft', ar: 'مسودة' },
  ACTIVE: { en: 'Active', ar: 'نشط' },
  INACTIVE: { en: 'Inactive', ar: 'غير نشط' },
  ARCHIVED: { en: 'Archived', ar: 'مؤرشف' },
} as const;

export const PROVIDER_PRODUCT_STATUS_LABELS = {
  PENDING_APPROVAL: { en: 'Pending Approval', ar: 'بانتظار الموافقة' },
  APPROVED: { en: 'Approved', ar: 'تمت الموافقة' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض' },
  SUSPENDED: { en: 'Suspended', ar: 'موقوف' },
} as const;

export const WITHDRAW_STATUS_LABELS = {
  PENDING: { en: 'Pending', ar: 'قيد الانتظار' },
  APPROVED: { en: 'Approved', ar: 'تمت الموافقة' },
  REJECTED: { en: 'Rejected', ar: 'مرفوض' },
  PROCESSING: { en: 'Processing', ar: 'قيد المعالجة' },
  COMPLETED: { en: 'Completed', ar: 'مكتمل' },
  FROZEN: { en: 'Frozen', ar: 'مجمد' },
} as const;

// ─── Sidebar Menu Items ───────────────────────────────────────────────────────

export const ADMIN_MENU_ITEMS = [
  { key: 'dashboard', path: '/admin', icon: 'LayoutDashboard' },
  {
    key: 'accounts',
    icon: 'Users',
    children: [
      { key: 'providers', path: '/admin/accounts/providers', icon: 'Store' },
      { key: 'customers', path: '/admin/accounts/customers', icon: 'UserCircle' },
      { key: 'admins', path: '/admin/accounts/admins', icon: 'Shield' },
    ],
  },
  { key: 'categories', path: '/admin/categories', icon: 'Grid3X3' },
  { key: 'catalog', path: '/admin/catalog', icon: 'Package' },
  { key: 'approvals', path: '/admin/approvals', icon: 'ClipboardCheck' },
  { key: 'orders', path: '/admin/orders', icon: 'ShoppingCart' },
  {
    key: 'wallet',
    icon: 'Wallet',
    children: [
      { key: 'wallet', path: '/admin/wallet', icon: 'DollarSign' },
      { key: 'payouts', path: '/admin/wallet/requests', icon: 'ArrowUpRight' },
    ],
  },
  { key: 'support', path: '/admin/support', icon: 'MessageCircle' },
  { key: 'analytics', path: '/admin/analytics', icon: 'BarChart3' },
  { key: 'hero', path: '/admin/hero', icon: 'Image' },
  { key: 'settings', path: '/admin/settings', icon: 'Settings' },
  { key: 'logs', path: '/admin/logs', icon: 'ScrollText' },
] as const;

export const PROVIDER_MENU_ITEMS = [
  { key: 'dashboard', path: '/provider', icon: 'LayoutDashboard' },
  { key: 'store', path: '/provider/store', icon: 'Store' },
  {
    key: 'products',
    icon: 'Package',
    children: [
      { key: 'products', path: '/provider/products', icon: 'List' },
      { key: 'browseCatalog', path: '/provider/products/catalog', icon: 'Search' },
    ],
  },
  { key: 'orders', path: '/provider/orders', icon: 'ShoppingCart' },
  { key: 'wallet', path: '/provider/wallet', icon: 'Wallet' },
  { key: 'suggestions', path: '/provider/suggestions', icon: 'Lightbulb' },
] as const;

export const CUSTOMER_NAV_ITEMS = [
  { key: 'home', path: '/shop', icon: 'Home' },
  { key: 'categories', path: '/shop/categories', icon: 'Grid3X3' },
  { key: 'cart', path: '/shop/cart', icon: 'ShoppingBag' },
  { key: 'orders', path: '/shop/orders', icon: 'Package' },
  { key: 'profile', path: '/shop/profile', icon: 'User' },
] as const;
