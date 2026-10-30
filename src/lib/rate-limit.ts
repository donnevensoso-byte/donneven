// Limiteur de débit en mémoire (suffisant pour une instance unique).
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

/**
 * Adresse du client pour les limites anti-abus. Chaque proxy ajoute l'adresse qu'il voit
 * à la fin de X-Forwarded-For : seules les dernières entrées sont fiables, le début est
 * écrit par le client. TRUSTED_PROXIES = nombre de proxys devant l'application (1 par défaut).
 */
export function clientIp(headers: Headers, trustedProxies = Number(process.env.TRUSTED_PROXIES ?? 1)): string {
  const chain = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (chain.length > 0) return chain[Math.max(0, chain.length - Math.max(1, trustedProxies))];
  return headers.get("x-real-ip")?.trim() || "local";
}
