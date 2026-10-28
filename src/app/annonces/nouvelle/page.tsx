import type { Metadata } from "next";
import { createListingAction } from "@/app/actions/listings";
import { CommuneOptions } from "@/components/commune-select";
import { ListingForm } from "@/components/listing-form";
import { Alert, PageHeader } from "@/components/ui";
import { isVerified, requireUser } from "@/lib/auth";
import { MAX_PHOTOS } from "@/lib/config";

export const metadata: Metadata = { title: "Proposer un outil" };

export default async function NewListingPage() {
  const user = await requireUser("/annonces/nouvelle");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Proposer un outil" subtitle="Publier une annonce est gratuit. Vous acceptez ou refusez chaque demande." />
      {!isVerified(user) && (
        <div className="mb-5">
          <Alert tone="warning">Confirmez votre adresse e-mail (lien reçu à l&apos;inscription) pour pouvoir publier.</Alert>
        </div>
      )}
      <ListingForm
        action={createListingAction}
        maxPhotos={MAX_PHOTOS}
        communeOptions={<CommuneOptions />}
        defaults={{ commune: user.commune }}
        submitLabel="Publier l'annonce"
      />
    </div>
  );
}
