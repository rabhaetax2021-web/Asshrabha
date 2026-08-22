import type { AdminPermissionType, UserRole } from '@prisma/client';

// ─── Permission Constants ─────────────────────────────────────────────────────

export const ADMIN_PERMISSIONS: AdminPermissionType[] = [
  'MANAGE_PROVIDERS',
  'MANAGE_CUSTOMERS',
  'MANAGE_CATALOG',
  'MANAGE_CATEGORIES',
  'MANAGE_ORDERS',
  'MANAGE_WALLETS',
  'MANAGE_SETTINGS',
  'MANAGE_SUPPORT',
  'VIEW_ANALYTICS',
  'MANAGE_APPROVALS',
  'VIEW_LOGS',
];

// ─── Role Checks ──────────────────────────────────────────────────────────────

export function isAdmin(role: UserRole): boolean {
  const r = (role || '').toString().toUpperCase()
  return r === 'ROOT_ADMIN' || r === 'SUB_ADMIN' || r === 'ADMIN' || r === 'ADMINISTRATOR' || r === 'SUPER_ADMIN'
}

export function isRootAdmin(role: UserRole): boolean {
  const r = (role || '').toString().toUpperCase()
  return r === 'ROOT_ADMIN' || r === 'SUPER_ADMIN'
}

export function isProvider(role: UserRole): boolean {
  return (role || '').toString().toUpperCase() === 'PROVIDER'
}

export function isCustomer(role: UserRole): boolean {
  return (role || '').toString().toUpperCase() === 'CUSTOMER'
}

// ─── Permission Checks ───────────────────────────────────────────────────────

export function hasPermission(
  userRole: UserRole,
  userPermissions: AdminPermissionType[],
  requiredPermission: AdminPermissionType
): boolean {
  // Root admin has all permissions
  const r = (userRole || '').toString().toUpperCase()
  if (r === 'ROOT_ADMIN' || r === 'SUPER_ADMIN') return true;

  // Sub admin must have explicit permission
  if (userRole === 'SUB_ADMIN') {
    return userPermissions.includes(requiredPermission);
  }

  return false;
}

export function hasAnyPermission(
  userRole: UserRole,
  userPermissions: AdminPermissionType[],
  requiredPermissions: AdminPermissionType[]
): boolean {
  const r2 = (userRole || '').toString().toUpperCase()
  if (r2 === 'ROOT_ADMIN' || r2 === 'SUPER_ADMIN') return true;
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

// ─── Route to Permission Mapping ──────────────────────────────────────────────

const ROUTE_PERMISSION_MAP: Record<string, AdminPermissionType> = {
  '/admin/accounts/providers': 'MANAGE_PROVIDERS',
  '/admin/accounts/customers': 'MANAGE_CUSTOMERS',
  '/admin/accounts/admins': 'MANAGE_PROVIDERS', // ROOT only anyway
  '/admin/categories': 'MANAGE_CATEGORIES',
  '/admin/catalog': 'MANAGE_CATALOG',
  '/admin/approvals': 'MANAGE_APPROVALS',
  '/admin/orders': 'MANAGE_ORDERS',
  '/admin/wallet': 'MANAGE_WALLETS',
  '/admin/wallet/add': 'MANAGE_WALLETS',
  '/admin/wallet/requests': 'MANAGE_WALLETS',
  '/admin/support': 'MANAGE_SUPPORT',
  '/admin/analytics': 'VIEW_ANALYTICS',
  '/admin/settings': 'MANAGE_SETTINGS',
  '/admin/logs': 'VIEW_LOGS',
};

export function getRequiredPermissionForRoute(
  pathname: string
): AdminPermissionType | null {
  // Dashboard is accessible to all admins
  if (pathname === '/admin') return null;

  // Check exact match first
  if (ROUTE_PERMISSION_MAP[pathname]) {
    return ROUTE_PERMISSION_MAP[pathname];
  }

  // Check prefix match for dynamic routes
  for (const [route, permission] of Object.entries(ROUTE_PERMISSION_MAP)) {
    if (pathname.startsWith(route)) {
      return permission;
    }
  }

  return null;
}

// ─── Redirect Path by Role ────────────────────────────────────────────────────

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'ROOT_ADMIN':
    case 'SUB_ADMIN':
      return '/admin';
    case 'PROVIDER':
      return '/provider';
    case 'CUSTOMER':
      return '/shop';
    default:
      return '/login';
  }
}
