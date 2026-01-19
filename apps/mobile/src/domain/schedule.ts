// src/domain/schedule.ts

import { DEFAULT_MAINTENANCE_DEFS, MaintenanceDef, MaintenanceKey } from "./maintenance";

export type DueStatus = "OK" | "DUE_SOON" | "OVERDUE";

export type ServiceRecord = {
  key: MaintenanceKey;
  doneAtMileage?: number;
  doneAtDateISO?: string; // YYYY-MM-DD or full ISO
};

export type DueItem = {
  def: MaintenanceDef;
  status: DueStatus;
  milesRemaining?: number; // undefined if that interval not mileage-based
  daysRemaining?: number;  // undefined if that interval not time-based
};

export type ComputeArgs = {
  currentMileage: number;
  todayISO: string; // ISO string (we'll only use the date portion)
  records: ServiceRecord[];
};

function toDateOnlyISO(iso: string): string {
  // Accept "YYYY-MM-DD" or full ISO; normalize to "YYYY-MM-DD"
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function daysBetween(dateA: string, dateB: string): number {
  // dateA/dateB are "YYYY-MM-DD"
  const a = new Date(dateA + "T00:00:00Z").getTime();
  const b = new Date(dateB + "T00:00:00Z").getTime();
  const diff = b - a;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function minDefined(a?: number, b?: number): number | undefined {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

function statusFromRemaining(
  milesRemaining: number | undefined,
  daysRemaining: number | undefined,
  leadMiles: number,
  leadDays: number
): DueStatus {
  // If either dimension says overdue, it's overdue.
  if ((milesRemaining != null && milesRemaining <= 0) || (daysRemaining != null && daysRemaining <= 0)) {
    return "OVERDUE";
  }

  // Due soon if either dimension is within lead window.
  if (
    (milesRemaining != null && milesRemaining <= leadMiles) ||
    (daysRemaining != null && daysRemaining <= leadDays)
  ) {
    return "DUE_SOON";
  }

  return "OK";
}

export function computeDueItems(args: ComputeArgs): DueItem[] {
  const today = toDateOnlyISO(args.todayISO);

  // Build "last service record per key"
  const lastByKey = new Map<MaintenanceKey, ServiceRecord>();
  for (const r of args.records) lastByKey.set(r.key, r);

  const out: DueItem[] = [];

  for (const def of DEFAULT_MAINTENANCE_DEFS) {
    const last = lastByKey.get(def.key);

    // Mileage dimension
    let milesRemaining: number | undefined = undefined;
    if (def.interval.miles != null) {
      if (last?.doneAtMileage != null) {
        const nextDueMileage = last.doneAtMileage + def.interval.miles;
        milesRemaining = nextDueMileage - args.currentMileage;
      } else {
        // no baseline -> treat as due now so user must enter a record
        milesRemaining = 0;
      }
    }

    // Time dimension
    let daysRemaining: number | undefined = undefined;
    if (def.interval.days != null) {
      if (last?.doneAtDateISO) {
        const lastDate = toDateOnlyISO(last.doneAtDateISO);
        const elapsed = daysBetween(lastDate, today);
        daysRemaining = def.interval.days - elapsed;
      } else {
        // no baseline -> treat as due now so user must enter a record
        daysRemaining = 0;
      }
    }

    const status = statusFromRemaining(milesRemaining, daysRemaining, def.leadMiles, def.leadDays);

    out.push({ def, status, milesRemaining, daysRemaining });
  }

  // Sort: OVERDUE first, then DUE_SOON, then OK.
  // Within each group, smaller "remaining" first (closest due).
  const rank: Record<DueStatus, number> = { OVERDUE: 0, DUE_SOON: 1, OK: 2 };

  out.sort((a, b) => {
    const ra = rank[a.status];
    const rb = rank[b.status];
    if (ra !== rb) return ra - rb;

    const aMin = minDefined(a.milesRemaining, a.daysRemaining) ?? Number.POSITIVE_INFINITY;
    const bMin = minDefined(b.milesRemaining, b.daysRemaining) ?? Number.POSITIVE_INFINITY;
    return aMin - bMin;
  });

  return out;
}
