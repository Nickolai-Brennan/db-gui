import { Pool } from "pg";

export function createTargetPool(targetDatabaseUrl: string) {
  return new Pool({
    connectionString: targetDatabaseUrl,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}
