import pool, { getDynamicConnection } from '@/lib/db';
import { PoolConnection } from 'mysql2/promise';

/**
 * Execute a query with automatic connection management
 * Ensures the connection is always released after execution
 */
export async function executeQuery<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    return await callback(connection);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Execute a query on a specific user database
 * @param dbName - The database name (UUID) from user info
 * @param callback - The callback function to execute with the connection
 */
export async function executeQueryOnUserDB<T>(
  dbName: string,
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getDynamicConnection(dbName);
    return await callback(connection);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Execute a transaction with automatic connection management and rollback on error
 */
export async function executeTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  let connection: PoolConnection | null = null;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Execute a transaction on a specific user database
 * @param dbName - The database name (UUID) from user info
 * @param callback - The callback function to execute with the connection
 */
export async function executeTransactionOnUserDB<T>(
  dbName: string,
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getDynamicConnection(dbName);
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

