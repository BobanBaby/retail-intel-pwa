import { AuditRecord, Store } from "./types";
import { INITIAL_AUDITS, INITIAL_STORES } from "./seedData";
import fs from "fs";
import path from "path";

// File path for local persistent central repository
const DATA_FILE = path.join(process.cwd(), ".central_data.json");

interface CentralData {
  stores: Store[];
  audits: AuditRecord[];
  lastUpdated: string;
}

function loadCentralData(): CentralData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading central data file:", err);
  }
  return {
    stores: INITIAL_STORES,
    audits: INITIAL_AUDITS,
    lastUpdated: new Date().toISOString(),
  };
}

function saveCentralData(data: CentralData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing central data file:", err);
  }
}

export function getCentralAudits(): AuditRecord[] {
  return loadCentralData().audits;
}

export function getCentralStores(): Store[] {
  return loadCentralData().stores;
}

export function resetCentralData(): void {
  saveCentralData({
    stores: [],
    audits: [],
    lastUpdated: new Date().toISOString(),
  });
}

export function syncCentralData(
  incomingAudits: AuditRecord[],
  incomingStores: Store[]
): { audits: AuditRecord[]; stores: Store[]; addedAuditsCount: number; addedStoresCount: number } {
  const current = loadCentralData();

  const storeMap = new Map<string, Store>();
  current.stores.forEach((s) => storeMap.set(s.id, s));
  let addedStoresCount = 0;
  incomingStores.forEach((s) => {
    if (!storeMap.has(s.id)) {
      addedStoresCount++;
    }
    storeMap.set(s.id, s);
  });

  const auditMap = new Map<string, AuditRecord>();
  current.audits.forEach((a) => auditMap.set(a.id, a));
  let addedAuditsCount = 0;
  incomingAudits.forEach((a) => {
    if (!auditMap.has(a.id)) {
      addedAuditsCount++;
    }
    auditMap.set(a.id, { ...a, synced: true });
  });

  const mergedStores = Array.from(storeMap.values());
  const mergedAudits = Array.from(auditMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  saveCentralData({
    stores: mergedStores,
    audits: mergedAudits,
    lastUpdated: new Date().toISOString(),
  });

  return {
    audits: mergedAudits,
    stores: mergedStores,
    addedAuditsCount,
    addedStoresCount,
  };
}
