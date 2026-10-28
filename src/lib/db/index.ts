import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { zoutiSql?: postgres.Sql; zoutiDb?: DB };

function connectionString(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL n'est pas défini. Copiez .env.example vers .env.");
  return url;
}

function createDb(): DB {
  const needsSsl = /sslmode=require/.test(process.env.DATABASE_URL ?? "");
  const client = postgres(connectionString(), {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    ssl: needsSsl ? "require" : undefined,
    onnotice: () => {},
  });
  globalForDb.zoutiSql = client;
  return drizzle(client, { schema });
}

/** Connexion partagée (réutilisée entre les rechargements à chaud en dev). */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    globalForDb.zoutiDb ??= createDb();
    const value = Reflect.get(globalForDb.zoutiDb, prop);
    return typeof value === "function" ? value.bind(globalForDb.zoutiDb) : value;
  },
});

export async function closeDb() {
  await globalForDb.zoutiSql?.end({ timeout: 5 });
  globalForDb.zoutiSql = undefined;
  globalForDb.zoutiDb = undefined;
}

export { schema };
