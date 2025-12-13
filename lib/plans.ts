import { AuthPayload } from './auth'

export type Plan = 'basic' | 'pro' | 'advance'

/**
 * Plan hierarchy: basic < pro < advance
 * Each plan includes all features from lower plans
 */
const PLAN_HIERARCHY: Record<Plan, number> = {
  basic: 1,
  pro: 2,
  advance: 3,
}

/**
 * Mapping from Persian plan names to English
 */
const PLAN_TRANSLATION: Record<string, Plan> = {
  'پایه': 'basic',
  'حرفه‌ای': 'pro',
  'ویژه': 'advance',
}

/**
 * Convert Persian plan name to English plan name
 * @param plan - Plan name in Persian or English
 * @returns English plan name or 'basic' as default
 */
export function normalizePlan(plan: string | null | undefined): Plan {
  if (!plan) return 'basic'
  
  // Trim whitespace
  const trimmedPlan = plan.trim()
  
  // Check if it's already in English (case-insensitive)
  const lowerPlan = trimmedPlan.toLowerCase() as Plan
  if (lowerPlan in PLAN_HIERARCHY) {
    return lowerPlan
  }
  
  // Normalize Persian text by removing zero-width characters for comparison
  // This handles variations like 'حرفه\u200cای' and 'حرفه‌ای'
  const normalizedPersian = trimmedPlan
    .replace(/\u200C/g, '') // Remove zero-width non-joiner
    .replace(/\u200D/g, '') // Remove zero-width joiner
    .replace(/\uFEFF/g, '') // Remove zero-width no-break space
  
  // Check Persian translations (also normalize the keys)
  for (const [persianKey, englishPlan] of Object.entries(PLAN_TRANSLATION)) {
    const normalizedKey = persianKey
      .replace(/\u200C/g, '')
      .replace(/\u200D/g, '')
      .replace(/\uFEFF/g, '')
    if (normalizedPersian === normalizedKey) {
      return englishPlan
    }
  }
  
  // Default to basic if unknown
  return 'basic'
}

/**
 * Check if user's plan meets the required plan level
 * @param userPlan - The user's current plan (can be Persian or English)
 * @param requiredPlan - The minimum required plan
 * @returns true if user plan meets or exceeds required plan
 */
export function hasPlanAccess(
  userPlan: string | null | undefined,
  requiredPlan: Plan
): boolean {
  if (!userPlan) return false

  // Normalize plan (converts Persian to English)
  const normalizedPlan = normalizePlan(userPlan)

  // Compare plan levels
  return PLAN_HIERARCHY[normalizedPlan] >= PLAN_HIERARCHY[requiredPlan]
}

/**
 * Check if user has a specific plan (exact match)
 * @param userPlan - The user's current plan (can be Persian or English)
 * @param plan - The plan to check for
 * @returns true if user has the exact plan
 */
export function hasExactPlan(
  userPlan: string | null | undefined,
  plan: Plan
): boolean {
  if (!userPlan) return false
  const normalizedPlan = normalizePlan(userPlan)
  return normalizedPlan === plan
}

/**
 * Check if user has any of the specified plans
 * @param userPlan - The user's current plan (can be Persian or English)
 * @param plans - Array of plans to check
 * @returns true if user has any of the specified plans
 */
export function hasAnyPlan(
  userPlan: string | null | undefined,
  plans: Plan[]
): boolean {
  if (!userPlan) return false
  const normalizedPlan = normalizePlan(userPlan)
  return plans.includes(normalizedPlan)
}

/**
 * Server-side plan check using AuthPayload
 * @param auth - The auth payload
 * @param requiredPlan - The minimum required plan
 * @returns true if user plan meets or exceeds required plan
 */
export function hasPlan(auth: AuthPayload | null, requiredPlan: Plan): boolean {
  if (!auth) return false
  return hasPlanAccess(auth.plan, requiredPlan)
}

/**
 * Get all features available for a plan
 * @param plan - The plan to get features for
 * @returns Array of available features
 */
export function getPlanFeatures(plan: Plan): string[] {
  const features: Record<Plan, string[]> = {
    basic: [
      'view_dashboard',
      'manage_menu',
      'manage_orders',
      'manage_customers',
      'manage_tables',
    ],
    pro: [
      'view_dashboard',
      'manage_menu',
      'manage_orders',
      'manage_customers',
      'manage_categories',
      'manage_tables',
      'manage_buylist',
    ],
    advance: [
      'view_dashboard',
      'manage_menu',
      'manage_orders',
      'manage_customers',
      'manage_categories',
      'manage_tables',
      'manage_accounting',
      'manage_users',
    ],
  }

  return features[plan] || []
}

