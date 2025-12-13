import { NextRequest } from "next/server";

/**
 * Get the client IP address from the request
 */
function getClientIpAddress(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback if no IP headers are found
  return "unknown";
}

/**
 * Get the user's database name from the auth/me endpoint
 * This function should be called in API routes that need to access user-specific data
 *
 * @param loggedUserCookie - The LoggedUser cookie value from the request
 * @param clientIpAddress - The client's IP address
 * @returns The database name (UUID) or null if unable to retrieve
 */
export async function getUserDatabase(
  loggedUserCookie: string | null,
  clientIpAddress?: string
): Promise<string | null> {
  if (!loggedUserCookie) {
    return null;
  }

  try {
    // Call the backend to get user info
    const formData = new FormData();
    formData.append("token", loggedUserCookie);
    
    // Add client IP address if provided
    if (clientIpAddress) {
      formData.append("ipaddress", clientIpAddress);
    }

    const backendResponse = await fetch("http://localhost:8000/user/info", {
      method: "POST",
      body: formData,
    });

    const backendData = await backendResponse.json();
    if (backendData && backendData.DB) {
      return backendData.DB;
    }

    return null;
  } catch (error) {
    console.error("Error fetching user database");
    return null;
  }
}

/**
 * Helper to get user DB from request cookies
 */
export async function getUserDatabaseFromRequest(
  request: NextRequest
): Promise<string | null> {
  const loggedUserCookie = request.cookies.get("LoggedUser");
  const loggedUser = loggedUserCookie ? loggedUserCookie.value : null;
  const clientIpAddress = getClientIpAddress(request);
  return getUserDatabase(loggedUser, clientIpAddress);
}
