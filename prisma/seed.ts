/* Données de démonstration Woulé : `npm run db:seed` */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computePrice } from "../src/lib/pricing";
import { blurPosition, findCommune, findHub } from "../src/lib/territories";
import type { InsurancePlan, PickupOption } from "../src/lib/constants";

const prisma = new PrismaClient();
const DAY = 24 * 3600 * 1000;
const PASSWORD = "woule2026";

type V = {
  owner: string;
  make: string;
  model: string;
  year: number;
  category: string;
  transmission: "MANUELLE" | "AUTOMATIQUE";
  fuel: "ESSENCE" | "DIESEL" | "HYBRIDE" | "ELECTRIQUE";
  price: number;
  territory: string;
  commune: string;
  color: string;
  seats?: number;
  doors?: number;
  instant?: boolean;
  airport?: boolean;
  port?: boolean;
  ferry?: boolean;
  track?: boolean;
  features?: string[];
  description: string;
};

const VEHICLES: V[] = [
  // Guadeloupe
  { owner: "proprio", make: "Peugeot", model: "208", year: 2021, category: "CITADINE", transmission: "MANUELLE", fuel: "ESSENCE", price: 32, territory: "guadeloupe", commune: "Les Abymes", color: "#e44a24", instant: true, airport: true, features: ["Bluetooth", "Apple CarPlay / Android Auto", "Caméra de recul"], description: "Petite citadine nerveuse et économique, idéale pour faire le tour de la Grande-Terre. Je vous la livre à Pôle Caraïbes à votre descente d'avion." },
  { owner: "proprio", make: "Dacia", model: "Duster", year: 2020, category: "SUV", transmission: "MANUELLE", fuel: "DIESEL", price: 45, territory: "guadeloupe", commune: "Sainte-Anne", color: "#c2410c", ferry: true, features: ["Galerie / porte-surf", "Glacière", "Bluetooth"], description: "Robuste et spacieux, parfait pour une famille. Autorisé sur le ferry pour Marie-Galante : glacière et galerie fournies pour vos journées plage !" },
  { owner: "ruddy", make: "Toyota", model: "Yaris Hybride", year: 2022, category: "CITADINE", transmission: "AUTOMATIQUE", fuel: "HYBRIDE", price: 38, territory: "guadeloupe", commune: "Le Gosier", color: "#f8fafc", instant: true, airport: true, port: true, features: ["Bluetooth", "GPS", "Régulateur de vitesse", "Caméra de recul"], description: "Hybride automatique très confortable dans les bouchons de la rocade. Consommation ridicule, clim au top." },
  { owner: "ruddy", make: "Renault", model: "Clio", year: 2019, category: "CITADINE", transmission: "MANUELLE", fuel: "ESSENCE", price: 28, territory: "guadeloupe", commune: "Saint-François", color: "#2563eb", features: ["Bluetooth"], description: "Clio fiable, entretenue chez Renault. Idéale pour rayonner autour de Saint-François et de la Pointe des Châteaux." },
  { owner: "josette", make: "Kia", model: "Picanto", year: 2020, category: "CITADINE", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 27, territory: "guadeloupe", commune: "Pointe-à-Pitre", color: "#16a34a", port: true, features: ["Bluetooth"], description: "Petite auto facile à garer à Pointe-à-Pitre. Livraison possible à la gare maritime de Bergevin." },
  { owner: "josette", make: "Suzuki", model: "Jimny", year: 2021, category: "QUATRE_QUATRE", transmission: "MANUELLE", fuel: "ESSENCE", price: 65, territory: "guadeloupe", commune: "Deshaies", color: "#65a30d", seats: 4, doors: 3, features: ["Bluetooth", "Galerie / porte-surf"], description: "Le Jimny pour explorer la Basse-Terre : chutes du Carbet, route de la Traversée, plage de Grande-Anse. Increvable !" },
  { owner: "ruddy", make: "Peugeot", model: "5008", year: 2021, category: "MONOSPACE", transmission: "AUTOMATIQUE", fuel: "DIESEL", price: 70, territory: "guadeloupe", commune: "Baie-Mahault", color: "#334155", seats: 7, airport: true, instant: true, features: ["Siège bébé", "Rehausseur", "GPS", "Apple CarPlay / Android Auto", "Caméra de recul"], description: "7 places, idéal pour les familles et les retrouvailles avec la famanmi. Siège bébé et rehausseur fournis sur demande." },
  { owner: "josette", make: "Yamaha", model: "NMAX 125", year: 2022, category: "SCOOTER", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 22, territory: "guadeloupe", commune: "Grand-Bourg", color: "#0ea5e9", seats: 2, doors: 0, features: ["Casque (scooter)", "Top-case (scooter)"], description: "Le meilleur moyen de découvrir Marie-Galante : Capesterre, la plage de la Feuillère, les distilleries… 2 casques fournis." },
  { owner: "josette", make: "Moke", model: "e-Moke électrique", year: 2023, category: "CABRIOLET", transmission: "AUTOMATIQUE", fuel: "ELECTRIQUE", price: 55, territory: "guadeloupe", commune: "Terre-de-Haut", color: "#fbbf24", seats: 4, doors: 0, features: ["Parasol & chaises de plage"], description: "Le buggy électrique parfait pour Terre-de-Haut aux Saintes. Silencieux, fun, et on recharge sur une prise normale." },
  { owner: "ruddy", make: "Renault", model: "Kangoo Van", year: 2018, category: "UTILITAIRE", transmission: "MANUELLE", fuel: "DIESEL", price: 50, territory: "guadeloupe", commune: "Lamentin", color: "#f1f5f9", seats: 2, features: ["Attelage"], description: "Utilitaire 3 m³ pour vos déménagements ou l'achat de matériaux à Jarry." },
  // Martinique
  { owner: "maryse", make: "Renault", model: "Captur", year: 2022, category: "SUV", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 48, territory: "martinique", commune: "Le Lamentin", color: "#ea580c", instant: true, airport: true, features: ["GPS", "Apple CarPlay / Android Auto", "Caméra de recul", "Régulateur de vitesse"], description: "SUV automatique récent, livré à l'aéroport Aimé Césaire. Parfait pour la route de la Trace et le Nord Caraïbe." },
  { owner: "maryse", make: "Citroën", model: "C3", year: 2020, category: "CITADINE", transmission: "MANUELLE", fuel: "ESSENCE", price: 30, territory: "martinique", commune: "Fort-de-France", color: "#7c3aed", port: true, features: ["Bluetooth"], description: "Citadine pratique, je peux vous l'apporter au terminal inter-îles si vous arrivez en ferry de la Dominique ou de Sainte-Lucie." },
  { owner: "joel", make: "Volkswagen", model: "Polo", year: 2019, category: "CITADINE", transmission: "MANUELLE", fuel: "ESSENCE", price: 29, territory: "martinique", commune: "Le Robert", color: "#0f766e", features: ["Bluetooth", "Régulateur de vitesse"], description: "Polo bien entretenue, idéale pour visiter la côte Atlantique et la presqu'île de la Caravelle." },
  { owner: "joel", make: "Toyota", model: "Hilux", year: 2019, category: "QUATRE_QUATRE", transmission: "MANUELLE", fuel: "DIESEL", price: 85, territory: "martinique", commune: "Sainte-Marie", color: "#b91c1c", features: ["Attelage", "Galerie / porte-surf", "Glacière"], description: "Pick-up double cabine pour les aventuriers : accès aux spots de surf de Basse-Pointe et aux randonnées du Nord." },
  { owner: "maryse", make: "Peugeot", model: "2008", year: 2021, category: "SUV", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 44, territory: "martinique", commune: "Les Trois-Îlets", color: "#1d4ed8", airport: true, features: ["GPS", "Bluetooth", "Caméra de recul"], description: "SUV confortable, garé près de la Pointe du Bout. Livraison à l'aéroport possible." },
  { owner: "joel", make: "Piaggio", model: "Liberty 125", year: 2021, category: "SCOOTER", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 20, territory: "martinique", commune: "Sainte-Anne", color: "#f43f5e", seats: 2, doors: 0, instant: true, features: ["Casque (scooter)", "Top-case (scooter)"], description: "Scooter pour filer aux Salines sans chercher de place de parking !" },
  { owner: "maryse", make: "Fiat", model: "500C", year: 2020, category: "CABRIOLET", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 55, territory: "martinique", commune: "Le Diamant", color: "#fb7185", seats: 4, doors: 3, features: ["Bluetooth", "Parasol & chaises de plage"], description: "Toit ouvrant face au Rocher du Diamant… Le cabriolet des vacances." },
  // Guyane
  { owner: "kevin", make: "Toyota", model: "Hilux", year: 2020, category: "QUATRE_QUATRE", transmission: "MANUELLE", fuel: "DIESEL", price: 90, territory: "guyane", commune: "Cayenne", color: "#78716c", airport: true, track: true, features: ["Attelage", "Glacière", "GPS"], description: "Pick-up 4x4 prêt pour les pistes : Cacao, Kaw, Saint-Georges. Pneus tout-terrain neufs, sangles et glacière fournies." },
  { owner: "sandrine", make: "Dacia", model: "Sandero", year: 2021, category: "CITADINE", transmission: "MANUELLE", fuel: "ESSENCE", price: 30, territory: "guyane", commune: "Kourou", color: "#0369a1", instant: true, features: ["Bluetooth"], description: "Idéale pour les missions au CSG ou pour aller voir un lancement d'Ariane depuis la plage." },
  { owner: "kevin", make: "Mitsubishi", model: "L200", year: 2018, category: "QUATRE_QUATRE", transmission: "MANUELLE", fuel: "DIESEL", price: 80, territory: "guyane", commune: "Saint-Laurent-du-Maroni", color: "#44403c", track: true, features: ["Attelage", "Galerie / porte-surf"], description: "4x4 basé à Saint-Laurent, pour Mana, Awala-Yalimapo (tortues luth !) ou Apatou par la piste." },
  { owner: "sandrine", make: "Dacia", model: "Duster", year: 2022, category: "SUV", transmission: "MANUELLE", fuel: "DIESEL", price: 50, territory: "guyane", commune: "Matoury", color: "#15803d", airport: true, track: true, features: ["Bluetooth", "GPS"], description: "Duster 4x4 à 5 min de l'aéroport Félix Éboué. Pistes légères autorisées." },
  { owner: "sandrine", make: "Hyundai", model: "i10", year: 2019, category: "CITADINE", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 32, territory: "guyane", commune: "Rémire-Montjoly", color: "#facc15", features: ["Bluetooth"], description: "Petite automatique pour circuler entre Cayenne, Rémire et Matoury." },
  // Saint-Martin
  { owner: "patricia", make: "Jeep", model: "Wrangler", year: 2019, category: "QUATRE_QUATRE", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 95, territory: "saint-martin", commune: "Grand-Case", color: "#0891b2", seats: 4, airport: true, instant: true, features: ["Bluetooth", "Glacière"], description: "Jeep décapotable pour Pinel, la Baie Orientale et Pic Paradis. Livraison à l'aéroport de Grand-Case." },
  { owner: "patricia", make: "Nissan", model: "Micra", year: 2018, category: "CITADINE", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 35, territory: "saint-martin", commune: "Marigot", color: "#a21caf", port: true, features: ["Bluetooth"], description: "Petite automatique pratique pour Marigot et Sandy Ground. Je peux la déposer à la gare maritime." },
  // Saint-Barthélemy
  { owner: "steeve", make: "Suzuki", model: "Jimny", year: 2020, category: "QUATRE_QUATRE", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 90, territory: "saint-barthelemy", commune: "Saint-Jean", color: "#f97316", seats: 4, doors: 3, airport: true, instant: true, features: ["Bluetooth"], description: "Le classique de St-Barth : automatique, petit gabarit, grimpe partout. Livré au pied de l'avion." },
  { owner: "steeve", make: "Mini", model: "Cooper Cabrio", year: 2021, category: "CABRIOLET", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 120, territory: "saint-barthelemy", commune: "Gustavia", color: "#14b8a6", seats: 4, doors: 3, port: true, features: ["GPS", "Bluetooth"], description: "Cabriolet pour profiter de Shell Beach et du coucher de soleil à Colombier." },
  { owner: "steeve", make: "Kymco", model: "Agility 125", year: 2022, category: "SCOOTER", transmission: "AUTOMATIQUE", fuel: "ESSENCE", price: 40, territory: "saint-barthelemy", commune: "Gustavia", color: "#64748b", seats: 2, doors: 0, features: ["Casque (scooter)", "Top-case (scooter)"], description: "Scooter parfait pour se garer facilement à Gustavia." },
];

