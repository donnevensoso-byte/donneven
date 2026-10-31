// Identité légale de l'éditeur et prestataires, affichées dans les mentions légales, les CGU et la
// confidentialité. L'identité se règle par variables d'environnement (dans l'hébergeur), sans toucher au code.

export type LegalIdentity = {
  /** Nom de l'entrepreneur suivi de « EI », ou raison sociale. */
  publisher?: string;
  status: string;
  address?: string;
  siret?: string;
  registration?: string;
  vat: string;
  /** Directeur de la publication (par défaut : l'éditeur). */
  director?: string;
  /** Médiateur de la consommation : nom et site. */
  mediator?: string;
};

const value = (key: string) => process.env[key]?.trim() || undefined;

export function legalIdentity(): LegalIdentity {
  const publisher = value("LEGAL_PUBLISHER");
  return {
    publisher,
    status: value("LEGAL_STATUS") ?? "Entrepreneur individuel (micro-entreprise)",
    address: value("LEGAL_ADDRESS"),
    siret: value("LEGAL_SIRET"),
    registration: value("LEGAL_REGISTRATION"),
    vat: value("LEGAL_VAT") ?? "TVA non applicable, article 293 B du CGI",
    director: value("LEGAL_DIRECTOR") ?? publisher,
    mediator: value("LEGAL_MEDIATOR"),
  };
}

/** Champs encore vides : affichés en surbrillance sur les pages et listés au démarrage. */
export function missingLegalFields(): string[] {
  const id = legalIdentity();
  return (["publisher", "address", "siret", "mediator"] as const).filter((k) => !id[k]).map((k) => `LEGAL_${k.toUpperCase()}`);
}

export const HOSTING = {
  name: "Render Services, Inc.",
  place: "San Francisco (Californie, États-Unis)",
  servers: "région de Francfort (Allemagne)",
  url: "https://render.com",
  transfers: "transferts éventuels vers les États-Unis encadrés par le Data Privacy Framework UE–États-Unis",
};

export const EMAIL_PROVIDER = "Brevo (Sendinblue SAS, 17 rue de Salneuve, 75017 Paris)";

export const MAP_TILES_PROVIDER = "la Fondation OpenStreetMap (Royaume-Uni)";
