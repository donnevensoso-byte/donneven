import Link from "next/link";
import { prisma } from "@/lib/db";
import { WEATHER_LEVELS, type WeatherLevel } from "@/lib/constants";
import { getTerritory } from "@/lib/territories";

const STYLES: Record<string, string> = {
  JAUNE: "bg-yellow-100 text-yellow-900",
  ORANGE: "bg-orange-100 text-orange-900",
  ROUGE: "bg-red-600 text-white",
  VIOLET: "bg-purple-700 text-white",
  GRIS: "bg-slate-600 text-white",
};

/** Bandeau de vigilance météo : affiché sur tout le site dès qu'une alerte est active. */
export async function WeatherBanner() {
  const alerts = await prisma.weatherAlert.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
  if (alerts.length === 0) return null;
  return (
    <div>
      {alerts.map((a) => {
        const level = WEATHER_LEVELS[a.level as WeatherLevel];
        return (
          <div key={a.id} className={`${STYLES[a.level] ?? STYLES.JAUNE} px-4 py-2 text-center text-sm`}>
            <strong>{getTerritory(a.territory).name} — {level?.label ?? a.level}</strong> : {a.title}
            {level?.severe && (
              <>
                {" "}· <Link href="/aide#cyclone" className="underline">Garantie Cyclone active : annulation remboursée à 100 %</Link>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
