import { AuthPayload } from './auth'
import { hasPlan, type Plan } from './plans'

export type Permission =
  | 'view_dashboard'
  | 'manage_menu'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_categories'
  | 'manage_users'
  | 'manage_tables'
  | 'manage_buylist'
  | 'manage_accounting'
  | 'manage_settings'
  | 'price_list'

/**
 * Mapping of permissions to required plans
 * If a permission is not listed, it requires 'basic' plan (default)
 */
const PERMISSION_PLAN_REQUIREMENTS: Partial<Record<Permission, Plan>> = {
  'view_dashboard': 'basic',
  'manage_menu': 'basic',
  'manage_orders': 'basic',
  'manage_customers': 'basic',
  'manage_categories': 'pro',
  'manage_tables': 'pro',
  'manage_accounting': 'pro',
  'manage_users': 'advance',
  'manage_buylist': 'advance',
  'price_list': 'advance'
}

/**
 * Parse permissions from various formats:
 * - Array: ['manage_orders', 'view_dashboard']
 * - String: 'manage_orders,view_dashboard,manage_customers'
 * - '0' or 0: Grant all permissions
 * @param permissions - The permissions in any format
 * @returns Array of permission strings
 */
export function parsePermissions(permissions: any): string[] {
  // If permissions is '0' or 0, grant all access
  if (permissions === '0' || permissions === 0) {
    return [
      'view_dashboard',
      'manage_menu',
      'manage_orders',
      'manage_customers',
      'manage_categories',
      'manage_users',
      'manage_tables',
      'manage_buylist',
      'manage_accounting',
    ]
  }

  // If it's already an array, return it
  if (Array.isArray(permissions)) {
    return permissions
  }

  // If it's a string, split by comma and trim
  if (typeof permissions === 'string') {
    return permissions
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
  }

  // Default to empty array
  return []
}

/**
 * Check if user has permission AND required plan
 * Even if user has permission, they must also have the required plan
 * @param auth - The auth payload
 * @param permission - The permission to check
 * @returns true only if user has both permission AND required plan
 */
export function hasPermission(auth: AuthPayload | null, permission: Permission): boolean {
  if (!auth) return false

  // First check if user has the permission
  const parsedPermissions = parsePermissions(auth.permissions)
  if (!parsedPermissions.includes(permission)) {
    return false
  }

  // Then check if user has the required plan for this permission
  const requiredPlan = PERMISSION_PLAN_REQUIREMENTS[permission] || 'basic'
  
  // Check if user's plan meets the requirement
  // Even if user has permission, they must have the required plan
  return hasPlan(auth, requiredPlan)
}

/**
 * Check if user has permission without plan requirement (legacy/override)
 * Use this only if you want to check permission regardless of plan
 * @param auth - The auth payload
 * @param permission - The permission to check
 * @returns true if user has permission (ignores plan requirement)
 */
export function hasPermissionOnly(auth: AuthPayload | null, permission: Permission): boolean {
  if (!auth) return false
  const parsedPermissions = parsePermissions(auth.permissions)
  return parsedPermissions.includes(permission)
}

/**
 * Get the required plan for a permission
 * @param permission - The permission to check
 * @returns The minimum required plan for this permission
 */
export function getRequiredPlanForPermission(permission: Permission): Plan {
  return PERMISSION_PLAN_REQUIREMENTS[permission] || 'basic'
}


