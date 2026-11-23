"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  MapPin,
  Plus,
  Store as StoreIcon,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Package,
  Search,
  Check,
  Compass,
  Navigation,
  Phone,
  User,
  SlidersHorizontal,
} from "lucide-react";
import {
  AuditRecord,
  CustomBrandEntry,
  CustomCategoryEntry,
  PRODUCT_CATEGORIES,
  ProductCategoryConfig,
  ShelfPosition,
  Store,
  StoreType,
  TurnoverSpeed,
  UnitType,
} from "@/lib/types";
import { compressImage, buildMergedProductCategories } from "@/lib/storage";

interface AuditFormProps {
  stores: Store[];
  onAddStore: (store: Store) => void;
  onSubmitAudit: (audit: AuditRecord) => void;
  repName: string;
  preselectedStoreId?: string;
  customCategories?: CustomCategoryEntry[];
  customBrands?: CustomBrandEntry[];
  onAddCustomCategory?: (cat: CustomCategoryEntry) => void;
  onAddCustomBrand?: (brand: CustomBrandEntry) => void;
  allAudits?: AuditRecord[];
}

const COMMON_TAGS = [
  "Top Category Mover",
  "Wants Smaller Pocket Pack",
  "Demands >25% Margin",
  "Retailer Sells Below MRP",
  "Active Trade Scheme (Buy 10+1)",
  "Heavy Walk-in Demand",
  "Premium Salon / Specialist Pick",
  "Frequently Out of Stock",
];

const SHELF_POSITIONS: ShelfPosition[] = [
  "Eye Level (Prime)",
  "Top Shelf",
  "Middle Shelf",
  "Bottom Shelf",
  "Behind / On Counter",
];

const TURNOVER_SPEEDS: TurnoverSpeed[] = [
  "Fast (>5 units/wk)",
  "Moderate (2-5 units/wk)",
  "Slow (<2 units/wk)",
];

const STORE_TYPES: StoreType[] = [
  "Salon / Parlour",
  "Cosmetic Specialist",
  "Chemist / Pharmacy",
  "Supermarket / Modern Trade",
  "Kirana / General Store",
  "Wholesale / Distributor",
];

const UNITS: UnitType[] = ["ml", "gm", "pcs / sachet", "kg", "litres"];

