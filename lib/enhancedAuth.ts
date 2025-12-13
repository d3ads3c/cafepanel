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
  // First, try to get auth from JWT token
  let auth = await getAuth();

  // If we have auth from JWT, return it
  if (auth) {
    return auth;
  }

  // Fallback: Try to get from LoggedUser cookie
  const loggedUserCookie = request.cookies.get("LoggedUser");
  const loggedUser = loggedUserCookie ? loggedUserCookie.value : null;

  if (!loggedUser) {
    return null;
  }

  try {
    // Fetch user info from backend
    const formData = new FormData();
    formData.append("token", loggedUser);

    const xff = request.headers.get("x-forwarded-for");
    const clientIp = xff
      ? xff.split(",")[0].trim()
      : request.headers.get("x-real-ip") || "";
    if (clientIp) formData.append("ipaddress", clientIp);

    const backendResponse = await fetch("http://localhost:8000/user/info", {
      method: "POST",
      body: formData,
    });

    const backendData = await backendResponse.json();
    if (backendData?.Permissions !== undefined) {
      // Create a pseudo AuthPayload from backend response
      const parsedPermissions = parsePermissions(backendData.Permissions);
      // Convert Persian plan name to English (پایه => basic, حرفه‌ای => pro, ویژه => advance)
      const normalizedPlan = normalizePlan(backendData.Plan);
      const enhancedAuth: AuthPayload = {
        userId: backendData.ID,
        username: backendData.Fname || "User",
        plan: normalizedPlan,
        cafename: backendData.CafeName,
        permissions: parsedPermissions,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      };

      return enhancedAuth;
    }

    return null;
  } catch (error) {
    console.error("[Enhanced Auth] Error fetching from backend");
    return null;
  }
}
