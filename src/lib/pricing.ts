import { CATEGORIES, FEES, INSURANCE_PLANS, type Category, type InsurancePlan, type PickupOption } from "./constants";

export type PricingVehicle = {
  category: string;
  pricePerDay: number;
  weeklyDiscountPct: number;
  monthlyDiscountPct: number;
  depositAmount: number;
  airportDelivery: boolean;
  airportFee: number;
  portDelivery: boolean;
  portFee: number;
};

export type PriceInput = {
  vehicle: PricingVehicle;
  startAt: Date;
  endAt: Date;
  insurancePlan: InsurancePlan;
  pickupOption: PickupOption;
  youngDriver?: boolean;
};

export type PriceBreakdown = {
  days: number;
  basePrice: number;
  discount: number;
  discountPct: number;
  deliveryFee: number;
  insuranceFee: number;
  youngDriverFee: number;
  serviceFee: number;
  total: number;
  ownerPayout: number;
  deposit: number;
  deductible: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Nombre de jours facturés : tranches de 24 h entamées, minimum 1. */
export function billableDays(startAt: Date, endAt: Date): number {
  const ms = endAt.getTime() - startAt.getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

export function discountPctFor(days: number, v: Pick<PricingVehicle, "weeklyDiscountPct" | "monthlyDiscountPct">): number {
  if (days >= 28) return v.monthlyDiscountPct;
  if (days >= 7) return v.weeklyDiscountPct;
  return 0;
}

export function insurancePerDay(plan: InsurancePlan, category: string): number {
  const factor = CATEGORIES[category as Category]?.insuranceFactor ?? 1;
  return Math.round(INSURANCE_PLANS[plan].perDay * factor);
}

export function deliveryFeeFor(v: PricingVehicle, option: PickupOption): number {
  if (option === "AEROPORT") return v.airportDelivery ? v.airportFee : 0;
  if (option === "PORT") return v.portDelivery ? v.portFee : 0;
  return 0;
}

export function computePrice(input: PriceInput): PriceBreakdown {
  const { vehicle: v, insurancePlan, pickupOption } = input;
  const days = billableDays(input.startAt, input.endAt);
  const basePrice = v.pricePerDay * days;
  const discountPct = discountPctFor(days, v);
  const discount = Math.round((basePrice * discountPct) / 100);
  const rental = basePrice - discount;
  const deliveryFee = deliveryFeeFor(v, pickupOption);
  const insuranceFee = insurancePerDay(insurancePlan, v.category) * days;
  const youngDriverFee = input.youngDriver ? FEES.youngDriverPerDay * days : 0;
  const serviceFee = days === 0 ? 0 : Math.max(FEES.serviceFeeMin, Math.round((rental * FEES.serviceFeePct) / 100));
  const total = rental + deliveryFee + insuranceFee + youngDriverFee + serviceFee;
  const ownerPayout = Math.round(((rental + deliveryFee) * (100 - FEES.ownerCommissionPct)) / 100);
  const deductible = Math.round((v.depositAmount * INSURANCE_PLANS[insurancePlan].deductiblePct) / 100);

  return {
    days,
    basePrice,
    discount,
    discountPct,
    deliveryFee,
    insuranceFee,
    youngDriverFee,
    serviceFee,
    total,
    ownerPayout,
    deposit: v.depositAmount,
    deductible,
  };
}

/** Le conducteur a-t-il son permis depuis moins de N années ? */
export function isYoungDriver(licenseIssuedAt: Date | null | undefined, at: Date = new Date()): boolean {
  if (!licenseIssuedAt) return false;
  const limit = new Date(licenseIssuedAt);
  limit.setFullYear(limit.getFullYear() + FEES.youngDriverYears);
  return limit > at;
}

export function ageAt(birthDate: Date, at: Date = new Date()): number {
  let age = at.getFullYear() - birthDate.getFullYear();
  const m = at.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < birthDate.getDate())) age--;
  return age;
}
