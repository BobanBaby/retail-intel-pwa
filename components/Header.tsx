"use client";

import React, { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw, Smartphone } from "lucide-react";
import { syncWithCentralRepo } from "@/lib/storage";

interface HeaderProps {
  unsyncedCount: number;
  onSyncComplete: () => void;
  repName: string;
  setRepName: (name: string) => void;
}

export default function Header({
  unsyncedCount,
  onSyncComplete,
  repName,
  setRepName,
}: HeaderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showRepModal, setShowRepModal] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSync = async () => {
    if (unsyncedCount === 0) return;
    setSyncing(true);
    await syncWithCentralRepo();
    setSyncing(false);
    onSyncComplete();
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-base shadow">
            FI
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight">FieldIntel</span>
              <span className="text-[10px] uppercase font-semibold bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Retail Competitor &amp; Pricing Audit</p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center space-x-2">
          {/* Admin Portal Button */}
          <a
            href="/admin"
            className="text-[11px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-2.5 py-1 rounded-full transition shadow-xs flex items-center space-x-1"
            title="Open Executive Admin Dashboard"
          >
            <span>Admin</span>
          </a>

          {/* Rep Badge */}
          <button
            onClick={() => setShowRepModal(true)}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 flex items-center space-x-1 transition"
            title="Switch Sales Rep"
          >
            <Smartphone className="w-3 h-3 text-slate-400" />
            <span className="max-w-[70px] sm:max-w-[100px] truncate">{repName}</span>
          </button>

          {/* Online/Offline Status */}
          <div
            className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded-full border ${
              isOnline
                ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-400"
                : "bg-amber-950/60 border-amber-700/60 text-amber-400"
            }`}
          >
            {isOnline ? (
              <>
                <Cloud className="w-3 h-3" />
                <span className="hidden sm:inline text-[11px]">Online</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3 h-3" />
                <span className="text-[11px]">Offline</span>
              </>
            )}
          </div>

          {/* Sync Button */}
          {unsyncedCount > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs px-2.5 py-1 rounded-full transition shadow-sm animate-pulse"
              title="Sync pending audits"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : `${unsyncedCount} Sync`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modal for setting Rep name */}
      {showRepModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-xl p-5 max-w-xs w-full shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Field Representative</h3>
            <p className="text-xs text-slate-500 mb-3">All audits entered on this device will be tagged under your name.</p>
            <input
              type="text"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRepModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
