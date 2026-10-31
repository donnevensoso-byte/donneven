import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { pendingRequestCount } from "@/lib/services/bookings";
import { unreadConversationCount } from "@/lib/services/messages";
import { unreadNotificationCount } from "@/lib/services/notifications";
import { BottomNav } from "./bottom-nav";
import { Logo } from "./logo";
import { Avatar } from "./ui";

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-1 rounded-full bg-flame-500 px-1.5 text-[11px] leading-[18px] font-bold text-white">{n > 9 ? "9+" : n}</span>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  const [unreadMessages, pendingRequests, unreadNotifications] = user
    ? await Promise.all([unreadConversationCount(user.id), pendingRequestCount(user.id), unreadNotificationCount(user.id)])
    : [0, 0, 0];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="shrink-0" aria-label="Zouti, accueil">
            <Logo />
          </Link>
          <form action="/recherche" className="hidden flex-1 md:block" role="search">
            <label className="sr-only" htmlFor="header-q">
              Chercher du matériel près de chez vous
            </label>
            <input
              id="header-q"
              name="q"
              type="search"
              placeholder="Débroussailleuse, karcher, groupe électrogène…"
              className="input max-w-md rounded-full bg-sand py-2"
            />
          </form>
          <nav className="ml-auto flex items-center gap-1 text-sm font-medium" aria-label="Compte">
            <Link href="/annonces/nouvelle" className="btn-sun hidden md:inline-flex">
              Proposer un outil
            </Link>
            {user ? (
              <>
                <Link href="/messages" className="btn-ghost hidden md:inline-flex">
                  Messages
                  <CountBadge n={unreadMessages} />
                </Link>
                <Link href="/reservations" className="btn-ghost hidden md:inline-flex">
                  Réservations
                  <CountBadge n={pendingRequests} />
                </Link>
                <Link href="/compte/notifications" className="btn-ghost relative px-2.5" aria-label={`Notifications${unreadNotifications ? ` (${unreadNotifications} non lues)` : ""}`}>
                  <span aria-hidden>🔔</span>
                  {unreadNotifications > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-flame-500" />}
                </Link>
                <Link href="/compte" className="hidden items-center gap-2 rounded-full py-1 pr-1 pl-3 hover:bg-black/5 md:inline-flex" aria-label="Mon compte">
                  <span className="max-w-28 truncate">{user.name.split(" ")[0]}</span>
                  <Avatar name={user.name} imageId={user.avatarImageId} size={32} />
                </Link>
              </>
            ) : (
              <>
                <Link href="/connexion" className="btn-ghost">
                  Connexion
                </Link>
                <Link href="/inscription" className="btn-primary hidden sm:inline-flex">
                  Inscription
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <BottomNav loggedIn={Boolean(user)} unreadMessages={unreadMessages} pendingRequests={pendingRequests} />
    </>
  );
}