const REVIEWS_TO_OWNER = [
  "Véhicule impeccable et propriétaire adorable, il nous a même donné ses bons plans pour manger un bokit !",
  "Remise des clés à l'aéroport en 5 minutes, voiture propre et climatisée. Je recommande à 100 %.",
  "Très bonne expérience, rien à redire. Mèsi !",
  "Voiture conforme à l'annonce, propriétaire très réactif sur la messagerie.",
  "Parfait pour nos vacances en famille, on reviendra l'an prochain.",
  "Petit retard à la remise des clés mais tout s'est très bien passé ensuite.",
];
const REVIEWS_TO_RENTER = [
  "Locataire sérieux, véhicule rendu propre et à l'heure.",
  "Très bonne communication, je relouerai avec plaisir.",
  "Aucun souci, merci et à bientôt !",
];

async function main() {
  console.log("🧹 Nettoyage…");
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.message.deleteMany(),
    prisma.inspection.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.vehicleBlock.deleteMany(),
    prisma.vehiclePhoto.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.weatherAlert.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const mkUser = (key: string, data: { firstName: string; lastName: string; territory: string; phone: string; bio?: string; role?: string; licenseYear?: number; birthYear: number; email?: string }) =>
    prisma.user.create({
      data: {
        email: data.email ?? `${key}@woule.test`,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        territory: data.territory,
        phone: data.phone,
        bio: data.bio,
        role: data.role ?? "USER",
        birthDate: new Date(`${data.birthYear}-05-12T12:00:00Z`),
        licenseNumber: `${data.territory.slice(0, 2).toUpperCase()}${Math.floor(100000 + Math.random() * 899999)}`,
        licenseIssuedAt: data.licenseYear ? new Date(`${data.licenseYear}-03-01T12:00:00Z`) : null,
        licenseStatus: data.licenseYear ? "VERIFIED" : "NONE",
        iban: data.role === "ADMIN" ? null : "FR7630004000031234567890143",
        createdAt: new Date(Date.now() - (200 + Math.random() * 500) * DAY),
      },
    });

  console.log("👥 Utilisateurs…");
  const users: Record<string, Awaited<ReturnType<typeof mkUser>>> = {
    admin: await mkUser("admin", { firstName: "Équipe", lastName: "Woulé", territory: "guadeloupe", phone: "+590 590 00 00 00", role: "ADMIN", birthYear: 1985, licenseYear: 2004 }),
    proprio: await mkUser("proprio", { firstName: "Josiane", lastName: "Bélair", territory: "guadeloupe", phone: "+590 690 11 22 33", birthYear: 1978, licenseYear: 1997, bio: "Abymienne, maman de deux grands. Je loue mes voitures quand je suis en déplacement en Hexagone. Toujours disponible pour vous conseiller une bonne table !" }),
    ruddy: await mkUser("ruddy", { firstName: "Ruddy", lastName: "Lancrerot", territory: "guadeloupe", phone: "+590 690 44 55 66", birthYear: 1983, licenseYear: 2002, bio: "Passionné d'automobile, je m'occupe de mes véhicules comme de mes enfants." }),
    josette: await mkUser("josette", { firstName: "Josette", lastName: "Marie-Galante", territory: "guadeloupe", phone: "+590 690 77 88 99", birthYear: 1969, licenseYear: 1990, bio: "Entre Grand-Bourg et Terre-de-Haut, je vous fais découvrir les îles du Sud." }),
    maryse: await mkUser("maryse", { firstName: "Maryse", lastName: "Désiré", territory: "martinique", phone: "+596 696 12 34 56", birthYear: 1975, licenseYear: 1995, bio: "Foyalaise, je propose mes voitures aux visiteurs depuis 3 ans. Bienvenue au pays des fleurs !" }),
    joel: await mkUser("joel", { firstName: "Joël", lastName: "Alexis", territory: "martinique", phone: "+596 696 98 76 54", birthYear: 1988, licenseYear: 2007 }),
    kevin: await mkUser("kevin", { firstName: "Kévin", lastName: "Ho-A-Chuck", territory: "guyane", phone: "+594 694 20 30 40", birthYear: 1990, licenseYear: 2009, bio: "Guide nature à mes heures, je loue des 4x4 équipés pour les pistes guyanaises." }),
    sandrine: await mkUser("sandrine", { firstName: "Sandrine", lastName: "Marie-Sainte", territory: "guyane", phone: "+594 694 50 60 70", birthYear: 1982, licenseYear: 2001 }),
    patricia: await mkUser("patricia", { firstName: "Patricia", lastName: "Fleming", territory: "saint-martin", phone: "+590 690 31 41 59", birthYear: 1980, licenseYear: 1999 }),
    steeve: await mkUser("steeve", { firstName: "Steeve", lastName: "Gréaux", territory: "saint-barthelemy", phone: "+590 690 27 18 28", birthYear: 1986, licenseYear: 2005 }),
    locataire: await mkUser("locataire", { firstName: "Léa", lastName: "Martin", territory: "guadeloupe", phone: "+33 6 12 34 56 78", birthYear: 1994, licenseYear: 2013, bio: "Lyonnaise amoureuse des Antilles, je reviens chaque année voir ma belle-famille." }),
    marc: await mkUser("marc", { firstName: "Marc", lastName: "Dubois", territory: "martinique", phone: "+33 6 98 76 54 32", birthYear: 1979, licenseYear: 1998 }),
    aicha: await mkUser("aicha", { firstName: "Aïcha", lastName: "Benali", territory: "guyane", phone: "+594 694 11 11 11", birthYear: 1999, licenseYear: 2024 }),
    kenny: await mkUser("kenny", { firstName: "Kenny", lastName: "Rosine", territory: "guadeloupe", phone: "+590 690 00 11 22", birthYear: 1996, licenseYear: 2015 }),
  };

  console.log("🚗 Véhicules…");
  const vehicles: Awaited<ReturnType<typeof prisma.vehicle.create>>[] = [];
  for (const [i, v] of VEHICLES.entries()) {
    const c = findCommune(v.territory, v.commune);
    if (!c) throw new Error(`Commune inconnue : ${v.commune}`);
    const [lat, lng] = blurPosition(c.lat, c.lng, `${v.make}${v.model}${i}`);
    vehicles.push(
      await prisma.vehicle.create({
        data: {
          ownerId: users[v.owner].id,
          make: v.make,
          model: v.model,
          year: v.year,
          category: v.category,
          transmission: v.transmission,
          fuel: v.fuel,
          seats: v.seats ?? 5,
          doors: v.doors ?? 5,
          airConditioning: v.category !== "SCOOTER" && v.category !== "CABRIOLET",
          color: v.color,
          features: (v.features ?? []).join(","),
          description: v.description,
          rules: "Non-fumeur. Merci de rincer le sable avant de rendre le véhicule 🏖️.",
          territory: v.territory,
          commune: v.commune,
          address: `Quartier ${v.commune}, à préciser par message`,
          lat,
          lng,
          pricePerDay: v.price * 100,
          depositAmount: v.category === "SCOOTER" ? 40000 : v.price >= 80 ? 150000 : 80000,
          kmIncludedPerDay: v.territory === "guyane" ? 300 : v.category === "SCOOTER" ? 100 : 200,
          extraKmPrice: v.price >= 80 ? 40 : 25,
          instantBooking: Boolean(v.instant),
          airportDelivery: Boolean(v.airport),
          airportFee: v.territory === "saint-barthelemy" ? 1500 : 2500,
          portDelivery: Boolean(v.port),
          portFee: 2000,
          ferryAllowed: Boolean(v.ferry),
          trackAllowed: Boolean(v.track),
          createdAt: new Date(Date.now() - (30 + i * 7) * DAY),
        },
      }),
    );
  }

  console.log("📅 Réservations et avis…");
  const renters = [users.locataire, users.marc, users.aicha, users.kenny];
  let reviewIdx = 0;

  async function booking(opts: {
    vehicle: (typeof vehicles)[number];
    renter: (typeof renters)[number];
    startInDays: number;
    days: number;
    status: string;
    plan?: InsurancePlan;
    pickup?: PickupOption;
    messages?: [string, string][];
  }) {
    const startAt = new Date(Math.floor((Date.now() + opts.startInDays * DAY) / 3600000) * 3600000);
    const endAt = new Date(startAt.getTime() + opts.days * DAY);
    const plan = opts.plan ?? "CONFORT";
    const pickup = opts.pickup ?? "SUR_PLACE";
    const p = computePrice({ vehicle: opts.vehicle, startAt, endAt, insurancePlan: plan, pickupOption: pickup });
    const hub = pickup === "SUR_PLACE" ? null : findHub(opts.vehicle.territory, pickup);
    const paid = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(opts.status);
    const b = await prisma.booking.create({
      data: {
        vehicleId: opts.vehicle.id,
        renterId: opts.renter.id,
        startAt,
        endAt,
        status: opts.status,
        insurancePlan: plan,
        pickupOption: pickup,
        pickupLabel: hub?.name ?? opts.vehicle.commune,
        days: p.days,
        basePrice: p.basePrice,
        discount: p.discount,
        deliveryFee: p.deliveryFee,
        insuranceFee: p.insuranceFee,
        serviceFee: p.serviceFee,
        total: p.total,
        ownerPayout: p.ownerPayout,
        deposit: p.deposit,
        paymentStatus: paid ? "PAID" : "UNPAID",
        paymentRef: paid ? `demo_seed_${opts.vehicle.id.slice(-4)}` : null,
        // les réservations futures viennent d'être faites (une demande de plus de 24 h expirerait)
        createdAt: new Date(startAt.getTime() > Date.now() ? Date.now() - 2 * 3600000 : startAt.getTime() - 10 * DAY),
      },
    });
    for (const [i, [who, body]] of (opts.messages ?? []).entries()) {
      await prisma.message.create({
        data: {
          bookingId: b.id,
          senderId: who === "renter" ? opts.renter.id : opts.vehicle.ownerId,
          body,
          createdAt: new Date(b.createdAt.getTime() + (i + 1) * 3600000),
          readAt: opts.status === "COMPLETED" ? new Date() : null,
        },
      });
    }
    if (opts.status === "COMPLETED") {
      const startKm = 20000 + Math.floor(Math.random() * 60000);
      await prisma.inspection.createMany({
        data: [
          { bookingId: b.id, authorId: opts.vehicle.ownerId, type: "CHECKIN", mileage: startKm, fuelLevel: 8, createdAt: startAt },
          { bookingId: b.id, authorId: opts.renter.id, type: "CHECKOUT", mileage: startKm + opts.days * 80, fuelLevel: 7, cleanliness: "CORRECT", createdAt: endAt },
        ],
      });
      const rating = reviewIdx % 5 === 4 ? 4 : 5;
      await prisma.review.create({
        data: {
          bookingId: b.id,
          vehicleId: opts.vehicle.id,
          authorId: opts.renter.id,
          targetUserId: opts.vehicle.ownerId,
          direction: "RENTER_TO_OWNER",
          rating,
          comment: REVIEWS_TO_OWNER[reviewIdx % REVIEWS_TO_OWNER.length],
          createdAt: new Date(endAt.getTime() + DAY),
        },
      });
      await prisma.review.create({
        data: {
          bookingId: b.id,
          vehicleId: opts.vehicle.id,
          authorId: opts.vehicle.ownerId,
          targetUserId: opts.renter.id,
          direction: "OWNER_TO_RENTER",
          rating: 5,
          comment: REVIEWS_TO_RENTER[reviewIdx % REVIEWS_TO_RENTER.length],
          createdAt: new Date(endAt.getTime() + DAY),
        },
      });
      reviewIdx++;
    }
    return b;
  }

  // Historique : plusieurs locations terminées sur la plupart des véhicules
  for (const [i, v] of vehicles.entries()) {
    const count = i % 4 === 3 ? 0 : (i % 3) + 1;
    for (let k = 0; k < count; k++) {
      await booking({ vehicle: v, renter: renters[(i + k) % renters.length], startInDays: -20 - k * 25 - (i % 5) * 3, days: 3 + ((i + k) % 5), status: "COMPLETED" });
    }
  }

  const [p208, duster, yaris] = vehicles;
  const captur = vehicles[10];

  // Démo locataire : une location confirmée à venir en Martinique
  await booking({
    vehicle: captur,
    renter: users.locataire,
    startInDays: 9,
    days: 6,
    status: "CONFIRMED",
    pickup: "AEROPORT",
    plan: "SERENITE",
    messages: [
      ["renter", "Bonjour Maryse ! J'atterris à 15 h 40 avec le vol d'Air Caraïbes, c'est bon pour vous ?"],
      ["owner", "Bonjour Léa, pas de souci, je serai au parking P1 avec une pancarte 😊 Bon vol !"],
    ],
  });
  // Démo propriétaire : une demande à accepter sur le Duster
  await booking({
    vehicle: duster,
    renter: users.kenny,
    startInDays: 5,
    days: 4,
    status: "PENDING",
    messages: [["renter", "Bonjour Josiane, je voudrais le Duster pour aller à Marie-Galante avec des amis ce week-end. Le ferry est bien autorisé ?"]],
  });
  // Demande acceptée en attente de paiement (démo locataire)
  await booking({ vehicle: yaris, renter: users.locataire, startInDays: 20, days: 3, status: "AWAITING_PAYMENT", pickup: "AEROPORT" });
  // Location en cours sur la 208
  await booking({ vehicle: p208, renter: users.marc, startInDays: -1, days: 4, status: "IN_PROGRESS", pickup: "AEROPORT" });
  await prisma.inspection.create({
    data: { bookingId: (await prisma.booking.findFirstOrThrow({ where: { vehicleId: p208.id, status: "IN_PROGRESS" } })).id, authorId: p208.ownerId, type: "CHECKIN", mileage: 41250, fuelLevel: 8 },
  });

  // Indisponibilité bloquée par le propriétaire
  await prisma.vehicleBlock.create({
    data: { vehicleId: p208.id, startAt: new Date(Date.now() + 14 * DAY), endAt: new Date(Date.now() + 18 * DAY), reason: "Usage personnel" },
  });

  await prisma.favorite.createMany({
    data: [vehicles[5], vehicles[13], vehicles[22]].map((v) => ({ userId: users.locataire.id, vehicleId: v.id })),
  });

  await prisma.notification.createMany({
    data: [
      { userId: users.proprio.id, title: "Nouvelle demande de location", body: "Kenny souhaite louer votre Dacia Duster (4 j).", link: "/proprietaire" },
      { userId: users.locataire.id, title: "Demande acceptée 🎉", body: "Ruddy a accepté votre demande pour la Toyota Yaris Hybride. Finalisez le paiement.", link: "/compte/locations" },
    ],
  });

  // Une demande de permis à vérifier pour l'admin
  await prisma.user.update({ where: { id: users.aicha.id }, data: { licenseStatus: "PENDING" } });

  const stats = { users: await prisma.user.count(), vehicles: await prisma.vehicle.count(), bookings: await prisma.booking.count(), reviews: await prisma.review.count() };
  console.log("✅ Terminé :", stats);
  console.log(`\nComptes de démo (mot de passe : ${PASSWORD}) :\n  locataire@woule.test  — Léa, locataire\n  proprio@woule.test    — Josiane, propriétaire en Guadeloupe\n  admin@woule.test      — administration`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
