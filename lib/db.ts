import mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';

// Base database configuration (without specific database)
const baseDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'N@m@var',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10, // Reduced per-pool limit since we'll have multiple pools
  queueLimit: 0,
};

// Default database configuration (for fallback)
const defaultDbConfig = {
  ...baseDbConfig,
  database: process.env.DB_NAME || '',
};

// Create default connection pool
const pool = mysql.createPool(defaultDbConfig);

// Cache for dynamic pools (keyed by database name)
const poolCache = new Map<string, Pool>();

/**
 * Create or get a cached pool for a specific database
 * @param dbName - The database name to connect to
 */
function getOrCreateDynamicPool(dbName: string): Pool {
  // Check if pool already exists in cache
  if (poolCache.has(dbName)) {
    return poolCache.get(dbName)!;
  }

  // Create new pool and cache it
  const newPool = mysql.createPool({
    ...baseDbConfig,
    database: dbName,
  });

  poolCache.set(dbName, newPool);
  return newPool;
}

/**
 * Create a dynamic pool for a specific database
 * @param dbName - The database name to connect to
 * @deprecated Use getOrCreateDynamicPool instead to avoid creating duplicate pools
 */
export function createDynamicPool(dbName: string) {
  return getOrCreateDynamicPool(dbName);
}

/**
 * Get a connection from the default pool
 */
export async function getConnection() {
  return await pool.getConnection();
}

/**
 * Get a connection from a cached dynamic pool for a specific database
 * Pools are cached and reused to prevent connection exhaustion
 * @param dbName - The database name to connect to
 */
export async function getDynamicConnection(dbName: string) {
  const dynamicPool = getOrCreateDynamicPool(dbName);
  return await dynamicPool.getConnection();
}

/**
 * Clean up a pool from cache (useful for cleanup operations)
 * @param dbName - The database name whose pool should be removed
 */
export function removePoolFromCache(dbName: string) {
  const pool = poolCache.get(dbName);
  if (pool) {
    pool.end();
    poolCache.delete(dbName);
  }
}

/**
 * Clean up all cached pools (useful for shutdown)
 */
export function clearPoolCache() {
  for (const [dbName, pool] of poolCache.entries()) {
    pool.end();
  }
  poolCache.clear();
}

export default pool;
