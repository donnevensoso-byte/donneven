import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createVehicle } from "@/app/actions/vehicles";
import { VehicleForm } from "@/components/forms/VehicleForm";
import { EMPTY_VEHICLE } from "@/lib/vehicle-form";

export const metadata: Metadata = { title: "Nouvelle annonce" };

export default async function NewVehiclePage() {
  const user = await requireUser("/proprietaire/vehicules/nouveau");
  return (
    <div className="container-app max-w-3xl py-8">
      <h1 className="heading text-3xl">Nouvelle annonce</h1>
      <p className="mb-6 mt-1 text-slate-600">Décrivez votre véhicule. Vous pourrez tout modifier plus tard.</p>
      <VehicleForm action={createVehicle} initial={{ ...EMPTY_VEHICLE, territory: user.territory }} submitLabel="Publier l'annonce" />
    </div>
  );
}
