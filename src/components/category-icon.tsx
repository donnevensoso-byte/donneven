import {
  BrickWall,
  Car,
  Droplets,
  Hammer,
  Leaf,
  type LucideIcon,
  PaintRoller,
  PartyPopper,
  Sailboat,
  SprayCan,
  TentTree,
  Toolbox,
  Truck,
  Zap,
} from "lucide-react";

// Une icône au trait par catégorie : même style partout (puces, badges, liens).
const ICONS: Record<string, LucideIcon> = {
  bricolage: Hammer,
  jardin: Leaf,
  nettoyage: SprayCan,
  construction: BrickWall,
  peinture: PaintRoller,
  energie: Zap,
  eau: Droplets,
  demenagement: Truck,
  auto: Car,
  fete: PartyPopper,
  fleuve: Sailboat,
  carbet: TentTree,
};

export function CategoryIcon({ slug, className = "size-4" }: { slug?: string | null; className?: string }) {
  const Icon = (slug && ICONS[slug]) || Toolbox;
  return <Icon className={className} aria-hidden />;
}
