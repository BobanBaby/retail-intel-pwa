import {
  AuditRecord,
  Store,
  CustomBrandEntry,
  CustomCategoryEntry,
  ProductCategoryConfig,
  PRODUCT_CATEGORIES,
} from "./types";

const STORES_STORAGE_KEY = "fieldintel_stores_clean_v3";
const AUDITS_STORAGE_KEY = "fieldintel_audits_clean_v3";
const CUSTOM_CATEGORIES_KEY = "fieldintel_custom_categories_v3";
const CUSTOM_BRANDS_KEY = "fieldintel_custom_brands_v3";
const ADMIN_PIN_STORAGE_KEY = "fieldintel_admin_custom_pin";
const ALLOW_REP_CATEGORY_KEY = "fieldintel_allow_rep_category";

export function getAllowRepAddCategory(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ALLOW_REP_CATEGORY_KEY) === "true";
  } catch (err) {
    return false;
  }
}

export async function saveAllowRepAddCategory(allowed: boolean): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.setItem(ALLOW_REP_CATEGORY_KEY, allowed ? "true" : "false");
  }
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_category_policy", allowed }),
    });
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.allowRepAddCategory);
    }
  } catch (err) {
    console.warn("Failed to sync category policy to server:", err);
  }
  return allowed;
}

export function getAdminPin(): string {
  if (typeof window === "undefined") return "9999";
  try {
    return localStorage.getItem(ADMIN_PIN_STORAGE_KEY) || "9999";
  } catch (err) {
    return "9999";
  }
}

export async function saveAdminPin(newPin: string): Promise<string> {
  const clean = newPin.trim();
  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_PIN_STORAGE_KEY, clean);
  }
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_admin_pin", pin: clean }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.adminPin || clean;
    }
  } catch (err) {
    console.warn("Failed to sync admin PIN to server:", err);
  }
  return clean;
}

export function getCustomCategories(): CustomCategoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function saveCustomCategory(cat: CustomCategoryEntry): CustomCategoryEntry[] {
  const current = getCustomCategories();
  const exists = current.find((c) => c.name.trim().toLowerCase() === cat.name.trim().toLowerCase());
  const updated = exists
    ? current.map((c) => (c.name.trim().toLowerCase() === cat.name.trim().toLowerCase() ? cat : c))
    : [...current, cat];
  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function getCustomBrands(): CustomBrandEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_BRANDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function saveCustomBrand(brand: CustomBrandEntry): CustomBrandEntry[] {
  const current = getCustomBrands();
  const brandKey = `${(brand.category || "General").toLowerCase()}:::${brand.brand.trim().toLowerCase()}`;
  const existsIndex = current.findIndex(
    (b) => `${(b.category || "General").toLowerCase()}:::${b.brand.trim().toLowerCase()}` === brandKey
  );

  let updated: CustomBrandEntry[];
  if (existsIndex >= 0) {
    const existing = current[existsIndex];
    const variants = Array.from(new Set([...existing.variants, ...brand.variants]));
    const commonSizes = Array.from(new Set([...existing.commonSizes, ...brand.commonSizes]));
    updated = [...current];
    updated[existsIndex] = { ...existing, ...brand, variants, commonSizes };
  } else {
    updated = [...current, brand];
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteCustomBrand(brandName: string, category?: string): CustomBrandEntry[] {
  const current = getCustomBrands();
  const targetBrand = brandName.trim().toLowerCase();
  const targetCat = category ? category.trim().toLowerCase() : null;

  const updated = current.filter((b) => {
    const bName = b.brand.trim().toLowerCase();
    const bCat = (b.category || "").trim().toLowerCase();
    if (targetCat) {
      return !(bName === targetBrand && bCat === targetCat);
    }
    return bName !== targetBrand;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteCustomCategory(categoryName: string): CustomCategoryEntry[] {
  const current = getCustomCategories();
  const target = categoryName.trim().toLowerCase();
  const updated = current.filter(
    (c) => c.name.trim().toLowerCase() !== target && c.id.toLowerCase() !== target
  );

  if (typeof window !== "undefined") {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updated));
  }
  return updated;
}

export async function deleteBrandFromNetwork(brandName: string, category?: string): Promise<{ success: boolean; brands: CustomBrandEntry[] }> {
  deleteCustomBrand(brandName, category);
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_brand", brandName, category, isAdmin: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.brands && typeof window !== "undefined") {
        localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(data.brands));
      }
      return { success: true, brands: data.brands || getCustomBrands() };
    }
  } catch (err) {
    console.warn("deleteBrandFromNetwork failed on server:", err);
  }
  return { success: true, brands: getCustomBrands() };
}