export default function AuditForm({
  stores,
  onAddStore,
  onSubmitAudit,
  repName,
  preselectedStoreId,
  customCategories = [],
  customBrands = [],
  onAddCustomCategory,
  onAddCustomBrand,
  allAudits = [],
}: AuditFormProps) {
  // Store Selection State
  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    preselectedStoreId || stores[0]?.id || ""
  );

  useEffect(() => {
    if (preselectedStoreId) {
      setSelectedStoreId(preselectedStoreId);
    }
  }, [preselectedStoreId]);

  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreType, setNewStoreType] = useState<StoreType>("Salon / Parlour");
  const [newStoreDistrict, setNewStoreDistrict] = useState("");
  const [newStoreState, setNewStoreState] = useState("");
  const [newStoreArea, setNewStoreArea] = useState("");
  const [newStoreOwner, setNewStoreOwner] = useState("");
  const [newStorePhone, setNewStorePhone] = useState("");

  // Search & Filter State for Shops
  const [showStoreSearchModal, setShowStoreSearchModal] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("All");
  const [searchChannel, setSearchChannel] = useState("All");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByProximity, setSortByProximity] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Available unique districts from registered stores
  const availableDistricts = useMemo(() => {
    const set = new Set<string>();
    stores.forEach((s) => {
      if (s.district) set.add(s.district.trim());
    });
    return ["All", ...Array.from(set).sort()];
  }, [stores]);

  // Haversine formula for distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setSortByProximity(true);
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        console.warn("GPS lookup failed", err);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Filtered & Sorted Stores for Search Modal
  const searchFilteredStores = useMemo(() => {
    const q = storeSearchQuery.trim().toLowerCase();
    let list = stores.filter((s) => {
      const matchText =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        (s.district && s.district.toLowerCase().includes(q)) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        s.type.toLowerCase().includes(q);

      const matchDistrict =
        searchDistrict === "All" || s.district === searchDistrict;

      const matchChannel =
        searchChannel === "All" || s.type === searchChannel;

      return matchText && matchDistrict && matchChannel;
    });

    if (sortByProximity && userLocation) {
      list = [...list].sort((a, b) => {
        const distA =
          a.gpsLat && a.gpsLng
            ? calculateDistance(userLocation.lat, userLocation.lng, a.gpsLat, a.gpsLng)
            : 999999;
        const distB =
          b.gpsLat && b.gpsLng
            ? calculateDistance(userLocation.lat, userLocation.lng, b.gpsLat, b.gpsLng)
            : 999999;
        return distA - distB;
      });
    }

    return list;
  }, [stores, storeSearchQuery, searchDistrict, searchChannel, sortByProximity, userLocation]);

  // Dynamically build categories combining built-in categories, custom categories, custom brands, and audits
  const availableCategories = useMemo(() => {
    return buildMergedProductCategories(customCategories, customBrands, allAudits);
  }, [customCategories, customBrands, allAudits]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    availableCategories[0]?.id || "hair-spray"
  );

  const selectedCategory =
    availableCategories.find((c) => c.id === selectedCategoryId) ||
    availableCategories[0] ||
    PRODUCT_CATEGORIES[0];

  const [customCategoryName, setCustomCategoryName] = useState("");

  // Modal State for Registering New Category
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatUnit, setNewCatUnit] = useState<UnitType>("ml");
  const [newCatSizes, setNewCatSizes] = useState("50, 100, 200");

  // Modal State for Registering New Brand
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCategory, setNewBrandCategory] = useState("");
  const [newBrandVariants, setNewBrandVariants] = useState("");
  const [newBrandSizes, setNewBrandSizes] = useState("100, 200");
  const [newBrandMargin, setNewBrandMargin] = useState("20");
  const [newBrandUnit, setNewBrandUnit] = useState<UnitType>("ml");

  // Product / Competitor State
  const [selectedBrand, setSelectedBrand] = useState<string>(
    availableCategories[0]?.brands[0]?.brand || "Other"
  );
  const [customBrand, setCustomBrand] = useState<string>("");
  const [variant, setVariant] = useState<string>(
    availableCategories[0]?.brands[0]?.variants[0] || "Standard"
  );
  const [packSize, setPackSize] = useState<number>(
    availableCategories[0]?.defaultSizes[0] || 100
  );
  const [unit, setUnit] = useState<UnitType>(availableCategories[0]?.unit || "ml");
  const [customPackSize, setCustomPackSize] = useState<string>("");

  // Brand Search & Modal State (matching store selector pattern)
  const [showBrandSearchModal, setShowBrandSearchModal] = useState(false);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [brandSearchCategoryFilter, setBrandSearchCategoryFilter] = useState("All");
  const brandSearchInputRef = useRef<HTMLInputElement>(null);

  // All catalog brands flattened for universal search
  const allCatalogBrands = useMemo(() => {
    const list: {
      brand: string;
      categoryName: string;
      categoryId: string;
      variants: string[];
      commonSizes: number[];
      typicalMargin: number;
      unit: UnitType;
      priority?: number;
      defaultProduct?: string;
    }[] = [];
    availableCategories.forEach((cat) => {
      cat.brands.forEach((b) => {
        list.push({
          ...b,
          categoryName: cat.name,
          categoryId: cat.id,
          unit: cat.unit,
          priority: b.priority,
          defaultProduct: b.defaultProduct,
        });
      });
    });
    return list;
  }, [availableCategories]);

  // Filtered brands for brand search modal
  const searchFilteredBrands = useMemo(() => {
    const q = brandSearchQuery.trim().toLowerCase();
    return allCatalogBrands.filter((b) => {
      const matchText =
        !q ||
        b.brand.toLowerCase().includes(q) ||
        b.categoryName.toLowerCase().includes(q) ||
        b.variants.some((v) => v.toLowerCase().includes(q));

      const matchCategory =
        brandSearchCategoryFilter === "All" ||
        b.categoryId === brandSearchCategoryFilter;

      return matchText && matchCategory;
    });
  }, [allCatalogBrands, brandSearchQuery, brandSearchCategoryFilter]);

  // Handle Add New Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cleanName = newCatName.trim();
    const sizes = newCatSizes
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((s) => !isNaN(s) && s > 0);

    const newCat: CustomCategoryEntry = {
      id: cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: cleanName,
      unit: newCatUnit,
      unitStepLabel: `per 100${newCatUnit}`,
      defaultSizes: sizes.length ? sizes : [50, 100, 200],
      addedByRep: repName || "Field Sales Rep",
      createdAt: new Date().toISOString(),
    };

    if (onAddCustomCategory) {
      onAddCustomCategory(newCat);
    }
    setSelectedCategoryId(newCat.id);
    setUnit(newCat.unit);
    setShowNewCategoryModal(false);
    setNewCatName("");
    setNewCatSizes("50, 100, 200");
  };

  // Handle Add New Brand
  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const cleanBrand = newBrandName.trim();
    const variantsList = newBrandVariants
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const sizesList = newBrandSizes
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((s) => !isNaN(s) && s > 0);

    const targetCategoryName = newBrandCategory.trim() || selectedCategory.name;

    const brandEntry: CustomBrandEntry = {
      brand: cleanBrand,
      category: targetCategoryName,
      variants: variantsList.length ? variantsList : ["Standard"],
      commonSizes: sizesList.length ? sizesList : [100],
      typicalMargin: parseFloat(newBrandMargin) || 20,
      unit: newBrandUnit || selectedCategory.unit,
      addedByRep: repName || "Field Sales Rep",
      createdAt: new Date().toISOString(),
    };

    if (onAddCustomBrand) {
      onAddCustomBrand(brandEntry);
    }

    const targetCat = availableCategories.find(
      (c) => c.name.toLowerCase() === targetCategoryName.toLowerCase()
    );
    if (targetCat) {
      setSelectedCategoryId(targetCat.id);
      setUnit(targetCat.unit);
    }
    setSelectedBrand(cleanBrand);
    setVariant(brandEntry.variants[0] || "Standard");
    setPackSize(brandEntry.commonSizes[0] || 100);
    setCustomPackSize("");
    setShowNewBrandModal(false);
    setShowBrandSearchModal(false);
    setNewBrandName("");
    setNewBrandVariants("");
  };

  // Select brand from search modal
  const handleSelectBrandFromModal = (item: (typeof allCatalogBrands)[0]) => {
    const targetCat = availableCategories.find((c) => c.id === item.categoryId);
    if (targetCat) {
      setSelectedCategoryId(targetCat.id);
      setUnit(targetCat.unit);
    }
    setSelectedBrand(item.brand);
    setVariant(item.defaultProduct || item.variants[0] || "Standard");
    const defSize = item.commonSizes[0] || targetCat?.defaultSizes[0] || 100;
    setPackSize(defSize);
    setCustomPackSize("");
    const estMrp = Math.round(defSize * 1.5);
    const estCost = Math.round(estMrp * (1 - item.typicalMargin / 100));
    setMrp(String(estMrp));
    setRetailerCost(String(estCost));
    setCustomerPrice(String(estMrp));
    setShowBrandSearchModal(false);
    setBrandSearchQuery("");
  };

  // Custom brand quick select
  const handleUseCustomBrand = (customName: string) => {
    setSelectedBrand("Other");
    setCustomBrand(customName);
    setVariant("");
    setShowBrandSearchModal(false);
    setBrandSearchQuery("");
  };

  // Pricing State
  const [mrp, setMrp] = useState<string>("199");
  const [retailerCost, setRetailerCost] = useState<string>("155");
  const [customerPrice, setCustomerPrice] = useState<string>("199");

  // Merchandising State
  const [shelfFacings, setShelfFacings] = useState<number>(6);
  const [shelfPosition, setShelfPosition] = useState<ShelfPosition>("Eye Level (Prime)");
  const [turnoverSpeed, setTurnoverSpeed] = useState<TurnoverSpeed>("Fast (>5 units/wk)");

  // Photo & Notes
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");

  // UI Feedback
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Selected Store Object
  const currentStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  // Active Brand in selected category
  const activeBrandConfig = selectedCategory.brands.find((b) => b.brand === selectedBrand);

  // Handle Category Change
  const handleSelectCategory = (cat: ProductCategoryConfig) => {
    setSelectedCategoryId(cat.id);
    setUnit(cat.unit);
    const firstBrand = cat.brands[0];
    if (firstBrand) {
      setSelectedBrand(firstBrand.brand);
      setVariant(firstBrand.variants[0] || "");
      const defSize = firstBrand.commonSizes[0] || cat.defaultSizes[0] || 100;
      setPackSize(defSize);
      setCustomPackSize("");
      const estMrp = Math.round(defSize * 1.5);
      const estCost = Math.round(estMrp * (1 - firstBrand.typicalMargin / 100));
      setMrp(String(estMrp));
      setRetailerCost(String(estCost));
      setCustomerPrice(String(estMrp));
    } else {
      setSelectedBrand("Other");
      setVariant("");
      setPackSize(cat.defaultSizes[0] || 100);
      setCustomPackSize("");
    }
  };

  // Handle Brand Selection
  const handleSelectBrand = (brandName: string) => {
    setSelectedBrand(brandName);
    const bConfig = selectedCategory.brands.find((b) => b.brand === brandName);
    if (bConfig) {
      setVariant(bConfig.variants[0] || "");
      const defSize = bConfig.commonSizes[0] || selectedCategory.defaultSizes[0] || 100;
      setPackSize(defSize);
      setCustomPackSize("");
      const estMrp = Math.round(defSize * 1.5);
      const estCost = Math.round(estMrp * (1 - bConfig.typicalMargin / 100));
      setMrp(String(estMrp));
      setRetailerCost(String(estCost));
      setCustomerPrice(String(estMrp));
    }
  };

  // Compute Margin %
  const mrpNum = parseFloat(mrp) || 0;
  const costNum = parseFloat(retailerCost) || 0;
  const marginPct =
    mrpNum > 0 && costNum > 0 && mrpNum >= costNum
      ? ((mrpNum - costNum) / mrpNum) * 100
      : 0;

  // Unit rate calculation
  const effectiveSize = packSize === 0 ? parseFloat(customPackSize) || 1 : packSize;
  const unitRate =
    effectiveSize > 0 && mrpNum > 0
      ? ((mrpNum / effectiveSize) * (unit === "kg" || unit === "litres" ? 1 : 100)).toFixed(1)
      : "0";

  const rateLabel =
    unit === "ml"
      ? "per 100ml"
      : unit === "gm"
      ? "per 100g"
      : unit === "kg"
      ? "per kg"
      : unit === "litres"
      ? "per L"
      : "per unit";

  // Handle Photo Selection
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setCompressingPhoto(true);
      const compressedBase64 = await compressImage(file);
      setPhotoData(compressedBase64);
    } catch (err) {
      console.error("Photo compression error", err);
    } finally {
      setCompressingPhoto(false);
    }
  };

  // Toggle Tags
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Handle Add New Store
  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    const newStore: Store = {
      id: "str-" + Date.now().toString(36),
      name: newStoreName.trim(),
      ownerName: newStoreOwner.trim() || undefined,
      phone: newStorePhone.trim() || undefined,
      type: newStoreType,
      state: newStoreState.trim() || "State",
      district: newStoreDistrict.trim() || "District",
      area: newStoreArea.trim() || "Area",
      addedByRep: repName || "Field Rep",
      createdAt: new Date().toISOString(),
    };
    onAddStore(newStore);
    setSelectedStoreId(newStore.id);
    setShowNewStoreModal(false);
    setShowStoreSearchModal(false);
    setNewStoreName("");
    setNewStoreArea("");
    setNewStoreDistrict("");
    setNewStoreState("");
    setNewStoreOwner("");
    setNewStorePhone("");
    setStoreSearchQuery("");
  };

  // Submit Audit
  const handleSubmitAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    const finalBrand =
      selectedBrand === "Other" && customBrand.trim()
        ? customBrand.trim()
        : selectedBrand;

    const finalCategory =
      selectedCategory.id === "general-fmcg" && customCategoryName.trim()
        ? customCategoryName.trim()
        : selectedCategory.name;

    const finalSize =
      packSize === 0 && customPackSize ? parseFloat(customPackSize) || 100 : packSize;

    const newAudit: AuditRecord = {
      id: "aud-" + Date.now().toString(36),
      category: finalCategory,
      storeId: currentStore.id,
      storeName: currentStore.name,
      storeType: currentStore.type,
      state: currentStore.state || "State",
      district: currentStore.district || "District",
      area: currentStore.area,
      repName: repName || "Field Sales Rep",
      brand: finalBrand,
      variant: variant || "Standard",
      packSize: finalSize,
      unit: unit,
      mrp: mrpNum,
      retailerCost: costNum,
      retailerMarginPct: parseFloat(marginPct.toFixed(2)),
      customerPrice: parseFloat(customerPrice) || mrpNum,
      shelfFacings: shelfFacings,
      shelfPosition: shelfPosition,
      turnoverSpeed: turnoverSpeed,
      photoData: photoData || undefined,
      tags: selectedTags,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      synced: false,
    };

    onSubmitAudit(newAudit);

    // Auto-save brand, variant & category to Network Catalog so entire network has it
    if (onAddCustomBrand && finalBrand && finalBrand !== "Other") {
      onAddCustomBrand({
        brand: finalBrand,
        category: finalCategory,
        variants: variant ? [variant] : ["Standard"],
        commonSizes: [finalSize],
        typicalMargin: Math.round(marginPct) || 20,
        unit: unit,
        addedByRep: repName || "Field Sales Rep",
        createdAt: new Date().toISOString(),
      });
    }

    if (onAddCustomCategory && finalCategory) {
      const exists = availableCategories.some(
        (c) => c.name.toLowerCase() === finalCategory.toLowerCase()
      );
      if (!exists) {
        onAddCustomCategory({
          id: finalCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name: finalCategory,
          unit: unit,
          defaultSizes: [finalSize],
          addedByRep: repName || "Field Sales Rep",
          createdAt: new Date().toISOString(),
        });
      }
    }

    setSubmittedSuccess(true);
    setPhotoData(null);
    setSelectedTags([]);
    setNotes("");

    setTimeout(() => {
      setSubmittedSuccess(false);
    }, 2500);
  };

  return (
    <div className="pb-24 max-w-xl mx-auto px-4 pt-3">
      {/* Success Notification Banner */}
      {submittedSuccess && (
        <div className="fixed top-14 left-4 right-4 z-50 max-w-sm mx-auto bg-emerald-600 text-white p-3.5 rounded-xl shadow-xl flex items-center space-x-3 animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-emerald-200 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Audit Saved Locally!</p>
            <p className="text-emerald-100">Ready to sync or record next competitor.</p>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div className="mb-3">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Retail Competitor Audit</span>
        </h1>
        <p className="text-xs text-slate-500">
          Capture competitor pricing, SKU specs, and wholesale margins in 90 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmitAudit} className="space-y-4">
        {/* SECTION 1: PRODUCT CATEGORY SELECTION */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Product Category Being Launched / Audited</span>
            </label>
            <button
              type="button"
              onClick={() => setShowNewCategoryModal(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Category</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {availableCategories.map((cat) => {
              const active = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {selectedCategory.id === "general-fmcg" && (
            <input
              type="text"
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              placeholder="Type custom product category (e.g. Toothpaste, Energy Drink, Face Cream)..."
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 mt-1 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          )}
        </div>

        {/* SECTION 2: STORE / RETAILER SELECTION */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <StoreIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Retail Shop Visited</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setNewStoreName(storeSearchQuery.trim());
                setShowNewStoreModal(true);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Shop</span>
            </button>
          </div>

          {stores.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-amber-900 mb-1">No Retail Shops Registered Yet</p>
              <p className="text-[11px] text-amber-700 mb-2">
                You are starting in clean state. Please register the shop you are visiting.
              </p>
              <button
                type="button"
                onClick={() => setShowNewStoreModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Register Shop Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Tap to Search / Change Store Trigger */}
              <button
                type="button"
                onClick={() => {
                  setShowStoreSearchModal(true);
                  setTimeout(() => searchInputRef.current?.focus(), 150);
                }}
                className="w-full text-left bg-slate-50 hover:bg-slate-100 active:bg-slate-200/70 transition p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden group"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    {currentStore ? (
                      <div>
                        {/* Prominent Full Retail Shop Name */}
                        <div className="text-sm sm:text-base font-black text-slate-900 leading-snug break-words">
                          {currentStore.name}
                        </div>

                        {/* Store Channel & Location Details */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                            {currentStore.type}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>
                              {currentStore.district} &bull; {currentStore.area}
                            </span>
                          </span>
                        </div>

                        {currentStore.ownerName && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            <span className="font-semibold text-slate-600">Owner:</span> {currentStore.ownerName}
                            {currentStore.phone && <span> &bull; Tel: {currentStore.phone}</span>}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          Select or Search Retail Shop
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tap here to search among {stores.length} shops...
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center space-x-1 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs group-hover:bg-blue-700 transition mt-0.5">
                    <Search className="w-3.5 h-3.5" />
                    <span>{currentStore ? "Change" : "Search"}</span>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* SECTION 3: COMPETITOR BRAND & SKU */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Competitor Brand &amp; SKU Specs</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setNewBrandCategory(selectedCategory.name);
                setNewBrandUnit(selectedCategory.unit);
                setShowNewBrandModal(true);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Brand</span>
            </button>
          </div>

          <div className="space-y-2">
            {/* Tap to Search / Change Brand Trigger */}
            <button
              type="button"
              onClick={() => {
                setBrandSearchCategoryFilter(selectedCategory.id);
                setShowBrandSearchModal(true);
                setTimeout(() => brandSearchInputRef.current?.focus(), 150);
              }}
              className="w-full text-left bg-slate-50 hover:bg-slate-100 active:bg-slate-200/70 transition p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden group"
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex-1 min-w-0">
                  {/* Top row: Brand Name & Priority Badge */}
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    {activeBrandConfig?.priority && (
                      <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded shadow-2xs shrink-0">
                        Priority #{activeBrandConfig.priority}
                      </span>
                    )}
                    <span className="text-sm sm:text-base font-black text-slate-900 break-words leading-snug">
                      {selectedBrand === "Other"
                        ? (customBrand.trim() || "Custom Competitor Brand")
                        : selectedBrand}
                    </span>
                  </div>

                  {/* Pills row: Category & Typical Margin */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                      {selectedCategory.name}
                    </span>
                    {activeBrandConfig && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                        ~{activeBrandConfig.typicalMargin}% Margin
                      </span>
                    )}
                  </div>

                  {/* Variant & Pack Details */}
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>
                      {selectedBrand === "Other"
                        ? "Custom competitor entry • Enter details below"
                        : `Variant: ${variant || "Standard"} • ${packSize}${unit}`}
                    </span>
                  </p>
                </div>

                <div className="shrink-0 flex items-center space-x-1 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs group-hover:bg-blue-700 transition mt-0.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>Change</span>
                </div>
              </div>
            </button>
          </div>

          {selectedBrand === "Other" && (
            <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="text-xs text-slate-700 font-bold mb-1 block">
                Type Competitor Brand Name *
              </label>
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder="e.g. Livon, Streax, Biotique, Mamaearth..."
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label className="text-xs text-slate-600 font-medium mb-1 block">Variant / Formulation</label>
            {activeBrandConfig && activeBrandConfig.variants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {activeBrandConfig.variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`text-[11px] px-2 py-1 rounded-md border transition ${
                      variant === v
                        ? "bg-slate-900 border-slate-900 text-white font-medium"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
            <input
              type="text"
              value={variant}
              onChange={(e) => setVariant(e.target.value)}
              placeholder="e.g. Anti-Dandruff, Strong Hold, Deep Clean, Aloe Vera"
              className="w-full text-xs border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-slate-600 font-medium">Pack Size &amp; Unit</label>
              <div className="flex items-center space-x-1">
                {UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      unit === u
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedCategory.defaultSizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    setPackSize(sz);
                    setCustomPackSize("");
                  }}
                  className={`text-xs py-1 px-2.5 rounded-lg font-semibold border transition ${
                    packSize === sz
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {sz} {unit}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-500">Custom size:</span>
              <input
                type="number"
                value={customPackSize}
                onChange={(e) => {
                  setCustomPackSize(e.target.value);
                  setPackSize(0);
                }}
                placeholder="e.g. 120"
                className="w-24 text-xs border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="text-xs text-slate-500 font-semibold">{unit}</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: PRICING & RETAILER MARGIN */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 block flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>4. Pricing &amp; Trade Margin</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Rate: <span className="font-bold text-slate-800">₹{unitRate}</span> {rateLabel}
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                Printed MRP (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="199"
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-xl pl-7 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                Wholesale Landing Cost (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">₹</span>
                <input
                  type="number"
                  value={retailerCost}
                  onChange={(e) => setRetailerCost(e.target.value)}
                  placeholder="150"
                  className="w-full text-base font-bold text-slate-900 border border-slate-300 rounded-xl pl-7 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">Retailer Margin</span>
              <span
                className={`text-lg font-black tracking-tight ${
                  marginPct >= 25
                    ? "text-emerald-600"
                    : marginPct >= 18
                    ? "text-blue-600"
                    : "text-amber-600"
                }`}
              >
                {marginPct.toFixed(1)}%
              </span>
              <span className="text-[11px] text-slate-400 ml-1.5">
                (₹{(mrpNum - costNum).toFixed(0)} / pack)
              </span>
            </div>

            <div className="w-1/2">
              <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                Selling Price (Retail)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1 text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  value={customerPrice}
                  onChange={(e) => setCustomerPrice(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg pl-6 pr-2 py-1 text-slate-800"
                />
              </div>
              {parseFloat(customerPrice) < mrpNum && (
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  Retailer discounts ₹{(mrpNum - parseFloat(customerPrice)).toFixed(0)} below MRP
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: SHELF VISIBILITY */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 block">
            5. Shelf Visibility &amp; Sales Velocity
          </label>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                Shelf Facings (Front Row)
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShelfFacings((c) => Math.max(1, c - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center active:bg-slate-200"
                >
                  -
                </button>
                <span className="flex-1 text-center font-black text-lg text-slate-800">
                  {shelfFacings}
                </span>
                <button
                  type="button"
                  onClick={() => setShelfFacings((c) => c + 1)}
                  className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-300 text-blue-700 font-bold text-lg flex items-center justify-center active:bg-blue-100"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                Turnover Velocity
              </label>
              <select
                value={turnoverSpeed}
                onChange={(e) => setTurnoverSpeed(e.target.value as TurnoverSpeed)}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2.5 text-slate-800 focus:outline-hidden"
              >
                {TURNOVER_SPEEDS.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-600 font-semibold mb-1.5 block">
              Placement Position
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SHELF_POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setShelfPosition(pos)}
                  className={`text-[11px] py-1.5 px-2 rounded-lg border font-medium text-left truncate transition ${
                    shelfPosition === pos
                      ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 6: CAMERA PHOTO */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 block flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-blue-600" />
              <span>6. Shelf Photo Evidence (Optional)</span>
            </span>
            {compressingPhoto && (
              <span className="text-[11px] text-blue-600 font-semibold animate-pulse">
                Compressing...
              </span>
            )}
          </label>

          {photoData ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-48 flex items-center justify-center">
              <img src={photoData} alt="Shelf Audit Preview" className="object-contain max-h-48 w-full" />
              <button
                type="button"
                onClick={() => setPhotoData(null)}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer bg-slate-50 transition">
              <Camera className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">Take Photo with Phone Camera</span>
              <span className="text-[10px] text-slate-400">Auto-compressed on device (&lt;100KB)</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* SECTION 7: FEEDBACK TAGS & NOTES */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 block">
            7. Retailer Feedback &amp; Trade Schemes
          </label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {COMMON_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                    active
                      ? "bg-amber-100 border-amber-400 text-amber-900 font-semibold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Retailer insights (e.g. 'Customer prefers herbal fragrance' or 'Distributor gives ₹20 cash discount per carton')..."
            rows={2}
            className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={stores.length === 0}
          className={`w-full font-bold text-sm py-3.5 px-4 rounded-2xl shadow-md transition flex items-center justify-center space-x-2 ${
            stores.length === 0
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white active:scale-[0.99]"
          }`}
        >
          <span>{stores.length === 0 ? "Please Register Shop First" : "Save Competitor Audit"}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </form>

      {/* MODAL: SEARCH & SELECT SHOP (Fast Auto-Complete & District Filters) */}
      {showStoreSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[82vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 shrink-0 bg-slate-50">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Select Retail Shop</h3>
                    <p className="text-[11px] text-slate-500">
                      {stores.length} shops registered across {availableDistricts.length > 1 ? availableDistricts.length - 1 : 1} district(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewStoreName(storeSearchQuery.trim());
                      setShowNewStoreModal(true);
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Shop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStoreSearchModal(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  placeholder="Search shop name, area, district, owner, phone..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 font-medium placeholder:text-slate-400"
                />
                {storeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStoreSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Pills: Districts & Channel */}
              <div className="mt-2.5 flex items-center space-x-2 overflow-x-auto pb-1 text-xs scrollbar-none">
                {/* District Filter Pill */}
                <div className="shrink-0 flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">District:</span>
                  <select
                    value={searchDistrict}
                    onChange={(e) => setSearchDistrict(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d === "All" ? "All Districts" : d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Channel Filter Pill */}
                <div className="shrink-0 flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Type:</span>
                  <select
                    value={searchChannel}
                    onChange={(e) => setSearchChannel(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="All">All Channels</option>
                    {STORE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proximity / GPS Sort Button */}
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    sortByProximity
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Compass className={`w-3.5 h-3.5 ${detectingGps ? "animate-spin text-blue-600" : ""}`} />
                  <span>{detectingGps ? "Locating..." : sortByProximity ? "Sorted: Nearest" : "Near Me (GPS)"}</span>
                </button>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
              {searchFilteredStores.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <StoreIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    No shops match {storeSearchQuery ? `"${storeSearchQuery}"` : "the selected filters"}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Can&apos;t find this retailer? You can add them in 15 seconds.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStoreName(storeSearchQuery.trim());
                      setShowNewStoreModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {storeSearchQuery ? `+ Register "${storeSearchQuery}"` : "+ Register New Shop"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {searchFilteredStores.map((s) => {
                    const isSelected = s.id === selectedStoreId;
                    const distanceKm =
                      userLocation && s.gpsLat && s.gpsLng
                        ? calculateDistance(userLocation.lat, userLocation.lng, s.gpsLat, s.gpsLng)
                        : null;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStoreId(s.id);
                          setShowStoreSearchModal(false);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-400 ring-1 ring-blue-400"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="text-sm font-extrabold text-slate-900 break-words leading-tight">
                              {s.name}
                            </h4>
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                              {s.type}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1 truncate">
                            <span className="flex items-center space-x-1 shrink-0">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-700">
                                {s.district} &bull; {s.area}
                              </span>
                            </span>
                            {distanceKm !== null && (
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                                {distanceKm < 1
                                  ? `${Math.round(distanceKm * 1000)}m away`
                                  : `${distanceKm.toFixed(1)}km away`}
                              </span>
                            )}
                          </div>
                          {(s.ownerName || s.phone) && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center space-x-2">
                              {s.ownerName && <span>Owner: {s.ownerName}</span>}
                              {s.phone && <span>Tel: {s.phone}</span>}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="text-slate-300">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-medium">
                Showing {searchFilteredStores.length} of {stores.length} shops
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewStoreName(storeSearchQuery.trim());
                  setShowNewStoreModal(true);
                }}
                className="font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Register New Shop</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEARCH & SELECT BRAND (Exact same style as Shop selector modal) */}
      {showBrandSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[82vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 shrink-0 bg-slate-50">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Select Competitor Brand</h3>
                    <p className="text-[11px] text-slate-500">
                      {allCatalogBrands.length} brands cataloged across categories
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewBrandName(brandSearchQuery.trim());
                      setNewBrandCategory(selectedCategory.name);
                      setNewBrandUnit(selectedCategory.unit);
                      setShowNewBrandModal(true);
                    }}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Brand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBrandSearchModal(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Instant Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  ref={brandSearchInputRef}
                  type="text"
                  value={brandSearchQuery}
                  onChange={(e) => setBrandSearchQuery(e.target.value)}
                  placeholder="Search brand name, variant, or category..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 font-medium placeholder:text-slate-400"
                />
                {brandSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setBrandSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Pills: Categories */}
              <div className="mt-2.5 flex items-center space-x-2 overflow-x-auto pb-1 text-xs scrollbar-none">
                <div className="shrink-0 flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Category:</span>
                  <select
                    value={brandSearchCategoryFilter}
                    onChange={(e) => setBrandSearchCategoryFilter(e.target.value)}
                    className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="All">All Categories ({allCatalogBrands.length})</option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.brands.length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
              {searchFilteredBrands.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800 mb-1">
                    No brands match {brandSearchQuery ? `"${brandSearchQuery}"` : "the selected filters"}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Competitor not in the list? You can record them as custom brand.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleUseCustomBrand(brandSearchQuery.trim())}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center space-x-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {brandSearchQuery ? `+ Use "${brandSearchQuery}" as Brand` : "+ Custom Brand"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {/* Quick Custom Option if user has typed something that isn't an exact match */}
                  {brandSearchQuery.trim() &&
                    !searchFilteredBrands.some(
                      (b) => b.brand.toLowerCase() === brandSearchQuery.trim().toLowerCase()
                    ) && (
                      <button
                        type="button"
                        onClick={() => handleUseCustomBrand(brandSearchQuery.trim())}
                        className="w-full text-left p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-dashed border-amber-300 transition flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-amber-900">
                            + Use &ldquo;{brandSearchQuery.trim()}&rdquo; as custom brand
                          </p>
                          <p className="text-[10px] text-amber-700">
                            Record this unlisted competitor product
                          </p>
                        </div>
                        <span className="text-xs bg-amber-200 text-amber-800 font-bold px-2.5 py-1 rounded-lg">
                          Select
                        </span>
                      </button>
                    )}

                  {searchFilteredBrands.map((b) => {
                    const isSelected = selectedBrand === b.brand;
                    return (
                      <button
                        key={`${b.categoryId}-${b.brand}`}
                        type="button"
                        onClick={() => handleSelectBrandFromModal(b)}
                        className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border ${
                          isSelected
                            ? "bg-blue-50/80 border-blue-400 ring-1 ring-blue-400"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            {b.priority && (
                              <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded shadow-2xs shrink-0">
                                Priority #{b.priority}
                              </span>
                            )}
                            <h4 className="text-sm font-extrabold text-slate-900 break-words leading-tight">
                              {b.brand}
                            </h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                              {b.categoryName}
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                              ~{b.typicalMargin}% Margin
                            </span>
                          </div>
                          {b.defaultProduct && (
                            <p className="text-[11px] text-blue-700 font-semibold mt-1 truncate">
                              Benchmark SKU: <span className="font-bold text-slate-800">{b.defaultProduct}</span>
                            </p>
                          )}
                          {b.variants.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              <span className="font-medium text-slate-600">Variants:</span>{" "}
                              {b.variants.join(" • ")}
                            </p>
                          )}
                          {b.commonSizes.length > 0 && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              Common sizes: {b.commonSizes.map((s) => `${s}${b.unit}`).join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="text-slate-300">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0">
              <span className="text-slate-500 font-medium">
                Showing {searchFilteredBrands.length} of {allCatalogBrands.length} brands
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewBrandName(brandSearchQuery.trim());
                  setNewBrandCategory(selectedCategory.name);
                  setNewBrandUnit(selectedCategory.unit);
                  setShowNewBrandModal(true);
                }}
                className="font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Brand</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SHOP */}
      {showNewStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Add New Retail Shop</h3>
              <button
                onClick={() => setShowNewStoreModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateStore} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Royal Beauty Centre, City Salon"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    value={newStoreOwner}
                    onChange={(e) => setNewStoreOwner(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Phone / Tel
                  </label>
                  <input
                    type="tel"
                    value={newStorePhone}
                    onChange={(e) => setNewStorePhone(e.target.value)}
                    placeholder="e.g. 9847012345"
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Channel Type
                </label>
                <select
                  value={newStoreType}
                  onChange={(e) => setNewStoreType(e.target.value as StoreType)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2"
                >
                  {STORE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStoreDistrict}
                    onChange={(e) => setNewStoreDistrict(e.target.value)}
                    placeholder="e.g. Ernakulam, Kozhikode"
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={newStoreState}
                    onChange={(e) => setNewStoreState(e.target.value)}
                    placeholder="e.g. Kerala"
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Area / Street *
                </label>
                <input
                  type="text"
                  required
                  value={newStoreArea}
                  onChange={(e) => setNewStoreArea(e.target.value)}
                  placeholder="e.g. Edappally, MG Road"
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewStoreModal(false)}
                  className="text-xs px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Add &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT CATEGORY TO NETWORK */}
      {showNewCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Category to Network</h3>
                  <p className="text-[10px] text-slate-500">Available to all sales reps on every device</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Bath Soap, Toothpaste, Energy Drinks"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Unit of Measure *
                </label>
                <select
                  value={newCatUnit}
                  onChange={(e) => setNewCatUnit(e.target.value as UnitType)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 font-semibold"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Common Pack Sizes (comma-separated)
                </label>
                <input
                  type="text"
                  value={newCatSizes}
                  onChange={(e) => setNewCatSizes(e.target.value)}
                  placeholder="e.g. 50, 100, 150, 250"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewCategoryModal(false)}
                  className="text-xs px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-xs"
                >
                  Save Category to Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRAND TO NETWORK */}
      {showNewBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Brand to Network</h3>
                  <p className="text-[10px] text-slate-500">Every sales rep can search &amp; select this brand</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewBrandModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateBrand} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Competitor Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Livon, Streax, Biotique, Mamaearth"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Product Category *
                </label>
                <select
                  value={newBrandCategory || selectedCategory.name}
                  onChange={(e) => setNewBrandCategory(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 font-semibold"
                >
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Variants / Formulations (comma-separated)
                </label>
                <input
                  type="text"
                  value={newBrandVariants}
                  onChange={(e) => setNewBrandVariants(e.target.value)}
                  placeholder="e.g. Keratin Smooth, Damage Protection, Herbal"
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Typical Margin %
                  </label>
                  <input
                    type="number"
                    value={newBrandMargin}
                    onChange={(e) => setNewBrandMargin(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Sizes ({selectedCategory.unit})
                  </label>
                  <input
                    type="text"
                    value={newBrandSizes}
                    onChange={(e) => setNewBrandSizes(e.target.value)}
                    placeholder="e.g. 100, 200"
                    className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewBrandModal(false)}
                  className="text-xs px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-xs"
                >
                  Save Brand to Network
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
