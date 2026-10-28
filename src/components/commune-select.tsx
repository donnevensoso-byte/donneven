import { COMMUNE_AREAS, COMMUNES } from "@/lib/guyane";

export function CommuneOptions() {
  return (
    <>
      {COMMUNE_AREAS.map((area) => (
        <optgroup key={area} label={area}>
          {COMMUNES.filter((c) => c.area === area).map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
