"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: string; badge?: number; match: (path: string) => boolean };

export function BottomNav({ loggedIn, unreadMessages, pendingRequests }: { loggedIn: boolean; unreadMessages: number; pendingRequests: number }) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/", label: "Accueil", icon: "🏠", match: (p) => p === "/" },
    { href: "/recherche", label: "Chercher", icon: "🔍", match: (p) => p.startsWith("/recherche") },
    { href: "/annonces/nouvelle", label: "Publier", icon: "➕", match: (p) => p === "/annonces/nouvelle" },
    { href: "/messages", label: "Messages", icon: "💬", badge: unreadMessages, match: (p) => p.startsWith("/messages") },
    loggedIn
      ? { href: "/compte", label: "Compte", icon: "👤", badge: pendingRequests, match: (p) => p.startsWith("/compte") || p.startsWith("/reservations") }
      : { href: "/connexion", label: "Connexion", icon: "👤", match: (p) => p.startsWith("/connexion") || p.startsWith("/inscription") },
  ];
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden print:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-brand-700" : "text-muted"}`}
              >
                <span className={`text-lg leading-none ${active ? "" : "grayscale"}`} aria-hidden>
                  {item.icon}
                </span>
                {item.label}
                {item.badge ? (
                  <span className="absolute top-1 left-1/2 ml-2 min-w-4 rounded-full bg-flame-500 px-1 text-center text-[10px] leading-4 font-bold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
