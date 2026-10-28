import type { Metadata } from "next";
import Link from "next/link";
import { ProfileForm } from "@/components/account-forms";
import { CommuneOptions } from "@/components/commune-select";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAccount } from "@/lib/services/users";

export const metadata: Metadata = { title: "Mon profil" };

export default async function ProfileEditPage() {
  const user = await requireUser("/compte/profil");
  const account = await getAccount(user.id);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader
        title="Mon profil"
        subtitle={<Link href="/compte" className="text-brand-600 hover:underline">← Mon compte</Link>}
      />
      <ProfileForm
        profile={{ name: account.name, commune: account.commune, phone: account.phone, bio: account.bio, avatarImageId: account.avatarImageId }}
        communeOptions={<CommuneOptions />}
      />
      <p className="mt-4 text-sm text-muted">
        Un profil complet (photo, présentation, téléphone) inspire confiance et augmente vos chances de louer.
      </p>
    </div>
  );
}
