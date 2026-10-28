import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { unreadCounts } from "@/lib/queries";
import { logout } from "@/app/actions/auth";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

export async function Header() {
  const user = await getCurrentUser();
  const counts = user ? await unreadCounts(user.id) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-sable-50/90 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <Link href="/recherche" className="btn-ghost">Louer un véhicule</Link>
          <Link href="/louer-ma-voiture" className="btn-ghost">Mettre ma voiture en location</Link>
          <Link href="/aide" className="btn-ghost">Aide</Link>
        </nav>
        {user ? (
          <div className="flex items-center gap-1">
            <Link href="/messages" className="relative hidden rounded-full p-2 text-slate-600 hover:bg-slate-100 md:inline-flex" aria-label="Messages">
              <Icon name="chat" />
              {counts!.messages > 0 && <Badge n={counts!.messages} />}
            </Link>
            <Link href="/compte/notifications" className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100" aria-label="Notifications">
              <Icon name="bell" />
              {counts!.notifications > 0 && <Badge n={counts!.notifications} />}
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 hover:bg-slate-100">
                <Avatar user={user} size={34} />
              </summary>
              <div className="card absolute right-0 mt-2 w-60 p-2 text-sm shadow-lg">
                <p className="px-3 py-2 font-semibold">Bonjou, {user.firstName} !</p>
                <MenuLink href="/compte">Mon profil</MenuLink>
                <MenuLink href="/compte/locations">Mes locations</MenuLink>
                <MenuLink href="/compte/favoris">Mes favoris</MenuLink>
                <MenuLink href="/messages">Messages</MenuLink>
                <MenuLink href="/proprietaire">Espace propriétaire</MenuLink>
                {user.role === "ADMIN" && <MenuLink href="/admin">Administration</MenuLink>}
                <form action={logout}>
                  <button className="w-full rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50">Se déconnecter</button>
                </form>
              </div>
            </details>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/connexion" className="btn-ghost hidden sm:inline-flex">Connexion</Link>
            <Link href="/inscription" className="btn-primary">S&apos;inscrire</Link>
          </div>
        )}
      </div>
    </header>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block rounded-lg px-3 py-2 hover:bg-slate-100">
      {children}
    </Link>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-flamboyant-500 px-1 text-[10px] font-bold text-white">
      {n > 9 ? "9+" : n}
    </span>
  );
}
