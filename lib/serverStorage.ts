import { AuditRecord, Store } from "./types";
import { INITIAL_AUDITS, INITIAL_STORES } from "./seedData";
import fs from "fs";
import path from "path";

// File path for local persistent central repository
const DATA_FILE = path.join(process.cwd(), ".central_data.json");
const TMP_DATA_FILE = "/tmp/central_data.json";

interface CentralData {
  stores: Store[];
  audits: AuditRecord[];
  lastUpdated: string;
}

// In-memory cache for serverless invocation lifecycle
let memoryCache: CentralData | null = null;

// Upstash Redis configuration (from Vercel environment variables)
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// Public free cloud KV fallback key (unique to this repo so mobile and laptop share it automatically on Vercel!)
const CLOUD_FALLBACK_API = "https://api.jsonbin.io/v3/b";
const CLOUD_FALLBACK_MASTER = "$2a$10$7ZkEw7m9Z3QJ5zE0o9h.xe"; // Optional fallback

// Helper: load from Upstash Redis if configured
async function loadFromUpstash(): Promise<CentralData | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/fieldintel_central_data`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.result) {
        const parsed = typeof json.result === "string" ? JSON.parse(json.result) : json.result;
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Upstash Redis load failed:", err);
  }
  return null;
}

// Helper: save to Upstash Redis if configured
async function saveToUpstash(data: CentralData): Promise<boolean> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return false;
  try {
    const res = await fetch(`${UPSTASH_URL}/set/fieldintel_central_data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(data)),
    });
    return res.ok;
  } catch (err) {
    console.warn("Upstash Redis save failed:", err);
    return false;
  }
}

function loadLocalFile(): CentralData | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
    if (fs.existsSync(TMP_DATA_FILE)) {
      const content = fs.readFileSync(TMP_DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    // Ignore read errors
  }
  return null;
}

function saveLocalFile(data: CentralData) {
  // Try writing to cwd (works locally on PC/laptop)
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return;
  } catch (err) {
    // On Vercel serverless, cwd is read-only, so try /tmp
  }

  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Ignore
  }
}

export async function getCentralDataAsync(): Promise<CentralData> {
  // 1. Try Upstash Redis if configured in Vercel
  const upstashData = await loadFromUpstash();
  if (upstashData) {
    memoryCache = upstashData;
    return upstashData;
  }

  // 2. Try in-memory cache
  if (memoryCache && (memoryCache.audits.length > 0 || memoryCache.stores.length > 0)) {
    return memoryCache;
  }

  // 3. Try local filesystem
  const fileData = loadLocalFile();
  if (fileData) {
    memoryCache = fileData;
    return fileData;
  }

  return {
    stores: [],
    audits: [],
    lastUpdated: new Date().toISOString(),
  };
}

export async function saveCentralDataAsync(data: CentralData): Promise<void> {
  memoryCache = data;
  saveLocalFile(data);
  await saveToUpstash(data);
}

// Synchronous fallbacks for backwards compatibility
export function getCentralAudits(): AuditRecord[] {
  if (memoryCache) return memoryCache.audits;
  const fileData = loadLocalFile();
  return fileData ? fileData.audits : [];
}

export function getCentralStores(): Store[] {
  if (memoryCache) return memoryCache.stores;
  const fileData = loadLocalFile();
  return fileData ? fileData.stores : [];
}

export async function resetCentralDataAsync(): Promise<void> {
  const cleanData: CentralData = {
    stores: [],
    audits: [],
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(cleanData);
}

export async function syncCentralDataAsync(
  incomingAudits: AuditRecord[],
  incomingStores: Store[]
): Promise<{ audits: AuditRecord[]; stores: Store[]; addedAuditsCount: number; addedStoresCount: number }> {
  const current = await getCentralDataAsync();

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

  const updatedData: CentralData = {
    stores: mergedStores,
    audits: mergedAudits,
    lastUpdated: new Date().toISOString(),
  };

  await saveCentralDataAsync(updatedData);

  return {
    audits: mergedAudits,
    stores: mergedStores,
    addedAuditsCount,
    addedStoresCount,
  };
}
