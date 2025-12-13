/**
 * Parse user permissions from the API response Info object
 * Handles the new format where permissions are stored as a comma-separated string
 * or as '0' for all permissions
 */

import { parsePermissions } from './permissions';

export interface UserInfo {
  Fname: string;
  Lname: string;
  Email: string;
  Phone: string;
  RegDate: string;
  Status: string;
  Serial: string;
  Meli: string;
  DB: string;
  Permissions: string | number | string[];
}

/**
 * Parse user info from API response and normalize the data
 * @param apiResponse - The response from /api/auth/me
 * @returns Normalized user info with parsed permissions
 */
export function parseUserInfo(apiResponse: any): UserInfo & { permissionsList: string[] } | null {
  if (!apiResponse?.Info) {
    return null;
  }

  const info = apiResponse.Info;
  const permissionsList = parsePermissions(info.Permissions);

  return {
    Fname: info.Fname || '',
    Lname: info.Lname || '',
    Email: info.Email || '',
    Phone: info.Phone || '',
    RegDate: info.RegDate || '',
    Status: info.Status || '',
    Serial: info.Serial || '',
    Meli: info.Meli || '',
    DB: info.DB || '',
    Permissions: info.Permissions || '0',
    permissionsList,
  };
}

/**
 * Check if user has specific permission
 * @param apiResponse - The response from /api/auth/me
 * @param permission - The permission to check
 * @returns true if user has the permission
 */
export function userHasPermission(
  apiResponse: any,
  permission: string
): boolean {
  const userInfo = parseUserInfo(apiResponse);
  return userInfo ? userInfo.permissionsList.includes(permission) : false;
}

/**
 * Get all user permissions as an array
 * @param apiResponse - The response from /api/auth/me
 * @returns Array of permission strings
 */
export function getUserPermissions(apiResponse: any): string[] {
  const userInfo = parseUserInfo(apiResponse);
  return userInfo ? userInfo.permissionsList : [];
}

/**
 * Get formatted user display name
 * @param apiResponse - The response from /api/auth/me
 * @returns Full name (Fname + Lname) or just Fname if Lname is empty
 */
export function getUserDisplayName(apiResponse: any): string {
  const userInfo = parseUserInfo(apiResponse);
  if (!userInfo) return 'کاربر';
  
  const fullName = `${userInfo.Fname} ${userInfo.Lname}`.trim();
  return fullName || 'کاربر';
}
