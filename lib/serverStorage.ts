import { AuditRecord, Store, CustomBrandEntry, CustomCategoryEntry } from "./types";
import { INITIAL_AUDITS, INITIAL_STORES } from "./seedData";
import fs from "fs";
import path from "path";

// File path for local persistent central repository
const DATA_FILE = path.join(process.cwd(), ".central_data.json");
const TMP_DATA_FILE = "/tmp/central_data.json";

export interface CentralData {
  stores: Store[];
  audits: AuditRecord[];
  customCategories?: CustomCategoryEntry[];
  customBrands?: CustomBrandEntry[];
  adminPin?: string;
  allowRepAddCategory?: boolean;
  lastUpdated: string;
}

// In-memory cache for serverless invocation lifecycle
let memoryCache: CentralData | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 25000; // 25 seconds in-memory TTL on serverless container

// Dynamic Redis / KV credential resolver (supports all Vercel KV, Upstash, and REDIS_URL formats)
function getRedisCredentials(): { url: string; token: string } | null {
  // 1. Direct REST API URL & Token (standard for Vercel KV / Upstash)
  const directUrl =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    process.env.REDIS_REST_URL;

  const directToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.REDIS_REST_TOKEN;

  if (directUrl && directToken) {
    return {
      url: directUrl.replace(/\/+$/, ""),
      token: directToken.trim(),
    };
  }

  // 2. Parse from connection string (e.g. KV_URL or REDIS_URL like rediss://default:token@endpoint.upstash.io:6379)
  const connStr =
    process.env.KV_URL ||
    process.env.REDIS_URL ||
    process.env.UPSTASH_REDIS_URL;

  if (connStr && connStr.startsWith("redis")) {
    try {
      const parsed = new URL(connStr);
      const host = parsed.hostname;
      const token = parsed.password || parsed.username;
      if (host && token) {
        return {
          url: `https://${host}`,
          token: token,
        };
      }
    } catch {
      // ignore parse failure
    }
  }

  return null;
}

export function isCloudStorageConfigured(): boolean {
  return getRedisCredentials() !== null;
}

