"use client";

import React, { useState } from "react";
import { AuditRecord } from "@/lib/types";
import {
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  MapPin,
  X,
  Store as StoreIcon,
} from "lucide-react";

interface AuditListProps {
  audits: AuditRecord[];
  onDeleteAudit: (id: string) => void;
}

export default function AuditList({ audits, onDeleteAudit }: AuditListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("All");
  const [activeDetailAudit, setActiveDetailAudit] = useState<AuditRecord | null>(null);

  // Extract unique categories & brands
  const uniqueCategories = [
    "All",
    ...Array.from(new Set(audits.map((a) => a.category).filter(Boolean))),
  ];
  const uniqueBrands = ["All", ...Array.from(new Set(audits.map((a) => a.brand)))];

  const filteredAudits = audits.filter((a) => {
    const matchesSearch =
      a.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.variant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.category && a.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === "All" || a.category === selectedCategoryFilter;
    const matchesBrand =
      selectedBrandFilter === "All" || a.brand === selectedBrandFilter;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="pb-24 max-w-2xl mx-auto px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Field Audit Log
          </h1>
          <p className="text-xs text-slate-500">
            {filteredAudits.length} competitor SKU records captured
          </p>
        </div>
      </div>

      {/* Search and Category Filter Pills */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by store, product, category, or brand..."
            className="w-full text-xs bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        {/* Category Pills */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`text-[11px] px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
                selectedCategoryFilter === cat
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Brand Filter Pills */}
        {uniqueBrands.length > 2 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Brand:</span>
            {uniqueBrands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrandFilter(b)}
                className={`text-[10px] px-2.5 py-0.5 rounded-full whitespace-nowrap font-medium transition ${
                  selectedBrandFilter === b
                    ? "bg-slate-900 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {b === "All" ? "All Brands" : b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Audit Cards List */}
      {filteredAudits.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <StoreIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Audits Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search filter or add a new audit in the first tab.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAudits.map((item) => {
            const pricePerUnit =
              item.packSize > 0 ? (item.mrp / item.packSize).toFixed(2) : "0";
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition"
              >
                {/* Top Row: Store & Badge */}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-sm font-bold text-slate-900">{item.storeName}</h3>
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                        {item.category || "General"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{item.district || item.city || "District"}, {item.area}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-600">{item.storeType}</span>
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {item.synced ? (
                      <span className="flex items-center space-x-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle className="w-2.5 h-2.5" />
                        <span>Synced</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Local</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* SKU Info */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between mb-2.5">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-extrabold text-xs text-blue-700">{item.brand}</span>
                      <span className="text-xs text-slate-700 font-medium">{item.variant}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {item.packSize} {item.unit || "ml"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">₹{item.mrp}</span>
                    <span className="text-[10px] text-slate-400 block">
                      (₹{pricePerUnit}/{item.unit || "unit"})
                    </span>
                  </div>
                </div>

                {/* Metrics Row: Margin, Facings, Speed */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] mb-2.5">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Retailer Margin</span>
                    <span className="font-bold text-emerald-600">
                      {item.retailerMarginPct > 0 ? `${item.retailerMarginPct}%` : "Not Disclosed"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Shelf Facings</span>
                    <span className="font-bold text-slate-800">{item.shelfFacings} units</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Velocity</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {item.turnoverSpeed?.includes("Not Assessed") ? "Unassessed" : item.turnoverSpeed?.split(" ")[0] || "—"}
                    </span>
                  </div>
                </div>

                {/* Tags if any */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Row Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="font-semibold text-slate-700">{item.repName}</span>
                    <span>&bull;</span>
                    <span className="text-slate-500 font-medium">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}{", "}
                      {new Date(item.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setActiveDetailAudit(item)}
                      className="text-blue-600 hover:text-blue-700 font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => onDeleteAudit(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL */}
      {activeDetailAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {activeDetailAudit.category}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeDetailAudit.brand} - {activeDetailAudit.variant}
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailAudit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeDetailAudit.photoData && (
              <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-900 flex items-center justify-center">
                <img
                  src={activeDetailAudit.photoData}
                  alt="Shelf Photo"
                  className="object-contain max-h-56 w-full"
                />
              </div>
            )}

            <div className="space-y-2 text-xs text-slate-700 mb-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block">Shop</span>
                  <span className="font-semibold">{activeDetailAudit.storeName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Channel</span>
                  <span className="font-semibold">{activeDetailAudit.storeType}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Pack Size</span>
                  <span className="font-semibold">
                    {activeDetailAudit.packSize} {activeDetailAudit.unit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">MRP</span>
                  <span className="font-semibold">₹{activeDetailAudit.mrp}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Wholesale Landing</span>
                  <span className="font-semibold">
                    {activeDetailAudit.retailerCost > 0 ? `₹${activeDetailAudit.retailerCost}` : "Not Disclosed"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Retailer Margin</span>
                  <span className="font-semibold text-emerald-600">
                    {activeDetailAudit.retailerMarginPct > 0
                      ? `${activeDetailAudit.retailerMarginPct}% (₹${(activeDetailAudit.mrp - activeDetailAudit.retailerCost).toFixed(0)}/unit)`
                      : "Not Disclosed"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Customer Price</span>
                  <span className="font-semibold">₹{activeDetailAudit.customerPrice}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Shelf Position</span>
                  <span className="font-semibold">{activeDetailAudit.shelfPosition}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Date &amp; Time</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(activeDetailAudit.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}{", "}
                    {new Date(activeDetailAudit.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Field Representative</span>
                  <span className="font-bold text-indigo-700">{activeDetailAudit.repName}</span>
                </div>
              </div>

              {activeDetailAudit.notes && (
                <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-xl">
                  <span className="text-amber-900 font-semibold text-[10px] block mb-0.5">
                    Retailer Feedback:
                  </span>
                  <p className="text-amber-800 text-xs italic">
                    &ldquo;{activeDetailAudit.notes}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveDetailAudit(null)}
              className="w-full bg-slate-900 text-white font-semibold text-xs py-2.5 rounded-xl"
            >
              Close Snapshot
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