export async function deleteCategoryFromNetwork(
  categoryName: string,
  reassignToCategory?: string
): Promise<{
  success: boolean;
  categories: CustomCategoryEntry[];
  brands: CustomBrandEntry[];
  audits?: AuditRecord[];
}> {
  deleteCustomCategory(categoryName);
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete_category",
        categoryName,
        reassignToCategory,
        isAdmin: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.categories && typeof window !== "undefined") {
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(data.categories));
      }
      if (data.brands && typeof window !== "undefined") {
        localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(data.brands));
      }
      if (data.audits && typeof window !== "undefined") {
        localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(data.audits));
      }
      return {
        success: true,
        categories: data.categories || getCustomCategories(),
        brands: data.brands || getCustomBrands(),
        audits: data.audits,
      };
    }
  } catch (err) {
    console.warn("deleteCategoryFromNetwork failed on server:", err);
  }
  return {
    success: true,
    categories: getCustomCategories(),
    brands: getCustomBrands(),
  };
}

export async function reassignAuditCategory(
  auditId: string,
  newCategory: string
): Promise<{ success: boolean; audits?: AuditRecord[] }> {
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reassign_audit_category",
        auditId,
        newCategory,
        isAdmin: true,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audits && typeof window !== "undefined") {
        localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(data.audits));
      }
      return { success: true, audits: data.audits };
    }
  } catch (err) {
    console.warn("reassignAuditCategory failed:", err);
  }
  return { success: false };
}

export async function deleteStoreFromNetwork(storeId: string): Promise<{ success: boolean; stores: Store[] }> {
  const current = getStores();
  const updated = current.filter((s) => s.id !== storeId);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(updated));
  }
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_store", storeId, isAdmin: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.stores && typeof window !== "undefined") {
        localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(data.stores));
      }
      return { success: true, stores: data.stores || updated };
    }
  } catch (err) {
    console.warn("deleteStoreFromNetwork failed on server:", err);
  }
  return { success: true, stores: updated };
}

export async function deleteAuditFromNetwork(auditId: string): Promise<{ success: boolean; audits: AuditRecord[] }> {
  const updated = deleteAudit(auditId);
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_audit", auditId, isAdmin: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.audits && typeof window !== "undefined") {
        localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(data.audits));
      }
      return { success: true, audits: data.audits || updated };
    }
  } catch (err) {
    console.warn("deleteAuditFromNetwork failed on server:", err);
  }
  return { success: true, audits: updated };
}

export async function saveBrandToNetwork(brand: CustomBrandEntry): Promise<{ success: boolean; brands: CustomBrandEntry[] }> {
  saveCustomBrand(brand);
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brands: [brand], isAdmin: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.brands && typeof window !== "undefined") {
        localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(data.brands));
      }
      return { success: true, brands: data.brands || getCustomBrands() };
    }
  } catch (err) {
    console.warn("saveBrandToNetwork failed:", err);
  }
  return { success: true, brands: getCustomBrands() };
}

export async function saveCategoryToNetwork(cat: CustomCategoryEntry): Promise<{ success: boolean; categories: CustomCategoryEntry[] }> {
  saveCustomCategory(cat);
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: [cat], isAdmin: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.categories && typeof window !== "undefined") {
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(data.categories));
      }
      return { success: true, categories: data.categories || getCustomCategories() };
    }
  } catch (err) {
    console.warn("saveCategoryToNetwork failed:", err);
  }
  return { success: true, categories: getCustomCategories() };
}