// Helper: load from Upstash Redis / Vercel KV if configured
async function loadFromUpstash(): Promise<CentralData | null> {
  const creds = getRedisCredentials();
  if (!creds) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${creds.url}/get/fieldintel_central_data`, {
      headers: { Authorization: `Bearer ${creds.token}` },
      cache: "no-store",
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeoutId);
  }
  return null;
}

// Helper: save to Upstash Redis / Vercel KV if configured
async function saveToUpstash(data: CentralData): Promise<boolean> {
  const creds = getRedisCredentials();
  if (!creds) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${creds.url}/set/fieldintel_central_data`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    return res.ok;
  } catch (err) {
    console.warn("Upstash Redis save failed:", err);
    return false;
  } finally {
    clearTimeout(timeoutId);
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

export async function getCentralDataAsync(forceRefresh = false): Promise<CentralData> {
  // If memory cache is fresh (within TTL) and not forced, return immediately (0 Redis bandwidth)
  if (!forceRefresh && memoryCache && (Date.now() - lastCacheFetchTime < CACHE_TTL_MS)) {
    return memoryCache;
  }

  // 1. Try Upstash Redis / Vercel KV if configured
  const upstashData = await loadFromUpstash();
  if (upstashData) {
    memoryCache = upstashData;
    lastCacheFetchTime = Date.now();
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
    lastCacheFetchTime = Date.now();
    return fileData;
  }

  return {
    stores: [],
    audits: [],
    customCategories: [],
    customBrands: [],
    adminPin: "9999",
    lastUpdated: new Date().toISOString(),
  };
}

export async function saveCentralDataAsync(data: CentralData): Promise<void> {
  memoryCache = data;
  lastCacheFetchTime = Date.now();
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
    customCategories: [],
    customBrands: [],
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(cleanData);
}

export async function deleteCentralBrandAsync(brandName: string, category?: string): Promise<CentralData> {
  const data = await getCentralDataAsync();
  const targetBrand = brandName.trim().toLowerCase();
  const targetCat = category ? category.trim().toLowerCase() : null;

  const filteredBrands = (data.customBrands || []).filter((b) => {
    const bName = b.brand.trim().toLowerCase();
    const bCat = (b.category || "").trim().toLowerCase();
    if (targetCat) {
      return !(bName === targetBrand && bCat === targetCat);
    }
    return bName !== targetBrand;
  });

  const updated: CentralData = {
    ...data,
    customBrands: filteredBrands,
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(updated);
  return updated;
}

export async function deleteCentralCategoryAsync(
  categoryName: string,
  reassignToCategory?: string
): Promise<CentralData> {
  const data = await getCentralDataAsync();
  const targetCat = categoryName.trim().toLowerCase();
  const cleanReassign = reassignToCategory ? reassignToCategory.trim() : "";

  const filteredCategories = (data.customCategories || []).filter(
    (c) => c.name.trim().toLowerCase() !== targetCat && c.id.toLowerCase() !== targetCat
  );

  // Also remove brands belonging to this category or reassign them
  const updatedBrands = (data.customBrands || [])
    .map((b) => {
      if ((b.category || "").trim().toLowerCase() === targetCat) {
        return cleanReassign ? { ...b, category: cleanReassign } : null;
      }
      return b;
    })
    .filter(Boolean) as CustomBrandEntry[];

  // Update audits: if reassign target provided, migrate them to the correct category
  const updatedAudits = data.audits.map((a) => {
    if ((a.category || "").trim().toLowerCase() === targetCat) {
      return cleanReassign ? { ...a, category: cleanReassign } : a;
    }
    return a;
  });

  const updated: CentralData = {
    ...data,
    audits: updatedAudits,
    customCategories: filteredCategories,
    customBrands: updatedBrands,
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(updated);
  return updated;
}

export async function updateAuditCategoryAsync(
  auditId: string,
  newCategory: string
): Promise<CentralData> {
  const data = await getCentralDataAsync();
  const cleanCat = newCategory.trim();
  const updatedAudits = data.audits.map((a) => {
    if (a.id === auditId) {
      return { ...a, category: cleanCat };
    }
    return a;
  });
  const updated: CentralData = {
    ...data,
    audits: updatedAudits,
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(updated);
  return updated;
}

export async function deleteCentralStoreAsync(storeId: string): Promise<CentralData> {
  const data = await getCentralDataAsync();
  const filteredStores = data.stores.filter((s) => s.id !== storeId);
  const updated: CentralData = {
    ...data,
    stores: filteredStores,
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(updated);
  return updated;
}

export async function deleteCentralAuditAsync(auditId: string): Promise<CentralData> {
  const data = await getCentralDataAsync();
  const filteredAudits = data.audits.filter((a) => a.id !== auditId);
  const updated: CentralData = {
    ...data,
    audits: filteredAudits,
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(updated);
  return updated;
}

export async function setCentralAdminPinAsync(pin: string): Promise<string> {
  const data = await getCentralDataAsync();
  const cleanPin = pin.trim();
  const updated: CentralData = {
    ...data,
    adminPin: cleanPin,
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(updated);
  return cleanPin;
}

export async function getCentralAdminPinAsync(): Promise<string> {
  const data = await getCentralDataAsync();
  return data.adminPin || "9999";
}

export async function setCentralCategoryPolicyAsync(allowed: boolean): Promise<boolean> {
  const data = await getCentralDataAsync();
  const updated: CentralData = {
    ...data,
    allowRepAddCategory: Boolean(allowed),
    lastUpdated: new Date().toISOString(),
  };
  await saveCentralDataAsync(updated);
  return Boolean(allowed);
}

export async function syncCentralDataAsync(
  incomingAudits: AuditRecord[],
  incomingStores: Store[],
  incomingCategories: CustomCategoryEntry[] = [],
  incomingBrands: CustomBrandEntry[] = [],
  isAdmin: boolean = false
): Promise<{
  audits: AuditRecord[];
  stores: Store[];
  categories: CustomCategoryEntry[];
  brands: CustomBrandEntry[];
  addedAuditsCount: number;
  addedStoresCount: number;
  allowRepAddCategory: boolean;
}> {
  const current = await getCentralDataAsync();
  const isRepCategoryAllowed = Boolean(current.allowRepAddCategory);

  // 1. Merge Stores
  const storeMap = new Map<string, Store>();
  current.stores.forEach((s) => storeMap.set(s.id, s));
  let addedStoresCount = 0;
  incomingStores.forEach((s) => {
    if (!storeMap.has(s.id)) {
      addedStoresCount++;
    }
    storeMap.set(s.id, s);
  });

  // 2. Merge Audits
  const auditMap = new Map<string, AuditRecord>();
  current.audits.forEach((a) => auditMap.set(a.id, a));
  let addedAuditsCount = 0;
  incomingAudits.forEach((a) => {
    if (!auditMap.has(a.id)) {
      addedAuditsCount++;
    }
    auditMap.set(a.id, { ...a, synced: true });
  });

  // 3. Merge Custom Categories (Only allowed if admin or category creation is unlocked for reps)
  const categoryMap = new Map<string, CustomCategoryEntry>();
  (current.customCategories || []).forEach((c) =>
    categoryMap.set(c.name.trim().toLowerCase(), c)
  );

  if (isRepCategoryAllowed || isAdmin) {
    incomingCategories.forEach((c) => {
      if (c && c.name) {
        categoryMap.set(c.name.trim().toLowerCase(), c);
      }
    });
  }

  // 4. Merge Custom Brands
  const brandMap = new Map<string, CustomBrandEntry>();
  (current.customBrands || []).forEach((b) =>
    brandMap.set(`${(b.category || "General").toLowerCase()}:::${b.brand.toLowerCase()}`, b)
  );
  incomingBrands.forEach((b) => {
    if (b && b.brand) {
      const key = `${(b.category || "General").toLowerCase()}:::${b.brand.toLowerCase()}`;
      const existing = brandMap.get(key);
      if (existing) {
        const variants = Array.from(new Set([...existing.variants, ...(b.variants || [])]));
        const commonSizes = Array.from(new Set([...existing.commonSizes, ...(b.commonSizes || [])]));
        brandMap.set(key, { ...existing, variants, commonSizes });
      } else {
        brandMap.set(key, b);
      }
    }
  });

  // 5. Automatically harvest brands and variants from audits (do NOT harvest rogue categories if locked!)
  auditMap.forEach((audit) => {
    if (!audit.category || !audit.brand || audit.brand === "Other") return;
    const catName = audit.category.trim();
    const brandName = audit.brand.trim();
    const catKey = catName.toLowerCase();
    const brandKey = `${catKey}:::${brandName.toLowerCase()}`;

    // Auto-record category only if category policy is unlocked or admin enabled
    if (isRepCategoryAllowed || isAdmin) {
      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, {
          id: catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: catName,
          unit: audit.unit || "ml",
          defaultSizes: audit.packSize ? [audit.packSize] : [100],
          addedByRep: audit.repName,
          createdAt: audit.createdAt,
        });
      }
    }

    // Auto-record brand & variant
    const existingBrand = brandMap.get(brandKey);
    if (existingBrand) {
      if (audit.variant && !existingBrand.variants.includes(audit.variant.trim())) {
        existingBrand.variants.push(audit.variant.trim());
      }
      if (audit.packSize && !existingBrand.commonSizes.includes(audit.packSize)) {
        existingBrand.commonSizes.push(audit.packSize);
        existingBrand.commonSizes.sort((a, b) => a - b);
      }
    } else {
      brandMap.set(brandKey, {
        brand: brandName,
        category: catName,
        variants: audit.variant ? [audit.variant.trim()] : ["Standard"],
        commonSizes: audit.packSize ? [audit.packSize] : [100],
        typicalMargin: audit.retailerMarginPct ? Math.round(audit.retailerMarginPct) : 20,
        unit: audit.unit || "ml",
        addedByRep: audit.repName,
        createdAt: audit.createdAt,
      });
    }
  });

  const mergedStores = Array.from(storeMap.values());
  const mergedAudits = Array.from(auditMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const mergedCategories = Array.from(categoryMap.values());
  const mergedBrands = Array.from(brandMap.values());

  const updatedData: CentralData = {
    stores: mergedStores,
    audits: mergedAudits,
    customCategories: mergedCategories,
    customBrands: mergedBrands,
    adminPin: current.adminPin,
    allowRepAddCategory: isRepCategoryAllowed,
    lastUpdated: new Date().toISOString(),
  };

  await saveCentralDataAsync(updatedData);

  return {
    audits: mergedAudits,
    stores: mergedStores,
    categories: mergedCategories,
    brands: mergedBrands,
    addedAuditsCount,
    addedStoresCount,
    allowRepAddCategory: isRepCategoryAllowed,
  };
}
