"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./Icon";

const ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/recherche", label: "Rechercher", icon: "search" },
  { href: "/compte/favoris", label: "Favoris", icon: "heart" },
  { href: "/compte/locations", label: "Locations", icon: "car" },
  { href: "/messages", label: "Messages", icon: "chat" },
  { href: "/compte", label: "Profil", icon: "user" },
];

/** Barre de navigation façon application mobile (masquée sur grand écran). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.href === "/compte" ? pathname === "/compte" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-lagon-700" : "text-slate-500"}`}
              >
                <Icon name={item.icon} className="h-6 w-6" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
