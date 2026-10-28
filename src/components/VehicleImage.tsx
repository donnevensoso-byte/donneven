import { VehicleIllustration } from "./VehicleIllustration";

export function VehicleImage({
  photo,
  category,
  color,
  alt,
  className = "",
}: {
  photo?: string | null;
  category: string;
  color: string;
  alt: string;
  className?: string;
}) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  return <VehicleIllustration category={category} color={color} className={`h-full w-full ${className}`} />;
}
