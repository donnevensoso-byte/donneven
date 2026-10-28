import { initials } from "@/lib/format";

export function Avatar({
  user,
  size = 40,
}: {
  user: { firstName: string; lastName?: string; avatarUrl?: string | null };
  size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt={user.firstName} style={style} className="rounded-full object-cover" />;
  }
  return (
    <span style={style} className="inline-flex shrink-0 items-center justify-center rounded-full bg-lagon-100 font-semibold text-lagon-800">
      {initials(user.firstName, user.lastName ?? "")}
    </span>
  );
}