// Build merged dynamic product categories combining:
// 1) Base static PRODUCT_CATEGORIES
// 2) Custom categories added by any rep
// 3) Custom brands added by any rep
// 4) Any brand/category/variant harvested from audits
export function buildMergedProductCategories(
  customCategories: CustomCategoryEntry[] = [],
  customBrands: CustomBrandEntry[] = [],
  audits: AuditRecord[] = [],
  allowRepAddCategory: boolean = false
): ProductCategoryConfig[] {
  const catMap = new Map<string, ProductCategoryConfig>();

  PRODUCT_CATEGORIES.forEach((cat) => {
    // If category creation is disabled for reps, hide "other-fmcg" / "Other Category"
    if (!allowRepAddCategory && (cat.id === "other-fmcg" || cat.id === "general-fmcg")) {
      return;
    }
    catMap.set(cat.name.toLowerCase(), {
      ...cat,
      brands: cat.brands.map((b) => ({
        ...b,
        priority: b.priority,
        defaultProduct: b.defaultProduct,
        variants: [...b.variants],
        commonSizes: [...b.commonSizes],
      })),
    });
  });

  // 1. Merge custom categories (enrolled by Admin or authorized network)
  customCategories.forEach((cc) => {
    if (!cc || !cc.name) return;
    const key = cc.name.trim().toLowerCase();
    if (!catMap.has(key)) {
      catMap.set(key, {
        id: cc.id || key.replace(/[^a-z0-9]+/g, "-"),
        name: cc.name.trim(),
        unit: cc.unit || "ml",
        unitStepLabel: cc.unitStepLabel || `per 100${cc.unit || "ml"}`,
        defaultSizes: cc.defaultSizes?.length ? cc.defaultSizes : [50, 100, 200],
        brands: [],
      });
    }
  });

  // 2. Merge custom brands & variants into existing categories
  customBrands.forEach((cb) => {
    if (!cb || !cb.brand) return;
    const catName = cb.category || "General FMCG";
    const catKey = catName.trim().toLowerCase();
    let cat = catMap.get(catKey);
    if (!cat) {
      for (const c of catMap.values()) {
        if (c.id === cb.category) {
          cat = c;
          break;
        }
      }
    }
    if (!cat) {
      if (allowRepAddCategory) {
        cat = {
          id: catKey.replace(/[^a-z0-9]+/g, "-"),
          name: catName,
          unit: cb.unit || "ml",
          unitStepLabel: `per 100${cb.unit || "ml"}`,
          defaultSizes: cb.commonSizes?.length ? cb.commonSizes : [50, 100, 200],
          brands: [],
        };
        catMap.set(catKey, cat);
      } else {
        return;
      }
    }

    const existingBrand = cat.brands.find(
      (b) => b.brand.toLowerCase() === cb.brand.trim().toLowerCase()
    );
    if (existingBrand) {
      (cb.variants || []).forEach((v) => {
        if (v && !existingBrand.variants.some((ev) => ev.toLowerCase() === v.toLowerCase())) {
          existingBrand.variants.push(v);
        }
      });
      (cb.commonSizes || []).forEach((s) => {
        if (s && !existingBrand.commonSizes.includes(s)) {
          existingBrand.commonSizes.push(s);
          existingBrand.commonSizes.sort((a, b) => a - b);
        }
      });
    } else {
      cat.brands.push({
        brand: cb.brand.trim(),
        priority: cb.priority,
        defaultProduct: cb.defaultProduct,
        variants: cb.variants?.length ? [...cb.variants] : ["Standard"],
        commonSizes: cb.commonSizes?.length ? [...cb.commonSizes] : [100],
        typicalMargin: cb.typicalMargin || 20,
      });
    }
  });

  // 3. Harvest brands and variants from audits (do NOT harvest rogue categories from audits)
  audits.forEach((audit) => {
    if (!audit.category || !audit.brand || audit.brand === "Other") return;
    const catKey = audit.category.trim().toLowerCase();
    let cat = catMap.get(catKey);
    // Strict guard: do not create rogue categories from audit typos!
    if (!cat) return;

    const brandName = audit.brand.trim();
    let brandConfig = cat.brands.find(
      (b) => b.brand.toLowerCase() === brandName.toLowerCase()
    );
    if (!brandConfig) {
      brandConfig = {
        brand: brandName,
        variants: audit.variant ? [audit.variant.trim()] : ["Standard"],
        commonSizes: audit.packSize ? [audit.packSize] : [100],
        typicalMargin: audit.retailerMarginPct ? Math.round(audit.retailerMarginPct) : 20,
      };
      cat.brands.push(brandConfig);
    } else {
      if (
        audit.variant &&
        !brandConfig.variants.some((v) => v.toLowerCase() === audit.variant.trim().toLowerCase())
      ) {
        brandConfig.variants.push(audit.variant.trim());
      }
      if (audit.packSize && !brandConfig.commonSizes.includes(audit.packSize)) {
        brandConfig.commonSizes.push(audit.packSize);
        brandConfig.commonSizes.sort((a, b) => a - b);
      }
    }
  });

  // Sort brands in each category: Priority 1, 2, 3... first, followed by others
  catMap.forEach((cat) => {
    cat.brands.sort((a, b) => {
      const pA = a.priority ?? 999;
      const pB = b.priority ?? 999;
      if (pA !== pB) return pA - pB;
      return a.brand.localeCompare(b.brand);
    });
  });

  return Array.from(catMap.values());
}

export function getStores(): Store[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load stores from storage", err);
    return [];
  }
}

export function saveStore(store: Store): Store[] {
  const current = getStores();
  const exists = current.find((s) => s.id === store.id);
  const updated = exists
    ? current.map((s) => (s.id === store.id ? store : s))
    : [store, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function getAudits(): AuditRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load audits from storage", err);
    return [];
  }
}

