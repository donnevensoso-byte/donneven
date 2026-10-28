import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export default async function globalSetup() {
  const client = postgres(process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/zouti_e2e", { max: 1, onnotice: () => {} });
  await client`drop schema if exists public cascade`;
  await client`drop schema if exists drizzle cascade`;
  await client`create schema public`;
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.end();
}
