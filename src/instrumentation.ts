// Applique les migrations de base de données au démarrage du serveur, pour
// qu'un déploiement n'ait besoin que de DATABASE_URL. Désactivable avec
// SKIP_MIGRATIONS=1 (par exemple si plusieurs instances démarrent en même temps).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SKIP_MIGRATIONS !== "1") {
    const { runMigrations } = await import("./lib/db/migrate");
    await runMigrations();
  }
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { missingLegalFields } = await import("./lib/legal");
    const missing = missingLegalFields();
    if (missing.length > 0) console.warn(`[Zouti] Mentions légales incomplètes, variables à renseigner : ${missing.join(", ")}`);
    if (!process.env.CONTACT_EMAIL) console.warn("[Zouti] CONTACT_EMAIL n'est pas défini : contact@zouti97.fr est utilisé, vérifiez que cette boîte existe.");
  }
}
