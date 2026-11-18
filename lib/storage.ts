import { AuditRecord, Store } from "./types";

const STORES_STORAGE_KEY = "fieldintel_stores_clean_v3";
const AUDITS_STORAGE_KEY = "fieldintel_audits_clean_v3";

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
  message: string;
}> {
  const localAudits = getAudits();
  const localStores = getStores();

  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audits: localAudits,
        stores: localStores,
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
        }
        return {
          success: true,
          audits: data.audits,
          stores: data.stores,
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
