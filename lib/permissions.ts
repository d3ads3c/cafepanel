import { AuthPayload } from './auth'

export type Permission =
  | 'view_dashboard'
  | 'manage_menu'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_categories'
  | 'manage_users'

export function hasPermission(auth: AuthPayload | null, permission: Permission): boolean {
  if (!auth) return false
  return Array.isArray(auth.permissions) && auth.permissions.includes(permission)
}


