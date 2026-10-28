import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { WeatherBanner } from "@/components/WeatherBanner";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — ${APP_TAGLINE}`, template: `%s · ${APP_NAME}` },
  description:
    "Louez la voiture d'un particulier en Guadeloupe, Martinique, Guyane, Saint-Martin et Saint-Barthélemy. Livraison à l'aéroport, assurance incluse, Garantie Cyclone.",
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0b8379",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <WeatherBanner />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
