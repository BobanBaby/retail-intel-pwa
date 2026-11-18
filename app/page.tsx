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

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("audit");
  const [stores, setStores] = useState<Store[]>([]);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [repName, setRepName] = useState<string>("Rahul Sharma (Rep)");
  const [preselectedStoreId, setPreselectedStoreId] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Initialize data and register Service Worker
  useEffect(() => {
    setStores(getStores());
    setAudits(getAudits());
    setIsLoaded(true);

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  const unsyncedCount = audits.filter((a) => !a.synced).length;

  const handleAddStore = (newStore: Store) => {
    const updated = saveStore(newStore);
    setStores(updated);
  };

  const handleSubmitAudit = (newAudit: AuditRecord) => {
    const updated = saveAudit(newAudit);
    setAudits(updated);
  };

  const handleDeleteAudit = (id: string) => {
    if (confirm("Delete this competitor audit entry?")) {
      const updated = deleteAudit(id);
      setAudits(updated);
    }
  };

  const handleSyncComplete = async () => {
    const res = await syncWithCentralRepo();
    setAudits(res.audits);
    setStores(res.stores);
    setSyncToast(res.message);
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleReloadData = () => {
    setStores(getStores());
    setAudits(getAudits());
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
          <p className="text-sm font-semibold tracking-wide">Loading FieldIntel PWA...</p>
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
        setRepName={setRepName}
      />

      {/* Sync Toast Feedback */}
      {syncToast && (
        <div className="fixed top-12 left-4 right-4 z-50 max-w-sm mx-auto bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-center animate-fade-in">
          {syncToast}
        </div>
      )}

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

        {currentTab === "list" && (
          <AuditList audits={audits} onDeleteAudit={handleDeleteAudit} />
        )}

        {currentTab === "analytics" && (
          <AnalyticsDashboard audits={audits} stores={stores} />
        )}

        {currentTab === "export" && (
          <ExportDataView
            audits={audits}
            stores={stores}
            onReloadData={handleReloadData}
          />
        )}
      </main>

      {/* Bottom Sticky Navigation */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        auditCount={audits.length}
        storeCount={stores.length}
      />
    </div>
  );
}
