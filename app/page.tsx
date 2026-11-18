"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/Header";
import BottomNav, { NavTab } from "@/components/BottomNav";
import AuditForm from "@/components/AuditForm";
import ShopsDirectory from "@/components/ShopsDirectory";
import AuditList from "@/components/AuditList";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ExportDataView from "@/components/ExportDataView";
import { AuditRecord, Store } from "@/lib/types";
import {
  deleteAudit,
  getAudits,
  getStores,
  saveAudit,
  saveStore,
  syncWithCentralRepo,
} from "@/lib/storage";
import { UserCheck, Sparkles, ArrowRight, ShieldCheck, Smartphone } from "lucide-react";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("audit");
  const [stores, setStores] = useState<Store[]>([]);
  const [allAudits, setAllAudits] = useState<AuditRecord[]>([]);
  const [repName, setRepName] = useState<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tempRepInput, setTempRepInput] = useState("");
  const [preselectedStoreId, setPreselectedStoreId] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Initialize data and check if rep name is preset
  useEffect(() => {
    let savedRep = "";
    if (typeof window !== "undefined") {
      savedRep = localStorage.getItem("fieldintel_active_rep_v3") || "";
      if (savedRep.trim()) {
        setRepName(savedRep.trim());
      } else {
        setShowOnboarding(true);
      }
    }
    setStores(getStores());
    setAllAudits(getAudits());
    setIsLoaded(true);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  const handleSaveRepName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempRepInput.trim()) return;
    const cleanName = tempRepInput.trim();
    setRepName(cleanName);
    if (typeof window !== "undefined") {
      localStorage.setItem("fieldintel_active_rep_v3", cleanName);
    }
    setShowOnboarding(false);
  };

  const handleSetRepName = (name: string) => {
    setRepName(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("fieldintel_active_rep_v3", name);
    }
  };

  // PRIVACY: Sales rep ONLY sees their own audits!
  const myAudits = allAudits.filter(
    (a) => a.repName.trim().toLowerCase() === repName.trim().toLowerCase()
  );

  const unsyncedCount = myAudits.filter((a) => !a.synced).length;

  const handleAddStore = (newStore: Store) => {
    const updated = saveStore(newStore);
    setStores(updated);
  };

  const handleSubmitAudit = (newAudit: AuditRecord) => {
    const updated = saveAudit(newAudit);
    setAllAudits(updated);
  };

  const handleDeleteAudit = (id: string) => {
    if (confirm("Delete this competitor audit entry?")) {
      const updated = deleteAudit(id);
      setAllAudits(updated);
    }
  };

  const handleSyncComplete = async () => {
    const res = await syncWithCentralRepo();
    setAllAudits(res.audits);
    setStores(res.stores);
    setSyncToast(res.message);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleReloadData = () => {
    setStores(getStores());
    setAllAudits(getAudits());
  };

  const handleSelectStoreForAudit = (storeId: string) => {
    setPreselectedStoreId(storeId);
    setCurrentTab("audit");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Loading FieldIntel...</p>
        </div>
      </div>
    );
  }

  // MANDATORY ONBOARDING SCREEN: If rep name is not preset, ask before entering app!
  if (showOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-white">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto mb-4 font-black text-xl shadow-lg">
            FI
          </div>

          <h2 className="text-xl font-black tracking-tight mb-1">
            Welcome to FieldIntel
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Retail Competitor Audit PWA. Please enter your name to personalize your territory data.
          </p>

          <form onSubmit={handleSaveRepName} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block text-left mb-1.5">
                Your Full Name or Employee ID *
              </label>
              <input
                type="text"
                required
                value={tempRepInput}
                onChange={(e) => setTempRepInput(e.target.value)}
                placeholder="e.g. John Doe / Rep #104"
                className="w-full text-sm font-semibold bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl transition shadow-md flex items-center justify-center space-x-2"
            >
              <span>Start Field Survey</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Clean State &bull; Zero dummy data &bull; Stored locally</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans select-none sm:select-auto">
      {/* Top Sticky Header */}
      <Header
        unsyncedCount={unsyncedCount}
        onSyncComplete={handleSyncComplete}
        repName={repName}
        setRepName={handleSetRepName}
      />

      {/* Sync Toast Feedback */}
      {syncToast && (
        <div className="fixed top-12 left-4 right-4 z-50 max-w-sm mx-auto bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-center animate-fade-in">
          {syncToast}
        </div>
      )}

      {/* Rep Privacy Notice Banner */}
      <div className="bg-blue-50/80 border-b border-blue-100 px-4 py-1.5 text-center text-[11px] text-blue-700 font-medium">
        Sales Rep: <strong className="font-bold">{repName}</strong> &bull; Clean Territory View
      </div>

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === "audit" && (
          <AuditForm
            stores={stores}
            onAddStore={handleAddStore}
            onSubmitAudit={handleSubmitAudit}
            repName={repName}
            preselectedStoreId={preselectedStoreId}
          />
        )}

        {currentTab === "shops" && (
          <ShopsDirectory
            stores={stores}
            onAddStore={handleAddStore}
            onSelectStoreForAudit={handleSelectStoreForAudit}
            repName={repName}
          />
        )}

        {/* Rep ONLY sees their own audits in Audit Log */}
        {currentTab === "list" && (
          <AuditList audits={myAudits} onDeleteAudit={handleDeleteAudit} />
        )}

        {/* Rep ONLY sees their own beat metrics */}
        {currentTab === "analytics" && (
          <AnalyticsDashboard audits={myAudits} stores={stores} />
        )}

        {currentTab === "export" && (
          <ExportDataView
            audits={myAudits}
            stores={stores}
            onReloadData={handleReloadData}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        auditCount={myAudits.length}
        storeCount={stores.length}
      />
    </div>
  );
}
