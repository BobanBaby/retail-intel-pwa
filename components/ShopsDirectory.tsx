"use client";

import React, { useState } from "react";
import { Store, StoreType } from "@/lib/types";
import {
  Store as StoreIcon,
  Plus,
  Search,
  MapPin,
  Phone,
  User,
  Crosshair,
  Filter,
  CheckCircle,
  FilePlus,
  ChevronRight,
  X,
  Compass,
} from "lucide-react";

interface ShopsDirectoryProps {
  stores: Store[];
  onAddStore: (store: Store) => void;
  onSelectStoreForAudit: (storeId: string) => void;
  repName: string;
}

const STORE_TYPES: StoreType[] = [
  "Salon / Parlour",
  "Cosmetic Specialist",
  "Chemist / Pharmacy",
  "Supermarket / Modern Trade",
  "Kirana / General Store",
  "Wholesale / Distributor",
];

export default function ShopsDirectory({
  stores,
  onAddStore,
  onSelectStoreForAudit,
  repName,
}: ShopsDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedChannel, setSelectedChannel] = useState<string>("All");

  // New Shop Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<StoreType>("Salon / Parlour");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [gpsLat, setGpsLat] = useState<number | undefined>(undefined);
  const [gpsLng, setGpsLng] = useState<number | undefined>(undefined);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState("");

  const districts = [
    "All",
    ...Array.from(new Set(stores.map((s) => s.district).filter(Boolean))),
  ];

  const filteredStores = stores.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
      s.area.toLowerCase().includes(q) ||
      (s.district && s.district.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(searchTerm));
    const matchesDistrict =
      selectedDistrict === "All" || s.district === selectedDistrict;
    const matchesChannel =
      selectedChannel === "All" || s.type === selectedChannel;

    return matchesSearch && matchesDistrict && matchesChannel;
  });

  // Handle GPS location detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsMessage("Geolocation not supported by device");
      return;
    }
    setDetectingGps(true);
    setGpsMessage("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(parseFloat(pos.coords.latitude.toFixed(5)));
        setGpsLng(parseFloat(pos.coords.longitude.toFixed(5)));
        setDetectingGps(false);
        setGpsMessage(`Captured: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        setDetectingGps(false);
        setGpsMessage("Could not retrieve GPS (check permission)");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleCreateShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newShop: Store = {
      id: "str-" + Date.now().toString(36),
      name: name.trim(),
      ownerName: ownerName.trim() || undefined,
      phone: phone.trim() || undefined,
      type: type,
      state: state.trim() || "State",
      district: district.trim() || "District",
      area: area.trim() || "Area",
      pincode: pincode.trim() || undefined,
      gpsLat: gpsLat,
      gpsLng: gpsLng,
      addedByRep: repName || "Field Sales Rep",
      createdAt: new Date().toISOString(),
    };

    onAddStore(newShop);
    setShowAddModal(false);
    // Reset form
    setName("");
    setOwnerName("");
    setPhone("");
    setDistrict("");
    setState("");
    setArea("");
    setPincode("");
    setGpsLat(undefined);
    setGpsLng(undefined);
    setGpsMessage("");
  };

  return (
    <div className="pb-24 max-w-2xl mx-auto px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Shops Directory</span>
            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              District &amp; Area
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            {stores.length} retail outlets registered across {districts.length - 1} districts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shop</span>
        </button>
      </div>

      {/* Search & District Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by shop name, owner, area, or phone..."
            className="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* District Filter Bar */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by District:
          </div>
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {districts.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDistrict(d)}
                className={`text-[11px] px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
                  selectedDistrict === d
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stores List */}
      {filteredStores.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <StoreIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Shops Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No shops match this filter. Tap &ldquo;Add Shop&rdquo; above to register a new outlet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStores.map((shop) => (
            <div
              key={shop.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{shop.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                    <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {shop.district}
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-700 font-medium">{shop.area}</span>
                    {shop.state && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-500">{shop.state}</span>
                      </>
                    )}
                  </div>
                </div>

                <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-1 rounded-full shrink-0">
                  {shop.type}
                </span>
              </div>

              {/* Owner and Phone Row */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                <div className="flex items-center space-x-1.5 truncate">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {shop.ownerName ? shop.ownerName : "Owner not listed"}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 truncate">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{shop.phone ? shop.phone : "No phone"}</span>
                </div>
              </div>

              {/* Action: Audit Now Button */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span>Enrolled by: {shop.addedByRep || "Sales Team"}</span>
                <button
                  onClick={() => onSelectStoreForAudit(shop.id)}
                  className="bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 shadow-2xs"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Audit at Shop</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD SHOP */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Retail Shop</h3>
                <p className="text-xs text-slate-500">Capture outlet location district and contact info</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Shop / Establishment Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Royal Beauty Salon & Cosmetics"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Owner / Contact Person
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Phone / Mobile No.
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Retail Channel / Store Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as StoreType)}
                  className="w-full border border-slate-300 rounded-xl px-2.5 py-2 text-xs bg-slate-50"
                >
                  {STORE_TYPES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* District & State */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Bengaluru Urban, Mumbai, Ernakulam"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Karnataka, Maharashtra, Delhi"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Area & Pincode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Area / Street / Market *
                  </label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Indiranagar 100ft Rd"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 560038"
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* GPS Auto Detect */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center space-x-1">
                    <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                    <span>GPS Coordinates</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingGps}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    {detectingGps ? "Acquiring..." : "Capture Current GPS"}
                  </button>
                </div>
                {gpsMessage && (
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{gpsMessage}</p>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl shadow-xs"
                >
                  Save &amp; Register Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