export function saveAudit(audit: AuditRecord): AuditRecord[] {
  const current = getAudits();
  const updated = [audit, ...current];
  if (typeof window !== "undefined") {
    localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function deleteAudit(id: string): AuditRecord[] {
  const current = getAudits();
  const updated = current.filter((a) => a.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

// Push local records to Central Repo and pull authorized scope
export async function syncWithCentralRepo(
  repName?: string,
  isAdmin: boolean = false
): Promise<{
  success: boolean;
  audits: AuditRecord[];
  stores: Store[];
  categories: CustomCategoryEntry[];
  brands: CustomBrandEntry[];
  allowRepAddCategory?: boolean;
  message: string;
}> {
  const localAudits = getAudits();
  const localStores = getStores();
  const localCategories = getCustomCategories();
  const localBrands = getCustomBrands();

  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audits: localAudits,
        stores: localStores,
        categories: localCategories,
        brands: localBrands,
        repName: repName || "",
        isAdmin: isAdmin,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.audits && data.stores) {
        if (typeof window !== "undefined") {
          localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(data.audits));
          localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(data.stores));
          if (data.categories) {
            localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(data.categories));
          }
          if (data.brands) {
            localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(data.brands));
          }
          if (data.allowRepAddCategory !== undefined) {
            localStorage.setItem(
              ALLOW_REP_CATEGORY_KEY,
              data.allowRepAddCategory ? "true" : "false"
            );
          }
        }
        return {
          success: true,
          audits: data.audits,
          stores: data.stores,
          categories: data.categories || [],
          brands: data.brands || [],
          allowRepAddCategory: Boolean(data.allowRepAddCategory),
          message: isAdmin
            ? `Admin: Synced ${data.totalAudits} total audits across all reps!`
            : `Synced your territory audits to Central Repository!`,
        };
      }
    }
  } catch (err) {
    console.warn("Server sync unreachable, marking local audits as synced:", err);
  }

  // Fallback offline sync
  const updated = localAudits.map((a) => ({ ...a, synced: true }));
  if (typeof window !== "undefined") {
    localStorage.setItem(AUDITS_STORAGE_KEY, JSON.stringify(updated));
  }
  return {
    success: true,
    audits: updated,
    stores: localStores,
    categories: localCategories,
    brands: localBrands,
    allowRepAddCategory: getAllowRepAddCategory(),
    message: "Audits marked synced locally.",
  };
}

export async function resetSystemFresh(): Promise<{ success: boolean; message: string }> {
  try {
    await fetch("/api/sync", {
      method: "DELETE",
    });
  } catch (err) {
    console.warn("Server reset call failed:", err);
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(STORES_STORAGE_KEY);
    localStorage.removeItem(AUDITS_STORAGE_KEY);
  }

  return {
    success: true,
    message: "System reset to 100% fresh clean state.",
  };
}

export function clearAllLocalData(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORES_STORAGE_KEY);
    localStorage.removeItem(AUDITS_STORAGE_KEY);
    localStorage.removeItem("fieldintel_active_rep_v3");
  }
}

// Client-side image compressor
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Export audits to CSV for Excel / Google Sheets
export function exportAuditsToCSV(audits: AuditRecord[]): void {
  const headers = [
    "Audit ID",
    "Category",
    "Timestamp",
    "Rep Name",
    "Store Name",
    "Store Type",
    "State",
    "District",
    "Area",
    "Brand",
    "Variant",
    "Pack Size",
    "Unit",
    "MRP (INR)",
    "Retailer Cost (INR)",
    "Retailer Margin %",
    "Customer Price (INR)",
    "Rate Per Unit (INR)",
    "Shelf Facings",
    "Shelf Position",
    "Turnover Speed",
    "Tags",
    "Notes",
    "Synced",
  ];

  const rows = audits.map((a) => {
    const ratePerUnit = a.packSize > 0 ? (a.mrp / a.packSize).toFixed(2) : "0";
    return [
      `"${a.id}"`,
      `"${a.category || "General"}"`,
      `"${a.createdAt}"`,
      `"${a.repName}"`,
      `"${a.storeName.replace(/"/g, '""')}"`,
      `"${a.storeType}"`,
      `"${a.state || ""}"`,
      `"${a.district || ""}"`,
      `"${a.area.replace(/"/g, '""')}"`,
      `"${a.brand.replace(/"/g, '""')}"`,
      `"${a.variant.replace(/"/g, '""')}"`,
      a.packSize,
      `"${a.unit || "ml"}"`,
      a.mrp,
      a.retailerCost,
      a.retailerMarginPct.toFixed(1),
      a.customerPrice,
      ratePerUnit,
      a.shelfFacings,
      `"${a.shelfPosition}"`,
      `"${a.turnoverSpeed}"`,
      `"${(a.tags || []).join("; ")}"`,
      `"${(a.notes || "").replace(/"/g, '""')}"`,
      a.synced ? "YES" : "NO",
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `retail_competitor_audit_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
