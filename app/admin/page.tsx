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
  Calendar,
} from "lucide-react";
import { AuditRecord, Store } from "@/lib/types";
import {
  exportAuditsToCSV,
  getAudits,
  getStores,
  syncWithCentralRepo,
} from "@/lib/storage";

export default function AdminPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Filters
  const [selectedRep, setSelectedRep] = useState<string>("All");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setStores(getStores());
    setAudits(getAudits());
    setIsLoaded(true);
  }, []);

  const handleSyncData = async () => {
    setSyncing(true);
    const res = await syncWithCentralRepo();
    setAudits(res.audits);
    setStores(res.stores);
    setSyncing(false);
  };

  const handleExportCSV = () => {
    exportAuditsToCSV(audits);
  };

  // Filter lists
  const reps = ["All", ...Array.from(new Set(audits.map((a) => a.repName).filter(Boolean)))];
  const districts = ["All", ...Array.from(new Set(audits.map((a) => a.district).filter(Boolean)))];
  const categories = ["All", ...Array.from(new Set(audits.map((a) => a.category).filter(Boolean)))];

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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-16">
      {/* Top Admin Navbar */}
      <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
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
                <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-md">
                  Executive Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Central Headquarters &bull; Market Launch Command Center
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleSyncData}
              disabled={syncing}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Central Data"}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
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
            <span className="text-xs text-slate-400 block mt-0.5">Competitor SKU benchmarks</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-indigo-600 mb-1">
              <StoreIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Shops Mapped
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900">{totalStoresCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Retail stores enrolled</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-emerald-600 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Sales Reps
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900">{uniqueRepsCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Field staff contributing</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-amber-600 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Districts Covered
              </span>
            </div>
            <span className="text-2xl font-black text-slate-900">{uniqueDistrictsCount}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Regional market territories</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 text-rose-600 mb-1">
              <Percent className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Avg Retail Margin
              </span>
            </div>
            <span className="text-2xl font-black text-rose-600">{avgMargin}%</span>
            <span className="text-xs text-slate-400 block mt-0.5">Competitor trade discount</span>
          </div>
        </div>

        {/* SECTION: PERSON-WISE SALES REP PERFORMANCE & DISTRICT COVERAGE */}
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
                          onClick={() => setSelectedRep(selectedRep === rep.repName ? "All" : rep.repName)}
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

        {/* SECTION: FULL AUDIT DATA GRID & FILTER SEARCH */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span>Central Audit Data Grid</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  {filteredAudits.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Full survey data submitted by sales reps from the field
              </p>
            </div>

            {/* Filter Reset */}
            {(selectedRep !== "All" || selectedDistrict !== "All" || selectedCategory !== "All") && (
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
                {categories.map((c) => (
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
                  <th className="pb-2">Rep</th>
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
                    <td className="py-2.5 text-slate-600 font-medium">{a.repName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
