import type { Metadata } from "next";
import { ContentPage, ToFill } from "@/components/content-page";
import { CONTACT_EMAIL } from "@/lib/config";
import { HOSTING, legalIdentity } from "@/lib/legal";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  const id = legalIdentity();
  return (
    <ContentPage title="Mentions légales">
      <h2>Éditeur</h2>
      <p>
        {id.publisher ?? <ToFill>Prénom Nom EI</ToFill>} – {id.status}
        <br />
        Adresse : {id.address ?? <ToFill>adresse, 973xx commune</ToFill>}
        <br />
        SIRET : {id.siret ?? <ToFill>numéro SIRET</ToFill>}
        {id.registration && ` – ${id.registration}`}
        <br />
        TVA : {id.vat}
        <br />
        Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <h2>Directeur de la publication</h2>
      <p>{id.director ?? <ToFill>Prénom Nom</ToFill>}</p>
      <h2>Hébergement</h2>
      <p>
        {HOSTING.name}, {HOSTING.place} – <a href={HOSTING.url}>{HOSTING.url.replace("https://", "")}</a>. Serveurs : {HOSTING.servers}.
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        La marque, le logo et les contenus éditoriaux de Zouti sont protégés. Les photos et textes des annonces restent la propriété de leurs
        auteurs, qui accordent à Zouti le droit de les afficher pour les besoins du Service. Fond de carte © contributeurs OpenStreetMap.
      </p>
    </ContentPage>
  );
}
