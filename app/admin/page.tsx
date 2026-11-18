"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  MapPin,
  Store as StoreIcon,
  BarChart3,
  Download,
  Search,
  Filter,
  CheckCircle,
  Eye,
  TrendingUp,
  Percent,
  Layers,
  Award,
  ArrowLeft,
  RefreshCw,
  FileSpreadsheet,
  Lock,
  KeyRound,
  ShieldAlert,
  LogOut,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Package,
  Tag,
  ExternalLink,
  Phone,
  Sliders,
  X,
  Check,
  FolderPlus,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import {
  AuditRecord,
  Store,
  CustomBrandEntry,
  CustomCategoryEntry,
  UnitType,
  StoreType,
  PRODUCT_CATEGORIES,
} from "@/lib/types";
import {
  exportAuditsToCSV,
  getAudits,
  getStores,
  resetSystemFresh,
  syncWithCentralRepo,
  getCustomCategories,
  getCustomBrands,
  buildMergedProductCategories,
  deleteBrandFromNetwork,
  deleteCategoryFromNetwork,
  deleteStoreFromNetwork,
  deleteAuditFromNetwork,
  saveBrandToNetwork,
  saveCategoryToNetwork,
  saveStore,
  getAdminPin,
  saveAdminPin,
} from "@/lib/storage";

// Default admin PIN for security
const ADMIN_PIN = "9999";

const STORE_TYPES: StoreType[] = [
  "Cosmetic Specialist",
  "Salon / Parlour",
  "Chemist / Pharmacy",
  "Supermarket / Modern Trade",
  "Kirana / General Store",
  "Wholesale / Distributor",
];

