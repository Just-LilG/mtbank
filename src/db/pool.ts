import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

const globalPool = globalThis as unknown as { ubexPool?: Pool };

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add it before the bank can open the books.");
  }
  if (!globalPool.ubexPool) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5,
    });
    attachDatabasePool(pool);
    globalPool.ubexPool = pool;
  }
  return globalPool.ubexPool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const real = getPool();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
