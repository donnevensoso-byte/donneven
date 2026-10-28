import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { Alert } from "@/components/ui";
import { consumeEmailToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Vérification de l'e-mail", robots: { index: false } };

export default async function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = await consumeEmailToken(token, "verify");
  if (userId) await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
  return (
    <AuthShell title={userId ? "Adresse confirmée 🎉" : "Lien invalide"}>
      {userId ? (
        <Alert tone="success">Merci ! Vous pouvez maintenant publier des annonces et réserver du matériel.</Alert>
      ) : (
        <Alert tone="error">Ce lien a expiré ou a déjà été utilisé. Vous pouvez demander un nouvel e-mail depuis votre compte.</Alert>
      )}
      <Link href="/compte" className="btn-primary mt-6 w-full">Aller à mon compte</Link>
    </AuthShell>
  );
}