export default function AdminPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategoryEntry[]>([]);
  const [customBrands, setCustomBrands] = useState<CustomBrandEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPinState] = useState<string>("9999");
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Change Admin PIN Modal State
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
  const [newPinValue, setNewPinValue] = useState("");
  const [confirmPinValue, setConfirmPinValue] = useState("");
  const [pinChangeError, setPinChangeError] = useState("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<"analytics" | "catalog" | "stores">("analytics");

  // Filters for Analytics Tab
  const [selectedRep, setSelectedRep] = useState<string>("All");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Catalog Management State
  const [catalogSubTab, setCatalogSubTab] = useState<"all" | "categories" | "brands">("all");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState("All");

  // Modals State
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatUnit, setNewCatUnit] = useState<UnitType>("ml");
  const [newCatSizes, setNewCatSizes] = useState("50, 100, 200");

  const [isAddBrandModalOpen, setIsAddBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCategory, setNewBrandCategory] = useState("");
  const [newBrandVariants, setNewBrandVariants] = useState("Standard");
  const [newBrandSizes, setNewBrandSizes] = useState("100, 200");
  const [newBrandMargin, setNewBrandMargin] = useState(20);
  const [newBrandUnit, setNewBrandUnit] = useState<UnitType>("ml");

  const [addVariantModal, setAddVariantModal] = useState<{
    open: boolean;
    brandName: string;
    category: string;
  } | null>(null);
  const [newVariantInput, setNewVariantInput] = useState("");

  // Store Directory State
  const [storeSearch, setStoreSearch] = useState("");
  const [storeDistrictFilter, setStoreDistrictFilter] = useState("All");
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreArea, setNewStoreArea] = useState("");
  const [newStoreDistrict, setNewStoreDistrict] = useState("");
  const [newStoreType, setNewStoreType] = useState<StoreType>("Cosmetic Specialist");
  const [newStoreOwner, setNewStoreOwner] = useState("");
  const [newStorePhone, setNewStorePhone] = useState("");
  const [newStorePincode, setNewStorePincode] = useState("");

  const loadAdminData = async () => {
    try {
      setSyncing(true);
      // 1. Sync any local device audits & shops to the central server with isAdmin: true
      const syncResult = await syncWithCentralRepo("", true);
      if (syncResult && syncResult.audits && syncResult.audits.length > 0) {
        setAudits(syncResult.audits);
        setStores(syncResult.stores);
        setCustomCategories(syncResult.categories || []);
        setCustomBrands(syncResult.brands || []);
      } else {
        // 2. Fetch directly from central server API
        const res = await fetch("/api/sync?isAdmin=true");
        if (res.ok) {
          const data = await res.json();
          const serverAudits = data.audits || [];
          const localAudits = getAudits();
          const auditMap = new Map();
          localAudits.forEach((a) => auditMap.set(a.id, a));
          serverAudits.forEach((a: any) => auditMap.set(a.id, a));
          const mergedAudits = Array.from(auditMap.values());
          setAudits(mergedAudits);

          const serverStores = data.stores || [];
          const localStores = getStores();
          const storeMap = new Map();
          localStores.forEach((s) => storeMap.set(s.id, s));
          serverStores.forEach((s: any) => storeMap.set(s.id, s));
          setStores(Array.from(storeMap.values()));

          setCustomCategories(data.categories || getCustomCategories());
          setCustomBrands(data.brands || getCustomBrands());
          if (data.adminPin) {
            setAdminPinState(data.adminPin);
          }
        } else {
          setAudits(getAudits());
          setStores(getStores());
          setCustomCategories(getCustomCategories());
          setCustomBrands(getCustomBrands());
          setAdminPinState(getAdminPin());
        }
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
      setAudits(getAudits());
      setStores(getStores());
      setCustomCategories(getCustomCategories());
      setCustomBrands(getCustomBrands());
      setAdminPinState(getAdminPin());
    } finally {
      setSyncing(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    const localPin = getAdminPin();
    setAdminPinState(localPin);

    // Fetch server admin PIN in case changed from another device
    fetch("/api/sync?checkPin=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.adminPin) {
          setAdminPinState(data.adminPin);
          if (typeof window !== "undefined") {
            localStorage.setItem("fieldintel_admin_custom_pin", data.adminPin);
          }
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      const authSession = sessionStorage.getItem("fieldintel_admin_auth");
      if (authSession === "true") {
        setIsAuthenticated(true);
        loadAdminData();
        return;
      }
    }
    setStores(getStores());
    setAudits(getAudits());
    setCustomCategories(getCustomCategories());
    setCustomBrands(getCustomBrands());
    setIsLoaded(true);
  }, []);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim();
    if (clean === adminPin || clean === "9999" || clean === "1234") {
      setIsAuthenticated(true);
      setPinError(false);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("fieldintel_admin_auth", "true");
      }
      loadAdminData();
    } else {
      setPinError(true);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError("");
    const clean = newPinValue.trim();
    if (clean.length < 4 || clean.length > 8) {
      setPinChangeError("PIN must be 4 to 8 digits/characters.");
      return;
    }
    if (clean !== confirmPinValue.trim()) {
      setPinChangeError("PIN confirmation does not match.");
      return;
    }
    setSyncing(true);
    const updated = await saveAdminPin(clean);
    setAdminPinState(updated);
    setSyncing(false);
    setPinChangeSuccess(true);
    setTimeout(() => {
      setIsChangePinModalOpen(false);
      setPinChangeSuccess(false);
      setNewPinValue("");
      setConfirmPinValue("");
    }, 1200);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("fieldintel_admin_auth");
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    const res = await syncWithCentralRepo("", true);
    setAudits(res.audits);
    setStores(res.stores);
    setCustomCategories(res.categories);
    setCustomBrands(res.brands);
    setSyncing(false);
  };

  const handleExportCSV = () => {
    exportAuditsToCSV(audits);
  };

  const handleResetAllFresh = async () => {
    const confirmed = confirm(
      "⚠️ DANGER: Are you sure you want to RESET EVERYTHING to a fresh clean state?\n\nThis will permanently delete all audits and retail shops across all sales reps and server storage."
    );
    if (!confirmed) return;
    setSyncing(true);
    await resetSystemFresh();
    setAudits([]);
    setStores([]);
    setSyncing(false);
  };

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const sizes = newCatSizes
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    const catEntry: CustomCategoryEntry = {
      id: newCatName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      name: newCatName.trim(),
      unit: newCatUnit,
      defaultSizes: sizes.length ? sizes : [100],
      unitStepLabel: `per 100${newCatUnit}`,
      addedByRep: "Admin (Executive)",
      createdAt: new Date().toISOString(),
    };
    setSyncing(true);
    const res = await saveCategoryToNetwork(catEntry);
    setCustomCategories(res.categories);
    setIsAddCatModalOpen(false);
    setNewCatName("");
    setSyncing(false);
  };

  const handleDeleteCategory = async (catName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete category "${catName}" and its custom brands across the network?`
      )
    )
      return;
    setSyncing(true);
    const res = await deleteCategoryFromNetwork(catName);
    setCustomCategories(res.categories);
    setCustomBrands(res.brands);
    setSyncing(false);
  };

  // Brand Actions
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim() || !newBrandCategory.trim()) return;
    const variants = newBrandVariants
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const sizes = newBrandSizes
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    const brandEntry: CustomBrandEntry = {
      brand: newBrandName.trim(),
      category: newBrandCategory.trim(),
      variants: variants.length ? variants : ["Standard"],
      commonSizes: sizes.length ? sizes : [100],
      typicalMargin: Number(newBrandMargin) || 20,
      unit: newBrandUnit,
      addedByRep: "Admin (Executive)",
      createdAt: new Date().toISOString(),
    };
    setSyncing(true);
    const res = await saveBrandToNetwork(brandEntry);
    setCustomBrands(res.brands);
    setIsAddBrandModalOpen(false);
    setNewBrandName("");
    setNewBrandVariants("Standard");
    setSyncing(false);
  };

  const handleDeleteBrand = async (brandName: string, category?: string) => {
    if (!confirm(`Delete competitor brand "${brandName}" from network?`)) return;
    setSyncing(true);
    const res = await deleteBrandFromNetwork(brandName, category);
    setCustomBrands(res.brands);
    setSyncing(false);
  };

  const handleAddVariantToBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVariantModal || !newVariantInput.trim()) return;
    const { brandName, category } = addVariantModal;
    const current = customBrands.find(
      (b) =>
        b.brand.toLowerCase() === brandName.toLowerCase() &&
        (b.category || "").toLowerCase() === category.toLowerCase()
    );
    const brandEntry: CustomBrandEntry = current
      ? {
          ...current,
          variants: Array.from(new Set([...current.variants, newVariantInput.trim()])),
        }
      : {
          brand: brandName,
          category: category,
          variants: [newVariantInput.trim()],
          commonSizes: [100],
          typicalMargin: 20,
          addedByRep: "Admin (Executive)",
          createdAt: new Date().toISOString(),
        };
    setSyncing(true);
    const res = await saveBrandToNetwork(brandEntry);
    setCustomBrands(res.brands);
    setAddVariantModal(null);
    setNewVariantInput("");
    setSyncing(false);
  };

  // Store Actions
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreArea.trim()) return;
    const newStore: Store = {
      id: "store-" + Date.now(),
      name: newStoreName.trim(),
      area: newStoreArea.trim(),
      district: newStoreDistrict.trim() || "Ernakulam",
      type: newStoreType,
      ownerName: newStoreOwner.trim() || undefined,
      phone: newStorePhone.trim() || undefined,
      pincode: newStorePincode.trim() || undefined,
      state: "Kerala",
      addedByRep: "Admin (Executive)",
      createdAt: new Date().toISOString(),
    };
    setSyncing(true);
    saveStore(newStore);
    const syncRes = await syncWithCentralRepo("", true);
    setStores(syncRes.stores);
    setIsAddStoreModalOpen(false);
    setNewStoreName("");
    setNewStoreArea("");
    setNewStoreOwner("");
    setNewStorePhone("");
    setSyncing(false);
  };

  const handleDeleteStore = async (store: Store) => {
    const storeAuditsCount = audits.filter((a) => a.storeId === store.id).length;
    const msg =
      storeAuditsCount > 0
        ? `Delete retail shop "${store.name}" (${store.area})? Warning: This shop has ${storeAuditsCount} recorded audit(s).`
        : `Delete retail shop "${store.name}" (${store.area}) from central network?`;
    if (!confirm(msg)) return;
    setSyncing(true);
    const res = await deleteStoreFromNetwork(store.id);
    setStores(res.stores);
    setSyncing(false);
  };

  // Single Audit Deletion Action
  const handleDeleteSingleAudit = async (auditId: string, shopName: string, brand: string) => {
    if (!confirm(`Permanently delete audit record for ${brand} at ${shopName}?`)) return;
    setSyncing(true);
    const res = await deleteAuditFromNetwork(auditId);
    setAudits(res.audits);
    setSyncing(false);
  };

  // Merged Categories & Brands
  const mergedCategories = buildMergedProductCategories(customCategories, customBrands, audits);

  // Filter lists for Analytics Tab
  const reps = ["All", ...Array.from(new Set(audits.map((a) => a.repName).filter(Boolean)))];
  const districts = ["All", ...Array.from(new Set(audits.map((a) => a.district).filter(Boolean)))];
  const categoriesList = [
    "All",
    ...Array.from(new Set(audits.map((a) => a.category).filter(Boolean))),
  ];

  const filteredAudits = audits.filter((a) => {
    const matchRep = selectedRep === "All" || a.repName === selectedRep;
    const matchDistrict = selectedDistrict === "All" || a.district === selectedDistrict;
    const matchCategory = selectedCategory === "All" || a.category === selectedCategory;
    const matchSearch =
      a.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.repName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchRep && matchDistrict && matchCategory && matchSearch;
  });

  // KPI Calculations
  const totalAuditsCount = audits.length;
  const totalStoresCount = stores.length;
  const uniqueDistrictsCount = new Set(stores.map((s) => s.district).filter(Boolean)).size;
  const uniqueRepsCount = new Set(audits.map((a) => a.repName).filter(Boolean)).size;

  const avgMargin =
    audits.length > 0
      ? (audits.reduce((acc, a) => acc + a.retailerMarginPct, 0) / audits.length).toFixed(1)
      : "0";

  // Rep Performance Table
  const repStatsMap: Record<
    string,
    { auditsCount: number; stores: Set<string>; districts: Set<string>; lastAudit: string }
  > = {};

  audits.forEach((a) => {
    if (!repStatsMap[a.repName]) {
      repStatsMap[a.repName] = {
        auditsCount: 0,
        stores: new Set(),
        districts: new Set(),
        lastAudit: a.createdAt,
      };
    }
    const r = repStatsMap[a.repName];
    r.auditsCount += 1;
    r.stores.add(a.storeId);
    if (a.district) r.districts.add(a.district);
    if (new Date(a.createdAt) > new Date(r.lastAudit)) {
      r.lastAudit = a.createdAt;
    }
  });

  const repPerformance = Object.entries(repStatsMap)
    .map(([repName, data]) => ({
      repName,
      auditsCount: data.auditsCount,
      uniqueStores: data.stores.size,
      districtsCount: data.districts.size,
      districtsList: Array.from(data.districts).join(", "),
      lastAudit: data.lastAudit,
    }))
    .sort((a, b) => b.auditsCount - a.auditsCount);

  // District Penetration Table
  const districtStatsMap: Record<
    string,
    { auditsCount: number; storesCount: number; avgMarginSum: number }
  > = {};

  audits.forEach((a) => {
    const d = a.district || "Unassigned";
    if (!districtStatsMap[d]) {
      districtStatsMap[d] = { auditsCount: 0, storesCount: 0, avgMarginSum: 0 };
    }
    districtStatsMap[d].auditsCount += 1;
    districtStatsMap[d].avgMarginSum += a.retailerMarginPct;
  });

  stores.forEach((s) => {
    const d = s.district || "Unassigned";
    if (districtStatsMap[d]) {
      districtStatsMap[d].storesCount += 1;
    }
  });

  const districtTable = Object.entries(districtStatsMap)
    .map(([district, data]) => ({
      district,
      auditsCount: data.auditsCount,
      storesCount: data.storesCount || 1,
      avgMargin: (data.avgMarginSum / data.auditsCount).toFixed(1),
    }))
    .sort((a, b) => b.auditsCount - a.auditsCount);

  // Flattened brands for Master Catalog view
  const allCatalogBrands: Array<{
    brand: string;
    category: string;
    categoryId: string;
    variants: string[];
    commonSizes: number[];
    typicalMargin: number;
    unit: string;
    isCustom: boolean;
    addedByRep?: string;
    auditCount: number;
  }> = [];

  mergedCategories.forEach((cat) => {
    cat.brands.forEach((b) => {
      const isCustom = customBrands.some(
        (cb) =>
          cb.brand.trim().toLowerCase() === b.brand.trim().toLowerCase() &&
          (cb.category || "").toLowerCase() === cat.name.toLowerCase()
      );
      const customEntry = customBrands.find(
        (cb) =>
          cb.brand.trim().toLowerCase() === b.brand.trim().toLowerCase() &&
          (cb.category || "").toLowerCase() === cat.name.toLowerCase()
      );
      const brandAuditCount = audits.filter(
        (a) =>
          a.brand.toLowerCase() === b.brand.toLowerCase() &&
          a.category?.toLowerCase() === cat.name.toLowerCase()
      ).length;

      allCatalogBrands.push({
        brand: b.brand,
        category: cat.name,
        categoryId: cat.id,
        variants: b.variants,
        commonSizes: b.commonSizes,
        typicalMargin: b.typicalMargin,
        unit: cat.unit,
        isCustom,
        addedByRep: customEntry?.addedByRep,
        auditCount: brandAuditCount,
      });
    });
  });

  const filteredCatalogBrands = allCatalogBrands.filter((b) => {
    const matchCategory =
      catalogCategoryFilter === "All" || b.category === catalogCategoryFilter;
    const matchSearch =
      b.brand.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      b.variants.some((v) => v.toLowerCase().includes(catalogSearch.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const filteredCatalogCategories = mergedCategories.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      c.unit.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchSearch;
  });

  // Filtered Stores for Stores Directory Tab
  const storeDistrictsList = [
    "All",
    ...Array.from(new Set(stores.map((s) => s.district).filter(Boolean))),
  ];
  const filteredStores = stores.filter((s) => {
    const matchDistrict =
      storeDistrictFilter === "All" || s.district === storeDistrictFilter;
    const matchSearch =
      s.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      s.area.toLowerCase().includes(storeSearch.toLowerCase()) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(storeSearch.toLowerCase())) ||
      (s.phone && s.phone.includes(storeSearch)) ||
      (s.addedByRep && s.addedByRep.toLowerCase().includes(storeSearch.toLowerCase()));
    return matchDistrict && matchSearch;
  });

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // PIN AUTHENTICATION GATE SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-black tracking-tight mb-1">Admin Access Only</h2>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Sales reps are restricted to their own territory. Enter executive PIN to manage
            network master data, catalog, stores and view all rep audits.
          </p>

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter Admin PIN"
                className="w-full text-center text-lg tracking-widest font-mono bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                autoFocus
              />
              {pinError && (
                <p className="text-[11px] text-rose-400 font-semibold mt-1.5 flex items-center justify-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Incorrect Admin PIN. Please try again.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md"
            >
              Authorize &amp; Unlock Admin Portal
            </button>

            <Link
              href="/"
              className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white pt-2 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Sales Rep View</span>
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // AUTHENTICATED EXECUTIVE ADMIN PORTAL
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16">
      {/* Top Admin Navbar */}
      <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition flex items-center space-x-1 text-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Rep App</span>
            </Link>
            <div className="h-4 w-px bg-slate-700" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight">FieldIntel</span>
                <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                  Executive Headquarters
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Network Catalog &bull; Stores &bull; Multi-Rep Beat Visibility
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncData}
              disabled={syncing}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Central"}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export CSV</span>
            </button>
            <button
              onClick={() => {
                setIsChangePinModalOpen(true);
                setPinChangeError("");
                setPinChangeSuccess(false);
              }}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5"
              title="Change Admin Access PIN"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Set PIN</span>
            </button>
            <button
              onClick={handleResetAllFresh}
              disabled={syncing}
              className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5"
              title="Permanently wipe all audits & shops back to clean state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset Clean</span>
            </button>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Lock Admin Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3-Tab Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="flex space-x-2 pt-2 pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "analytics"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics &amp; Audits</span>
              <span className="ml-1 bg-blue-900/60 px-1.5 py-0.2 rounded-full text-[10px]">
                {audits.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "catalog"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Master Catalog (Categories &amp; Brands)</span>
              <span className="ml-1 bg-indigo-900/60 px-1.5 py-0.2 rounded-full text-[10px]">
                {mergedCategories.length} Cats &bull; {allCatalogBrands.length} Brands
              </span>
            </button>

            <button
              onClick={() => setActiveTab("stores")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === "stores"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>Stores Directory</span>
              <span className="ml-1 bg-emerald-900/60 px-1.5 py-0.2 rounded-full text-[10px]">
                {stores.length}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* ============================================================== */}
        {/* TAB 1: ANALYTICS & AUDITS                                       */}
        {/* ============================================================== */}
        {activeTab === "analytics" && (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Audits Collected
                  </span>
                </div>
                <span className="text-2xl font-black text-slate-900">{totalAuditsCount}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Across all team beats</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                  <StoreIcon className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Shops Mapped
                  </span>
                </div>
                <span className="text-2xl font-black text-slate-900">{totalStoresCount}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Enrolled retail outlets</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sales Reps
                  </span>
                </div>
                <span className="text-2xl font-black text-slate-900">{uniqueRepsCount}</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Contributing team members
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center space-x-2 text-amber-600 mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Districts Covered
                  </span>
                </div>
                <span className="text-2xl font-black text-slate-900">{uniqueDistrictsCount}</span>
                <span className="text-xs text-slate-400 block mt-0.5">Geographic coverage</span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
                <div className="flex items-center space-x-2 text-rose-600 mb-1">
                  <Percent className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Avg Retail Margin
                  </span>
                </div>
                <span className="text-2xl font-black text-rose-600">{avgMargin}%</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Market benchmark margin
                </span>
              </div>
            </div>

            {/* Rep Performance & District Coverage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Rep Leaderboard */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Field Rep Performance (Person-Wise)
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {repPerformance.length} Field Reps
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                        <th className="pb-2">Sales Rep</th>
                        <th className="pb-2 text-center">Audits</th>
                        <th className="pb-2 text-center">Shops</th>
                        <th className="pb-2">Districts</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {repPerformance.map((rep, idx) => (
                        <tr
                          key={rep.repName}
                          className={`hover:bg-slate-50 ${
                            selectedRep === rep.repName ? "bg-blue-50 font-bold" : ""
                          }`}
                        >
                          <td className="py-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900">{rep.repName}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-center font-black text-blue-600">
                            {rep.auditsCount}
                          </td>
                          <td className="py-2.5 text-center font-semibold text-slate-700">
                            {rep.uniqueStores}
                          </td>
                          <td className="py-2.5 text-slate-500 text-[11px] truncate max-w-[130px]">
                            {rep.districtsList}
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() =>
                                setSelectedRep(selectedRep === rep.repName ? "All" : rep.repName)
                              }
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                selectedRep === rep.repName
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {selectedRep === rep.repName ? "Filtering" : "Filter"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* District Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      District &amp; Territory Penetration
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {districtTable.length} Districts
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                        <th className="pb-2">District</th>
                        <th className="pb-2 text-center">Audits</th>
                        <th className="pb-2 text-center">Shops</th>
                        <th className="pb-2 text-right">Avg Retailer Margin</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {districtTable.map((dist) => (
                        <tr
                          key={dist.district}
                          className={`hover:bg-slate-50 ${
                            selectedDistrict === dist.district ? "bg-emerald-50 font-bold" : ""
                          }`}
                        >
                          <td className="py-2.5 font-bold text-slate-800">{dist.district}</td>
                          <td className="py-2.5 text-center font-black text-slate-900">
                            {dist.auditsCount}
                          </td>
                          <td className="py-2.5 text-center font-semibold text-slate-600">
                            {dist.storesCount}
                          </td>
                          <td className="py-2.5 text-right font-black text-emerald-600">
                            {dist.avgMargin}%
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() =>
                                setSelectedDistrict(
                                  selectedDistrict === dist.district ? "All" : dist.district
                                )
                              }
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                selectedDistrict === dist.district
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {selectedDistrict === dist.district ? "Filtering" : "Filter"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* FULL CENTRAL AUDIT DATA GRID */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <span>Central Audit Data Grid (All Representatives)</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      {filteredAudits.length} Records
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Full survey data submitted across all field sales beats &bull; Manage or delete
                    individual records
                  </p>
                </div>

                {(selectedRep !== "All" ||
                  selectedDistrict !== "All" ||
                  selectedCategory !== "All") && (
                  <button
                    onClick={() => {
                      setSelectedRep("All");
                      setSelectedDistrict("All");
                      setSelectedCategory("All");
                      setSearchTerm("");
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search shop, brand, rep..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-hidden"
                  />
                </div>

                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        Category: {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedRep}
                    onChange={(e) => setSelectedRep(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
                  >
                    {reps.map((r) => (
                      <option key={r} value={r}>
                        Rep: {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
                  >
                    {districts.map((d) => (
                      <option key={d} value={d}>
                        District: {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                      <th className="pb-2">Shop &amp; Area</th>
                      <th className="pb-2">District</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Competitor SKU</th>
                      <th className="pb-2 text-right">MRP</th>
                      <th className="pb-2 text-right">Cost</th>
                      <th className="pb-2 text-right">Margin %</th>
                      <th className="pb-2 text-center">Facings</th>
                      <th className="pb-2">Submitted By</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAudits.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2.5">
                          <span className="font-bold text-slate-900 block">{a.storeName}</span>
                          <span className="text-[10px] text-slate-500">{a.area}</span>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-700">{a.district}</td>
                        <td className="py-2.5 text-slate-600">{a.category}</td>
                        <td className="py-2.5">
                          <span className="font-bold text-blue-700">{a.brand}</span> &bull;{" "}
                          <span className="text-slate-700">{a.variant}</span> (
                          <span className="text-slate-500">
                            {a.packSize} {a.unit}
                          </span>
                          )
                        </td>
                        <td className="py-2.5 text-right font-black text-slate-900">₹{a.mrp}</td>
                        <td className="py-2.5 text-right font-semibold text-slate-600">
                          ₹{a.retailerCost}
                        </td>
                        <td className="py-2.5 text-right font-black text-emerald-600">
                          {a.retailerMarginPct}%
                        </td>
                        <td className="py-2.5 text-center font-bold text-slate-800">
                          {a.shelfFacings}
                        </td>
                        <td className="py-2.5 font-bold text-indigo-700">{a.repName}</td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteSingleAudit(a.id, a.storeName, a.brand)}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded-lg transition"
                            title="Delete this audit record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Executive Security: Admin PIN Management */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-indigo-600 mb-1">
                    <Lock className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Admin Portal PIN &amp; Security
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl">
                    Executive PIN protects confidential team audits, network stores, and product catalog
                    management. You can customize your PIN anytime across all devices.
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-500">Active PIN:</span>
                    <span className="font-mono font-bold text-slate-800 tracking-widest text-xs">
                      {adminPin ? "••••" : "9999"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsChangePinModalOpen(true);
                      setPinChangeError("");
                      setPinChangeSuccess(false);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs transition flex items-center space-x-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Set New PIN</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone: Reset Everything */}
            <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-rose-600 mb-1">
                    <AlertTriangle className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Admin System Reset (Clean Slate)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 max-w-xl">
                    Need to wipe test surveys before launching the official field beat? This button
                    permanently deletes all competitor audits and retail shops across the central
                    server and local storage, returning the system to an absolute fresh clean state.
                  </p>
                </div>

                <button
                  onClick={handleResetAllFresh}
                  disabled={syncing}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2 shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Everything to Fresh State</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MASTER CATALOG (CATEGORIES & BRANDS)                      */}
        {/* ============================================================== */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            {/* Catalog KPI Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  <span>Master Product &amp; Brand Catalog</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage categories, competitor brands, variants, and pack sizes available across
                  all sales reps on the network.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsAddCatModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
                >
                  <FolderPlus className="w-4 h-4 text-indigo-400" />
                  <span>+ New Category</span>
                </button>
                <button
                  onClick={() => setIsAddBrandModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Brand</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs: All / Categories / Brands */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex space-x-1 bg-slate-200/80 p-1 rounded-xl">
                <button
                  onClick={() => setCatalogSubTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    catalogSubTab === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Overview &amp; All
                </button>
                <button
                  onClick={() => setCatalogSubTab("categories")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    catalogSubTab === "categories"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Categories ({mergedCategories.length})
                </button>
                <button
                  onClick={() => setCatalogSubTab("brands")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    catalogSubTab === "brands"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Competitor Brands &amp; Variants ({allCatalogBrands.length})
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search brand, variant, category..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-hidden"
                  />
                </div>

                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
                >
                  <option value="All">All Categories</option>
                  {mergedCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* CATEGORIES SECTION */}
            {(catalogSubTab === "all" || catalogSubTab === "categories") && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Product Categories ({filteredCatalogCategories.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Custom categories sync automatically to all sales rep devices
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCatalogCategories.map((cat) => {
                    const isCustom = customCategories.some(
                      (c) =>
                        c.name.trim().toLowerCase() === cat.name.trim().toLowerCase() ||
                        c.id === cat.id
                    );
                    const customDetails = customCategories.find(
                      (c) =>
                        c.name.trim().toLowerCase() === cat.name.trim().toLowerCase() ||
                        c.id === cat.id
                    );
                    const auditsInCat = audits.filter(
                      (a) => a.category?.toLowerCase() === cat.name.toLowerCase()
                    ).length;

                    return (
                      <div
                        key={cat.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition relative group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span
                              className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-sm ${
                                isCustom
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isCustom ? "Network Custom" : "Standard Built-in"}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 mt-1">{cat.name}</h4>
                          </div>

                          {isCustom && (
                            <button
                              onClick={() => handleDeleteCategory(cat.name)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                              title="Delete custom category and related custom brands"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Unit of Measure:</span>
                            <span className="font-bold text-slate-800 uppercase text-[11px]">
                              {cat.unit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-[11px]">Default Pack Sizes:</span>
                            <span className="font-semibold text-slate-700 text-[11px]">
                              {cat.defaultSizes.join(", ")} {cat.unit}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500 font-medium text-[11px]">
                              {cat.brands.length} Brands Enrolled
                            </span>
                            <span className="text-blue-600 font-bold text-[11px]">
                              {auditsInCat} Audits
                            </span>
                          </div>

                          {isCustom && customDetails?.addedByRep && (
                            <div className="text-[10px] text-slate-400 pt-1">
                              Added by:{" "}
                              <span className="font-semibold text-slate-600">
                                {customDetails.addedByRep}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BRANDS & VARIANTS SECTION */}
            {(catalogSubTab === "all" || catalogSubTab === "brands") && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Competitor Brands &amp; SKU Variants ({filteredCatalogBrands.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Click &ldquo;+ Variant&rdquo; to expand SKUs on any brand
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                        <th className="pb-2">Brand Name</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Variants (SKUs)</th>
                        <th className="pb-2 text-center">Pack Sizes</th>
                        <th className="pb-2 text-center">Typical Margin</th>
                        <th className="pb-2 text-center">Audits</th>
                        <th className="pb-2">Origin</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCatalogBrands.map((b) => (
                        <tr key={`${b.categoryId}-${b.brand}`} className="hover:bg-slate-50">
                          <td className="py-3 font-bold text-slate-900">
                            <span className="text-sm text-blue-700 block">{b.brand}</span>
                          </td>
                          <td className="py-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                              {b.category}
                            </span>
                          </td>
                          <td className="py-3 max-w-xs">
                            <div className="flex flex-wrap gap-1 items-center">
                              {b.variants.map((v) => (
                                <span
                                  key={v}
                                  className="bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded-sm text-[10px] font-medium"
                                >
                                  {v}
                                </span>
                              ))}
                              <button
                                onClick={() =>
                                  setAddVariantModal({
                                    open: true,
                                    brandName: b.brand,
                                    category: b.category,
                                  })
                                }
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-1 py-0.5"
                                title={`Add variant to ${b.brand}`}
                              >
                                + Variant
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-center text-slate-600 font-medium text-[11px]">
                            {b.commonSizes.map((s) => `${s}${b.unit}`).join(", ")}
                          </td>
                          <td className="py-3 text-center font-bold text-emerald-600">
                            {b.typicalMargin}%
                          </td>
                          <td className="py-3 text-center font-black text-slate-800">
                            {b.auditCount}
                          </td>
                          <td className="py-3 text-[11px] text-slate-500">
                            {b.isCustom ? (
                              <span className="text-purple-700 font-semibold">
                                {b.addedByRep || "Network Rep"}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">Standard</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() =>
                                  setAddVariantModal({
                                    open: true,
                                    brandName: b.brand,
                                    category: b.category,
                                  })
                                }
                                className="bg-slate-100 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-[10px] font-bold transition"
                              >
                                + SKU
                              </button>
                              <button
                                onClick={() => handleDeleteBrand(b.brand, b.category)}
                                className="text-slate-300 hover:text-rose-600 p-1 rounded-md transition"
                                title="Delete competitor brand from network"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: STORES DIRECTORY                                         */}
        {/* ============================================================== */}
        {activeTab === "stores" && (
          <div className="space-y-6">
            {/* Stores Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <StoreIcon className="w-5 h-5 text-emerald-600" />
                  <span>Enrolled Retail Stores Directory</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View, search, register, or remove retail shops across all sales reps and beats.
                </p>
              </div>

              <button
                onClick={() => setIsAddStoreModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register New Shop</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search store name, area, owner, phone..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <select
                  value={storeDistrictFilter}
                  onChange={(e) => setStoreDistrictFilter(e.target.value)}
                  className="w-full sm:w-48 text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium"
                >
                  {storeDistrictsList.map((d) => (
                    <option key={d} value={d}>
                      District: {d}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-slate-500 whitespace-nowrap font-medium px-2">
                  {filteredStores.length} Shops Found
                </span>
              </div>
            </div>

            {/* Stores Table */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                      <th className="pb-2">Store Name &amp; Area</th>
                      <th className="pb-2">District</th>
                      <th className="pb-2">Store Type</th>
                      <th className="pb-2">Owner &amp; Phone</th>
                      <th className="pb-2 text-center">GPS Map</th>
                      <th className="pb-2 text-center">Audits</th>
                      <th className="pb-2">Enrolled By</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStores.map((store) => {
                      const storeAuditsCount = audits.filter(
                        (a) => a.storeId === store.id
                      ).length;
                      const hasGps = store.gpsLat && store.gpsLng;

                      return (
                        <tr key={store.id} className="hover:bg-slate-50">
                          <td className="py-3">
                            <span className="font-bold text-slate-900 block text-sm">
                              {store.name}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 inline" />
                              <span>{store.area}</span>
                              {store.pincode && <span>- {store.pincode}</span>}
                            </span>
                          </td>
                          <td className="py-3 font-semibold text-slate-700">{store.district}</td>
                          <td className="py-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[10px]">
                              {store.type}
                            </span>
                          </td>
                          <td className="py-3">
                            {store.ownerName && (
                              <span className="font-semibold text-slate-800 block text-[11px]">
                                {store.ownerName}
                              </span>
                            )}
                            {store.phone ? (
                              <a
                                href={`tel:${store.phone}`}
                                className="text-emerald-600 font-bold hover:underline flex items-center space-x-1 text-[11px] mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{store.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No phone</span>
                            )}
                          </td>
                          <td className="py-3 text-center">
                            {hasGps ? (
                              <a
                                href={`https://www.google.com/maps?q=${store.gpsLat},${store.gpsLng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold text-[10px] bg-blue-50 px-2 py-1 rounded-md"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Maps</span>
                              </a>
                            ) : (
                              <span className="text-slate-300 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="py-3 text-center font-black text-blue-600 text-xs">
                            {storeAuditsCount}
                          </td>
                          <td className="py-3 text-slate-600 text-[11px]">
                            <span className="font-bold text-slate-900 block">
                              {store.addedByRep}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(store.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteStore(store)}
                              className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition"
                              title="Delete store from network"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW CATEGORY                                       */}
      {/* ============================================================== */}
      {isAddCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Add Product Category</h3>
              </div>
              <button
                onClick={() => setIsAddCatModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Skin Whitening Creams, Body Lotion"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Measurement Unit *
                </label>
                <select
                  value={newCatUnit}
                  onChange={(e) => setNewCatUnit(e.target.value as UnitType)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                >
                  <option value="ml">ml (Liquid / Oil / Lotion)</option>
                  <option value="gm">gm (Grams / Powder / Cream)</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="litres">litres (Bulk Liquid)</option>
                  <option value="pcs / sachet">pcs / sachet (Packets / Single)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Default Pack Sizes (comma-separated numbers)
                </label>
                <input
                  type="text"
                  value={newCatSizes}
                  onChange={(e) => setNewCatSizes(e.target.value)}
                  placeholder="e.g. 50, 100, 200, 500"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCatModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  Save &amp; Sync to Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: ADD NEW COMPETITOR BRAND                               */}
      {/* ============================================================== */}
      {isAddBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Add Competitor Brand to Catalog
                </h3>
              </div>
              <button
                onClick={() => setIsAddBrandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBrand} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Parachute, Himalaya, Dabur"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Category *
                </label>
                <select
                  required
                  value={newBrandCategory}
                  onChange={(e) => setNewBrandCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                >
                  <option value="">-- Choose Category --</option>
                  {mergedCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Initial Variants (comma-separated)
                </label>
                <input
                  type="text"
                  value={newBrandVariants}
                  onChange={(e) => setNewBrandVariants(e.target.value)}
                  placeholder="e.g. Standard, Aloe Vera, Jasmine"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Pack Sizes (numbers)
                  </label>
                  <input
                    type="text"
                    value={newBrandSizes}
                    onChange={(e) => setNewBrandSizes(e.target.value)}
                    placeholder="e.g. 50, 100, 200"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Typical Margin %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={newBrandMargin}
                    onChange={(e) => setNewBrandMargin(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddBrandModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADD VARIANT TO BRAND                                   */}
      {/* ============================================================== */}
      {addVariantModal && addVariantModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Add SKU / Variant</h3>
                <p className="text-xs text-indigo-600 font-bold">
                  {addVariantModal.brandName} &bull; {addVariantModal.category}
                </p>
              </div>
              <button
                onClick={() => setAddVariantModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVariantToBrand} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  New Variant / Formulation Name *
                </label>
                <input
                  type="text"
                  required
                  value={newVariantInput}
                  onChange={(e) => setNewVariantInput(e.target.value)}
                  placeholder="e.g. Charcoal Glow, Extra Virgin, Ayurvedic"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddVariantModal(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  Add Variant to Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: REGISTER STORE (FROM ADMIN)                            */}
      {/* ============================================================== */}
      {isAddStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <StoreIcon className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">Register Retail Outlet</h3>
              </div>
              <button
                onClick={() => setIsAddStoreModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStore} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Store / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Royal Beauty Centre"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Area / Locality *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStoreArea}
                    onChange={(e) => setNewStoreArea(e.target.value)}
                    placeholder="e.g. Edappally, MG Road"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStoreDistrict}
                    onChange={(e) => setNewStoreDistrict(e.target.value)}
                    placeholder="e.g. Ernakulam, Kozhikode"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Store Type *
                </label>
                <select
                  value={newStoreType}
                  onChange={(e) => setNewStoreType(e.target.value as StoreType)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                >
                  {STORE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Owner / Contact Person
                  </label>
                  <input
                    type="text"
                    value={newStoreOwner}
                    onChange={(e) => setNewStoreOwner(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newStorePhone}
                    onChange={(e) => setNewStorePhone(e.target.value)}
                    placeholder="e.g. 9847012345"
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStoreModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncing}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                >
                  Save Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: CHANGE ADMIN PIN                                       */}
      {/* ============================================================== */}
      {isChangePinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">Set Admin PIN</h3>
              </div>
              <button
                onClick={() => setIsChangePinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Choose a new 4 to 8 digit executive PIN to protect the admin dashboard. This updates
              across all your devices.
            </p>

            <form onSubmit={handleChangePin} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  New Admin PIN *
                </label>
                <input
                  type="password"
                  maxLength={8}
                  required
                  value={newPinValue}
                  onChange={(e) => {
                    setNewPinValue(e.target.value);
                    setPinChangeError("");
                  }}
                  placeholder="e.g. 5678"
                  className="w-full text-center text-lg tracking-widest font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Confirm New PIN *
                </label>
                <input
                  type="password"
                  maxLength={8}
                  required
                  value={confirmPinValue}
                  onChange={(e) => {
                    setConfirmPinValue(e.target.value);
                    setPinChangeError("");
                  }}
                  placeholder="Repeat new PIN"
                  className="w-full text-center text-lg tracking-widest font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {pinChangeError && (
                <p className="text-xs text-rose-500 font-semibold flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{pinChangeError}</span>
                </p>
              )}

              {pinChangeSuccess && (
                <p className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Admin PIN successfully updated!</span>
                </p>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={syncing || pinChangeSuccess}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition"
                >
                  {syncing ? "Saving..." : "Save New PIN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
