// Données de démonstration (développement uniquement).
export const DEMO_PASSWORD = "zouti-demo";

export const demoUsers = [
  { key: "marie", name: "Marie-Laure Désiré", email: "marie@demo.zouti.gf", commune: "matoury", phone: "0694 12 34 56", bio: "Jardinière passionnée à Matoury. Je loue mon matériel entretenu avec soin." },
  { key: "kevin", name: "Kévin Ho-A-Sim", email: "kevin@demo.zouti.gf", commune: "cayenne", phone: "0694 23 45 67", bio: "Électricien le jour, bricoleur le week-end. Matériel pro en très bon état." },
  { key: "sandra", name: "Sandra Pinas", email: "sandra@demo.zouti.gf", commune: "saint-laurent-du-maroni", phone: "0694 34 56 78", bio: "Saint-Laurent. Kayaks et matériel de fleuve pour vos sorties sur le Maroni." },
  { key: "jean", name: "Jean-Michel Bellony", email: "jean@demo.zouti.gf", commune: "kourou", phone: "0694 45 67 89", bio: "Kourou. Groupe électrogène et matériel de fête pour vos événements." },
  { key: "aline", name: "Aline Taubira-Ferrer", email: "aline@demo.zouti.gf", commune: "remire-montjoly", phone: null, bio: null },
  { key: "yannick", name: "Yannick Lapointe", email: "yannick@demo.zouti.gf", commune: "macouria", phone: "0694 56 78 90", bio: "Je construis mon carbet à Tonate, je partage mes outils de chantier." },
];

type DemoListing = {
  key: string;
  owner: string;
  title: string;
  category: string;
  brand?: string;
  condition: "neuf" | "tres_bon" | "bon" | "correct";
  dayPrice: number; // euros
  weekPrice?: number;
  deposit: number;
  commune: string;
  neighborhood?: string;
  delivery?: boolean;
  emoji: string;
  colors: [string, string];
  description: string;
};

