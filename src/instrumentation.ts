// Applique les migrations de base de données au démarrage du serveur, pour
// qu'un déploiement n'ait besoin que de DATABASE_URL. Désactivable avec
// SKIP_MIGRATIONS=1 (par exemple si plusieurs instances démarrent en même temps).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SKIP_MIGRATIONS !== "1") {
    const { runMigrations } = await import("./lib/db/migrate");
    await runMigrations();
  }
}
