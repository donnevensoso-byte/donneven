import Link from "next/link";
import type { ReactNode } from "react";

export function imageUrl(id: string, size: "full" | "thumb" = "full") {
  return `/api/images/${id}${size === "thumb" ? "?s=thumb" : ""}`;
}

export function Avatar({ name, imageId, size = 40 }: { name: string; imageId?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  if (imageId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl(imageId, "thumb")}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function Stars({ value, count, size = "sm" }: { value: number | null; count?: number; size?: "sm" | "md" }) {
  if (value == null || count === 0) {
    return <span className={`text-muted ${size === "md" ? "text-sm" : "text-xs"}`}>Nouveau</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${size === "md" ? "text-sm" : "text-xs"}`}>
      <span className="text-sun-600" aria-hidden>
        ★
      </span>
      {value.toFixed(1).replace(".", ",")}
      {count != null && <span className="font-normal text-muted">({count})</span>}
      <span className="sr-only">sur 5</span>
    </span>
  );
}

const tones = {
  neutral: "bg-black/5 text-ink",
  green: "bg-brand-50 text-brand-700",
  yellow: "bg-sun-100 text-sun-600",
  red: "bg-flame-500/10 text-flame-500",
} as const;

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: string;
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && (
        <Link href={action.href} className="btn-primary mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "error" | "success" | "warning"; children: ReactNode }) {
  const styles = {
    info: "border-brand-200 bg-brand-50 text-brand-800",
    success: "border-brand-200 bg-brand-50 text-brand-800",
    warning: "border-sun-300 bg-sun-100 text-ink",
    error: "border-flame-500/30 bg-flame-500/5 text-flame-500",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
