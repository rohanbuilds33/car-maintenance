// src/domain/maintenance.ts

export type MaintenanceKey =
  | "oil_change"
  | "tire_rotation"
  | "cvt_fluid"
  | "engine_air_filter"
  | "cabin_air_filter"
  | "brake_fluid"
  | "spark_plugs"
  | "coolant";

export type Interval = {
  // Due by mileage
  miles?: number;
  // Due by time
  days?: number;
};

export type MaintenanceDef = {
  key: MaintenanceKey;
  title: string;
  interval: Interval;
  leadMiles: number; // warn before due (miles)
  leadDays: number;  // warn before due (days)
  notes?: string;
};

const DAYS = {
  MONTH: 30,
  YEAR: 365,
};

// Default schedule for 2024 Acura Integra (CVT)
export const DEFAULT_MAINTENANCE_DEFS: MaintenanceDef[] = [
  {
    key: "oil_change",
    title: "Oil change",
    interval: { miles: 5500, days: 6 * DAYS.MONTH },
    leadMiles: 500,
    leadDays: 14,
    notes: "Every 5–6k miles or 6 months (whichever comes first).",
  },
  {
    key: "tire_rotation",
    title: "Tire rotation",
    interval: { miles: 5500, days: 6 * DAYS.MONTH },
    leadMiles: 500,
    leadDays: 14,
    notes: "Usually done with oil changes.",
  },
  {
    key: "cvt_fluid",
    title: "CVT fluid",
    interval: { miles: 35000 },
    leadMiles: 1500,
    leadDays: 0,
    notes: "30–40k miles; default set to 35k.",
  },
  {
    key: "engine_air_filter",
    title: "Engine air filter",
    interval: { miles: 15000 },
    leadMiles: 1000,
    leadDays: 0,
  },
  {
    key: "cabin_air_filter",
    title: "Cabin air filter",
    interval: { miles: 15000 },
    leadMiles: 1000,
    leadDays: 0,
  },
  {
    key: "brake_fluid",
    title: "Brake fluid",
    interval: { days: 3 * DAYS.YEAR },
    leadMiles: 0,
    leadDays: 30,
  },
  {
    key: "spark_plugs",
    title: "Spark plugs",
    interval: { miles: 60000 },
    leadMiles: 3000,
    leadDays: 0,
  },
  {
    key: "coolant",
    title: "Coolant",
    interval: { miles: 100000, days: 10 * DAYS.YEAR },
    leadMiles: 5000,
    leadDays: 60,
  },
];
