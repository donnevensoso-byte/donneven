import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="Nouveau mot de passe">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
