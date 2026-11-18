"use client";

import React, { useState } from "react";
import { AuditRecord, Store } from "@/lib/types";
import {
  BarChart3,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  ShoppingBag,
  Award,
  Compass,
  Users,
  MapPin,
  CheckCircle,
} from "lucide-react";

interface AnalyticsDashboardProps {
  audits: AuditRecord[];
  stores: Store[];
}

export default function AnalyticsDashboard({
  audits,
  stores,
}: AnalyticsDashboardProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [repFilter, setRepFilter] = useState<string>("All");
  const [districtFilter, setDistrictFilter] = useState<string>("All");
  const [channelFilter, setChannelFilter] = useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(audits.map((a) => a.category).filter(Boolean))),
  ];
  const reps = ["All", ...Array.from(new Set(audits.map((a) => a.repName).filter(Boolean)))];
  const districts = [
    "All",
    ...Array.from(new Set(audits.map((a) => a.district).filter(Boolean))),
  ];
  const channels = ["All", ...Array.from(new Set(audits.map((a) => a.storeType)))];

  const filtered = audits.filter((a) => {
    const matchCategory =
      categoryFilter === "All" || a.category === categoryFilter;
    const matchRep = repFilter === "All" || a.repName === repFilter;
    const matchDistrict =
      districtFilter === "All" || a.district === districtFilter;
    const matchChannel = channelFilter === "All" || a.storeType === channelFilter;
    return matchCategory && matchRep && matchDistrict && matchChannel;
  });

  // KPI Calculations
  const totalAudits = filtered.length;
  const uniqueStoresCount = new Set(filtered.map((a) => a.storeId)).size;

  // Average Retailer Margin %
  const avgMargin =
    totalAudits > 0
      ? (
          filtered.reduce((acc, a) => acc + a.retailerMarginPct, 0) / totalAudits
        ).toFixed(1)
      : "0";

  // Average Unit Rate (rate per 100 units)
  const avgRatePer100 =
    totalAudits > 0
      ? (
          filtered.reduce((acc, a) => acc + (a.mrp / (a.packSize || 1)) * 100, 0) /
          totalAudits
        ).toFixed(0)
      : "0";

  // Person-Wise Performance Breakdown
  const repStatsMap: Record<
    string,
    { auditsCount: number; storeIds: Set<string>; districts: Set<string>; lastDate: string }
  > = {};

  audits.forEach((a) => {
    if (!repStatsMap[a.repName]) {
      repStatsMap[a.repName] = {
        auditsCount: 0,
        storeIds: new Set(),
        districts: new Set(),
        lastDate: a.createdAt,
      };
    }
    const item = repStatsMap[a.repName];
    item.auditsCount += 1;
    item.storeIds.add(a.storeId);
    if (a.district) item.districts.add(a.district);
    if (new Date(a.createdAt) > new Date(item.lastDate)) {
      item.lastDate = a.createdAt;
    }
  });

  const repLeaderboard = Object.entries(repStatsMap)
    .map(([repName, data]) => ({
      repName,
      auditsCount: data.auditsCount,
      uniqueShops: data.storeIds.size,
      districtsCount: data.districts.size,
      districtsList: Array.from(data.districts).join(", "),
      lastDate: data.lastDate,
    }))
    .sort((a, b) => b.auditsCount - a.auditsCount);

  // District-Wise Breakdown
  const districtStatsMap: Record<
    string,
    { auditsCount: number; storeIds: Set<string>; avgMarginSum: number }
  > = {};

  filtered.forEach((a) => {
    const dist = a.district || "Unassigned District";
    if (!districtStatsMap[dist]) {
      districtStatsMap[dist] = {
        auditsCount: 0,
        storeIds: new Set(),
        avgMarginSum: 0,
      };
    }
    districtStatsMap[dist].auditsCount += 1;
    districtStatsMap[dist].storeIds.add(a.storeId);
    districtStatsMap[dist].avgMarginSum += a.retailerMarginPct;
  });

  const districtAnalysis = Object.entries(districtStatsMap)
    .map(([dist, data]) => ({
      district: dist,
      auditsCount: data.auditsCount,
      uniqueShops: data.storeIds.size,
      avgMargin: (data.avgMarginSum / data.auditsCount).toFixed(1),
    }))
    .sort((a, b) => b.auditsCount - a.auditsCount);

  // Brand Facings Breakdown (Share of Shelf)
  const brandFacingsMap: Record<string, number> = {};
  filtered.forEach((a) => {
    brandFacingsMap[a.brand] = (brandFacingsMap[a.brand] || 0) + a.shelfFacings;
  });
  const totalFacings = Object.values(brandFacingsMap).reduce((a, b) => a + b, 0);

  const brandShelfShare = Object.entries(brandFacingsMap)
    .map(([brand, facings]) => ({
      brand,
      facings,
      sharePct: totalFacings > 0 ? ((facings / totalFacings) * 100).toFixed(1) : "0",
    }))
    .sort((a, b) => b.facings - a.facings);

  const topBrand = brandShelfShare[0]?.brand || "N/A";

  // Competitor Margins Comparison
  const brandMarginsMap: Record<string, { sum: number; count: number }> = {};
  filtered.forEach((a) => {
    if (!brandMarginsMap[a.brand]) {
      brandMarginsMap[a.brand] = { sum: 0, count: 0 };
    }
    brandMarginsMap[a.brand].sum += a.retailerMarginPct;
    brandMarginsMap[a.brand].count += 1;
  });

  const brandMargins = Object.entries(brandMarginsMap)
    .map(([brand, data]) => ({
      brand,
      avgMarginPct: (data.sum / data.count).toFixed(1),
    }))
    .sort((a, b) => parseFloat(b.avgMarginPct) - parseFloat(a.avgMarginPct));

  return (
    <div className="pb-24 max-w-2xl mx-auto px-4 pt-3">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <span>Central Market Analytics</span>
        </h1>
        <p className="text-xs text-slate-500">
          Person-wise team submissions, district penetration, and competitive trade pricing.
        </p>
      </div>

      {/* Multi-Dimension Filter Box */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 mb-3.5 space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-hidden"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
              Sales Person
            </label>
            <select
              value={repFilter}
              onChange={(e) => setRepFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-hidden"
            >
              {reps.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
              District
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-hidden"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">
              Channel
            </label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-hidden"
            >
              {channels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-blue-600 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Audits Filtered
            </span>
          </div>
          <span className="text-xl font-black text-slate-900">{totalAudits}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            in {uniqueStoresCount} shops
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-indigo-600 mb-1">
            <Award className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              #1 Brand Facing
            </span>
          </div>
          <span className="text-xl font-black text-slate-900 truncate block">
            {topBrand.split(" ")[0]}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {brandShelfShare[0]?.sharePct}% front shelf
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-emerald-600 mb-1">
            <Percent className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Avg Margin
            </span>
          </div>
          <span className="text-xl font-black text-emerald-600">{avgMargin}%</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            retailer trade margin
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-amber-600 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Unit Rate
            </span>
          </div>
          <span className="text-xl font-black text-slate-900">₹{avgRatePer100}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            per 100 units/ml/gm
          </span>
        </div>
      </div>

      {/* SECTION 1: SALES PERSON-WISE PERFORMANCE LEADERBOARD */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Sales Person-Wise Data Submissions</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {repLeaderboard.length} Reps Contributing
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                <th className="pb-2">Sales Person</th>
                <th className="pb-2 text-center">Audits</th>
                <th className="pb-2 text-center">Shops</th>
                <th className="pb-2">Districts Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repLeaderboard.map((r, idx) => (
                <tr
                  key={r.repName}
                  onClick={() => setRepFilter(r.repName)}
                  className={`hover:bg-slate-50 cursor-pointer ${
                    repFilter === r.repName ? "bg-blue-50/70 font-semibold" : ""
                  }`}
                >
                  <td className="py-2.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-900 font-bold">{r.repName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-black text-blue-600">
                    {r.auditsCount}
                  </td>
                  <td className="py-2.5 text-center text-slate-700 font-semibold">
                    {r.uniqueShops}
                  </td>
                  <td className="py-2.5 text-slate-500 text-[11px] truncate max-w-[140px]">
                    {r.districtsList || "Local"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          &bull; Click any salesperson row to filter all dashboard insights to their territory.
        </p>
      </div>

      {/* SECTION 2: DISTRICT-WISE RETAIL PENETRATION */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>District &amp; Territory Distribution</span>
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">
            {districtAnalysis.length} Active Districts
          </span>
        </h3>

        <div className="space-y-2">
          {districtAnalysis.map((d) => (
            <div
              key={d.district}
              onClick={() => setDistrictFilter(d.district)}
              className="bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer transition"
            >
              <div>
                <span className="font-bold text-xs text-slate-900 block">{d.district}</span>
                <span className="text-[10px] text-slate-500">
                  {d.uniqueShops} shops &bull; {d.auditsCount} competitor SKUs recorded
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600">{d.avgMargin}%</span>
                <span className="text-[10px] text-slate-400 block">avg margin</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: SHARE OF SHELF SPACE */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Brand Share of Shelf Space</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">
            {totalFacings} total visible facings
          </span>
        </h3>

        <div className="space-y-2.5">
          {brandShelfShare.map((item, idx) => {
            const pct = parseFloat(item.sharePct);
            return (
              <div key={item.brand}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">
                    {idx + 1}. {item.brand}
                  </span>
                  <span className="font-bold text-slate-900">
                    {item.sharePct}%{" "}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({item.facings} units)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? "bg-blue-600"
                        : idx === 1
                        ? "bg-indigo-500"
                        : idx === 2
                        ? "bg-sky-500"
                        : "bg-slate-400"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: TRADE MARGIN BENCHMARK */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Percent className="w-3.5 h-3.5 text-emerald-600" />
          <span>Competitor Retailer Margin Benchmark</span>
        </h3>

        <div className="space-y-2.5">
          {brandMargins.map((item) => {
            const margin = parseFloat(item.avgMarginPct);
            return (
              <div key={item.brand} className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 w-1/3 truncate">{item.brand}</span>
                <div className="w-1/2 bg-slate-100 h-2 rounded-full overflow-hidden mx-2">
                  <div
                    className={`h-full rounded-full ${
                      margin >= 25
                        ? "bg-emerald-500"
                        : margin >= 18
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: `${Math.min(100, (margin / 40) * 100)}%` }}
                  />
                </div>
                <span className="font-black text-slate-900 w-12 text-right">
                  {item.avgMarginPct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