export const demoListings: DemoListing[] = [
  { key: "debrou", owner: "marie", title: "Débroussailleuse thermique Stihl FS 131", category: "jardin", brand: "Stihl FS 131", condition: "tres_bon", dayPrice: 25, weekPrice: 120, deposit: 200, commune: "matoury", neighborhood: "Cogneau-Lamirande", emoji: "🌿", colors: ["#0b6e4f", "#12875f"], description: "Débroussailleuse 4-MIX puissante, idéale pour les terrains envahis après la saison des pluies. Fournie avec tête à fil, lame 3 dents, harnais et lunettes. Mélange 2 % non fourni. Je vous montre le démarrage sur place." },
  { key: "karcher", owner: "kevin", title: "Nettoyeur haute pression Kärcher K5", category: "nettoyage", brand: "Kärcher K5 Full Control", condition: "tres_bon", dayPrice: 20, weekPrice: 90, deposit: 150, commune: "cayenne", neighborhood: "Mont-Lucas", emoji: "🌊", colors: ["#1d4e89", "#3a7bd5"], description: "Parfait pour terrasses, murs moisis, carbets et véhicules. 145 bars, lance Vario + rotabuse, nettoyeur de surfaces T5. Tuyau 8 m." },
  { key: "groupe", owner: "jean", title: "Groupe électrogène 3000 W", category: "energie", brand: "Honda EU30i", condition: "bon", dayPrice: 35, weekPrice: 180, deposit: 400, commune: "kourou", neighborhood: "Centre", delivery: true, emoji: "🔌", colors: ["#7a4b00", "#d68a00"], description: "Groupe inverter silencieux, parfait pour les coupures de courant, les fêtes ou les chantiers sans électricité. Rendu avec le plein, merci de le rendre plein (SP95)." },
  { key: "barnum", owner: "aline", title: "Barnum 3 × 6 m avec côtés", category: "fete", condition: "bon", dayPrice: 30, deposit: 100, commune: "remire-montjoly", neighborhood: "Montjoly", emoji: "⛺", colors: ["#8e2c48", "#d9412b"], description: "Tente de réception blanche 3x6 m avec 4 côtés amovibles (pluie et soleil !). Montage à 2 personnes en 20 minutes. Sac de transport et lests fournis." },
  { key: "kayak", owner: "sandra", title: "Kayak biplace + 2 pagaies + gilets", category: "fleuve", condition: "tres_bon", dayPrice: 30, weekPrice: 150, deposit: 250, commune: "saint-laurent-du-maroni", neighborhood: "Les Écoles", emoji: "🛶", colors: ["#00607a", "#00a3b4"], description: "Kayak sit-on-top stable, idéal pour les criques et le Maroni. Fourni avec 2 pagaies, 2 gilets de sauvetage adultes et un bidon étanche." },
  { key: "betonniere", owner: "yannick", title: "Bétonnière électrique 160 L", category: "construction", condition: "bon", dayPrice: 28, weekPrice: 130, deposit: 250, commune: "macouria", neighborhood: "Tonate", emoji: "🧱", colors: ["#5b5b5b", "#9a8f7c"], description: "Bétonnière 160 litres, moteur 650 W. Idéale pour dalles, fondations de carbet, chapes. Prévoir un pick-up ou une remorque pour le transport." },
  { key: "perfo", owner: "kevin", title: "Perforateur SDS Bosch GBH 2-26", category: "bricolage", brand: "Bosch Professional", condition: "tres_bon", dayPrice: 15, weekPrice: 60, deposit: 120, commune: "cayenne", neighborhood: "Centre", emoji: "🔩", colors: ["#174a7c", "#2b6cb0"], description: "Perforateur-burineur 800 W, coffret avec 5 forets béton et 2 burins. Parfait pour percer le béton, fixer des hamacs ou faire des saignées." },
  { key: "tronco", owner: "marie", title: "Tronçonneuse Husqvarna 445", category: "jardin", brand: "Husqvarna 445", condition: "bon", dayPrice: 30, deposit: 250, commune: "roura", neighborhood: "Cacao", emoji: "🪵", colors: ["#6b3e1f", "#b5651d"], description: "Guide 38 cm, chaîne affûtée à chaque location. Pantalon anti-coupure taille L et casque forestier fournis. Location réservée aux personnes expérimentées." },
  { key: "remorque", owner: "yannick", title: "Remorque 750 kg bâchée", category: "demenagement", condition: "bon", dayPrice: 25, weekPrice: 120, deposit: 300, commune: "matoury", neighborhood: "Balata", emoji: "📦", colors: ["#3d3d3d", "#6e6e6e"], description: "Remorque non freinée PTAC 750 kg, 2,05 × 1,15 m, avec bâche et ridelles. Prise 7 broches. Carte grise fournie (permis B suffisant)." },
  { key: "chaises", owner: "jean", title: "Lot 10 tables + 60 chaises pliantes", category: "fete", condition: "tres_bon", dayPrice: 40, deposit: 150, commune: "kourou", neighborhood: "Village Saramaca", delivery: true, emoji: "🪑", colors: ["#6a1b9a", "#ab47bc"], description: "Pour vos baptêmes, communions et anniversaires : 10 tables rectangulaires 180 cm et 60 chaises pliantes. Livraison possible sur Kourou." },
  { key: "hamacs", owner: "yannick", title: "Kit carbet : 4 hamacs + moustiquaires", category: "carbet", condition: "bon", dayPrice: 12, weekPrice: 50, deposit: 60, commune: "montsinery-tonnegrande", emoji: "🏕️", colors: ["#1b5e20", "#4caf50"], description: "4 hamacs brésiliens, 4 moustiquaires, cordes et une bâche 4×6. Tout pour un week-end en carbet ou en forêt." },
  { key: "sono", owner: "kevin", title: "Enceinte JBL PartyBox 310", category: "fete", brand: "JBL PartyBox 310", condition: "tres_bon", dayPrice: 25, deposit: 200, commune: "cayenne", neighborhood: "Bourda", emoji: "🔊", colors: ["#111827", "#f97316"], description: "Enceinte sur batterie (18 h), lumières, entrée micro et guitare. Parfaite pour les fêtes et les mariages. Micro filaire fourni." },
  { key: "pompe", owner: "jean", title: "Motopompe eaux chargées 2\"", category: "eau", condition: "correct", dayPrice: 20, deposit: 150, commune: "sinnamary", emoji: "💧", colors: ["#0d47a1", "#42a5f5"], description: "Pour vider un bassin, une citerne ou un terrain inondé. Livrée avec 2 tuyaux de 7 m et crépine." },
  { key: "echafaudage", owner: "aline", title: "Échafaudage roulant 6 m", category: "construction", condition: "bon", dayPrice: 22, weekPrice: 100, deposit: 200, commune: "remire-montjoly", neighborhood: "Rémire bourg", emoji: "🏗️", colors: ["#e65100", "#ffb74d"], description: "Hauteur de travail 6 m, plateau 1,8 × 0,7 m, roues freinées. Idéal peinture de façade et toiture." },
  { key: "peinture", owner: "sandra", title: "Pistolet à peinture Wagner", category: "peinture", brand: "Wagner Control Pro 250M", condition: "tres_bon", dayPrice: 18, deposit: 100, commune: "saint-laurent-du-maroni", emoji: "🎨", colors: ["#ad1457", "#f06292"], description: "Pistolet airless pour murs et façades : peint 3 fois plus vite qu'au rouleau. À rendre parfaitement nettoyé (je vous explique comment)." },
  { key: "tondeuse", owner: "marie", title: "Tondeuse thermique tractée", category: "jardin", condition: "bon", dayPrice: 20, deposit: 150, commune: "matoury", emoji: "🌱", colors: ["#33691e", "#8bc34a"], description: "Coupe 51 cm, bac de ramassage 70 L, mulching. Pour les grandes pelouses." },
];
