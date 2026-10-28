/** Minuscules sans accents : « Débroussailleuse » → « debroussailleuse ». */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Prénom + initiale du nom, pour l'affichage public : « Marie-Laure D. ». */
export function publicName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? name;
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

/** Normalise un numéro guyanais (0694…, +594…) au format international pour WhatsApp. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits.slice(1);
  if (/^00\d{8,15}$/.test(digits)) return digits.slice(2);
  if (/^0\d{9}$/.test(digits)) {
    // 0594 (fixe) et 0694 (mobile) : Guyane (+594) ; sinon numéro métropolitain (+33)
    return /^0(594|694)/.test(digits) ? `594${digits.slice(1)}` : `33${digits.slice(1)}`;
  }
  return null;
}

/** N'autorise que les chemins internes (empêche les redirections ouvertes). */
export function safeRedirectPath(value: unknown, fallback = "/compte"): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/\\") ? path : fallback;
}
