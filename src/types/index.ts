import type {
  UserRole,
  AccountStatus,
  ProductStatus,
  ProviderProductStatus,
  OrderStatus,
  SuggestionStatus,
  WalletTxType,
  WalletTxStatus,
  WithdrawStatus,
  NotificationType,
  AdminPermissionType,
} from '@prisma/client';

// Re-export Prisma enums for convenience
export type {
  UserRole,
  AccountStatus,
  ProductStatus,
  ProviderProductStatus,
  OrderStatus,
  SuggestionStatus,
  WalletTxType,
  WalletTxStatus,
  WithdrawStatus,
  NotificationType,
  AdminPermissionType,
};

// ─── Session Types ────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  mobile: string;
  nameAR: string | null;
  nameEN: string | null;
  role: UserRole;
  status: AccountStatus;
  forcePasswordReset: boolean;
  locale: string;
  avatar: string | null;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalRevenue: number;
  ordersToday: number;
  activeProviders: number;
  activeCustomers: number;
  pendingApprovals: number;
}

export interface ProviderDashboardStats {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  pendingOrders: number;
  lowStockCount: number;
  walletBalance: number;
}

// ─── Cart Types ───────────────────────────────────────────────────────────────

export interface CartItem {
  providerProductId: string;
  catalogProductId: string;
  providerId: string;
  providerName: string;
  productNameAR: string;
  productNameEN: string;
  image: string | null;
  sellingPrice: number;
  quantity: number;
  maxStock: number;
}

export interface CartProviderGroup {
  providerId: string;
  providerName: string;
  items: CartItem[];
  subtotal: number;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: NotificationType;
  titleAR: string;
  titleEN: string;
  bodyAR: string | null;
  bodyEN: string | null;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Chat Types ───────────────────────────────────────────────────────────────

export interface ChatRoomItem {
  id: string;
  subject: string | null;
  isClosed: boolean;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  participant: {
    id: string;
    nameAR: string | null;
    nameEN: string | null;
    mobile: string;
    avatar: string | null;
  };
}

export interface ChatMessageItem {
  id: string;
  content: string;
  senderId: string;
  senderName: string | null;
  isRead: boolean;
  createdAt: string;
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface LoginFormData {
  mobile: string;
  password: string;
}

export interface RegisterFormData {
  mobile: string;
  password: string;
  confirmPassword: string;
  nameAR: string;
  nameEN: string;
  role: 'CUSTOMER' | 'PROVIDER';
  // Provider-specific
  shopNameAR?: string;
  shopNameEN?: string;
  locationAddress?: string;
  locationPhoto?: File | null;
}

export interface CategoryFormData {
  nameAR: string;
  nameEN: string;
  slug: string;
  icon?: string;
  image?: File | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CatalogProductFormData {
  categoryId: string;
  nameAR: string;
  nameEN: string;
  descriptionAR: string;
  descriptionEN: string;
  images: File[];
  wholesalePrice: number;
  retailPrice: number;
  status: ProductStatus;
}

export interface ProviderProductFormData {
  catalogProductId: string;
  sellingPrice: number;
  wholesalePrice: number;
  wholesaleUnit?: 'BOX' | 'PACK';
  retailPrice: number;
  stockQuantity: number;
}

export interface AddressFormData {
  label: string;
  fullName: string;
  mobile: string;
  addressLine: string;
  city: string;
  area?: string;
  landmark?: string;
  isDefault: boolean;
}

export interface ReviewFormData {
  rating: number;
  comment?: string;
}

export interface WithdrawalFormData {
  amount: number;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface AccountFilter extends PaginationParams {
  status?: AccountStatus;
  role?: UserRole;
}

export interface OrderFilter extends PaginationParams {
  status?: OrderStatus;
  providerId?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductFilter extends PaginationParams {
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}
