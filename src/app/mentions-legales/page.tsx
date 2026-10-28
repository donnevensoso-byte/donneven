import type { Metadata } from "next";
import { ContentPage, ToFill } from "@/components/content-page";
import { CONTACT_EMAIL } from "@/lib/config";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <ContentPage title="Mentions légales">
      <h2>Éditeur</h2>
      <p>
        <ToFill>Raison sociale ou nom de l&apos;entrepreneur</ToFill> – <ToFill>forme juridique et capital</ToFill>
        <br />
        Siège : <ToFill>adresse, 973xx commune</ToFill>, Guyane
        <br />
        SIRET : <ToFill>numéro SIRET</ToFill> – RCS <ToFill>ville</ToFill>
        <br />
        TVA intracommunautaire : <ToFill>le cas échéant</ToFill>
        <br />
        Contact : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <h2>Directeur de la publication</h2>
      <p><ToFill>Prénom Nom</ToFill></p>
      <h2>Hébergement</h2>
      <p><ToFill>Nom de l&apos;hébergeur, adresse, téléphone</ToFill></p>
      <h2>Propriété intellectuelle</h2>
      <p>
        La marque, le logo et les contenus éditoriaux de Zouti sont protégés. Les photos et textes des annonces restent la propriété de leurs
        auteurs, qui accordent à Zouti le droit de les afficher pour les besoins du Service. Fond de carte © contributeurs OpenStreetMap.
      </p>
    </ContentPage>
  );
}
