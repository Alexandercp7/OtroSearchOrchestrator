import { Pool, createPool } from 'mysql2/promise';

let pool: Pool;

export function getConnection(): Pool {
  if (!pool) {
    pool = createPool({
      host:            process.env.DB_HOST     ?? 'localhost',
      port:            Number(process.env.DB_PORT ?? 3306),
      user:            process.env.DB_USER     ?? 'root',
      password:        process.env.DB_PASSWORD ?? '',
      database:        process.env.DB_NAME     ?? 'search_orchestrator',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}
