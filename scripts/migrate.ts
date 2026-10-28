import "dotenv/config";
import { closeDb } from "../src/lib/db";
import { runMigrations } from "../src/lib/db/migrate";

runMigrations()
  .then(() => console.log("✔ Migrations appliquées"))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
