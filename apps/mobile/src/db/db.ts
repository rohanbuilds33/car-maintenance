// src/db/db.ts
import * as SQLite from "expo-sqlite";
import type { MaintenanceKey } from "../domain/maintenance";

export const db = SQLite.openDatabaseSync("car_maintenance.db");

// ---------- DB init ----------
export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS odometer (
      id INTEGER PRIMARY KEY NOT NULL,
      miles INTEGER NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS service_records (
      id INTEGER PRIMARY KEY NOT NULL,
      key TEXT NOT NULL,
      doneAtMileage INTEGER,
      doneAtDateISO TEXT NOT NULL
    );
  `);
}

// ---------- Odometer ----------
export type OdometerRow = {
  miles: number;
  updatedAt: string; // ISO
};

export function getOdometer(): OdometerRow | null {
  const row = db.getFirstSync<OdometerRow>(
    "SELECT miles, updatedAt FROM odometer WHERE id = 1;"
  );
  return row ?? null;
}

export function setOdometer(miles: number) {
  const updatedAt = new Date().toISOString();
  db.runSync(
    "INSERT INTO odometer (id, miles, updatedAt) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET miles=excluded.miles, updatedAt=excluded.updatedAt;",
    [miles, updatedAt]
  );
}

// ---------- Service records (domain-facing) ----------
export type ServiceRecordRow = {
  id: number;
  key: MaintenanceKey;
  doneAtMileage?: number; // undefined if missing
  doneAtDateISO: string;  // YYYY-MM-DD
};

export function getServiceRecords(): ServiceRecordRow[] {
  // Raw row uses: key string, doneAtMileage number|null
  const rows = db.getAllSync<{
    id: number;
    key: string;
    doneAtMileage: number | null;
    doneAtDateISO: string;
  }>("SELECT id, key, doneAtMileage, doneAtDateISO FROM service_records ORDER BY doneAtDateISO DESC, id DESC;");

  // Convert to domain type: key -> MaintenanceKey, null -> undefined
  return rows.map((r) => ({
    id: r.id,
    key: r.key as MaintenanceKey,
    doneAtMileage: r.doneAtMileage ?? undefined,
    doneAtDateISO: r.doneAtDateISO,
  }));
}

export function logServiceNow(key: MaintenanceKey, doneAtMileage?: number) {
  const doneAtDateISO = new Date().toISOString().slice(0, 10);
  db.runSync(
    "INSERT INTO service_records (key, doneAtMileage, doneAtDateISO) VALUES (?, ?, ?);",
    [key, doneAtMileage ?? null, doneAtDateISO]
  );
}

// ---------- Compatibility aliases (so index.tsx imports can stay same) ----------
export function getCurrentMileage(): number | null {
  return getOdometer()?.miles ?? null;
}

export function setCurrentMileage(miles: number) {
  setOdometer(miles);
}
