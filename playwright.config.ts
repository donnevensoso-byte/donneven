import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/zouti_e2e";
// Les specs préparent leurs données directement dans la même base que le serveur.
process.env.DATABASE_URL = DATABASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    timezoneId: "America/Cayenne",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Nécessite un build préalable : npm run build
    command: `npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL,
      APP_URL: `http://localhost:${PORT}`,
      ADMIN_EMAILS: "admin-e2e@test.gf",
      SMTP_HOST: "",
      STRIPE_SECRET_KEY: "",
    },
  },
});
