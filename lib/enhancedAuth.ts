import { NextRequest } from "next/server";
import { getAuth, AuthPayload } from "./auth";
import { parsePermissions } from "./permissions";
import { normalizePlan } from "./plans";

/**
 * Enhanced auth check that tries multiple sources:
 * 1. JWT token from auth_token cookie
 * 2. If JWT fails, check LoggedUser cookie and fetch from backend
 *
 * @param request - The NextRequest object
 * @returns Combined AuthPayload or null
 */
export async function getEnhancedAuth(
  request: NextRequest
): Promise<AuthPayload | null> {
  // getAuth() now uses API verification, so we can just call it directly
  // It will handle the LoggedUser cookie and call the backend API
  return await getAuth();
}
