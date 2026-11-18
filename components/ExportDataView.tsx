"use client";

import React, { useState } from "react";
import { AuditRecord, Store } from "@/lib/types";
import { exportAuditsToCSV, syncWithCentralRepo } from "@/lib/storage";
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  Share2,
  Cloud,
  Database,
  RefreshCw,
} from "lucide-react";

interface ExportDataViewProps {
  audits: AuditRecord[];
  stores: Store[];
  onReloadData: () => void;
}

export default function ExportDataView({
  audits,
  stores,
  onReloadData,
}: ExportDataViewProps) {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const handleExportCSV = () => {
    exportAuditsToCSV(audits);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(audits, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCentralSync = async () => {
    setSyncing(true);
    setSyncMessage("Syncing with Central Repository...");
    const res = await syncWithCentralRepo();
    setSyncing(false);
    setSyncMessage(res.message);
    onReloadData();
    setTimeout(() => setSyncMessage(""), 3500);
  };

  const handleClearData = () => {
    if (
      confirm(
        "Are you sure you want to clear your local device storage cache? This will reset your device state."
      )
    ) {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
      window.location.reload();
    }
  };

  return (
    <div className="pb-24 max-w-xl mx-auto px-4 pt-3">
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Central Repository &amp; Export
        </h1>
        <p className="text-xs text-slate-500">
          Sync across all field sales reps, download CSV spreadsheets, or back up JSON.
        </p>
      </div>

      <div className="space-y-3.5">
        {/* Central Repository Sync Card */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-2xl shadow-sm border border-blue-800">
          <div className="flex items-center space-x-3 mb-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/30 text-blue-300 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Central Multi-User Sync</h3>
              <p className="text-xs text-blue-200">
                Merges your audits with audits entered by all other sales reps.
              </p>
            </div>
          </div>

          <button
            onClick={handleCentralSync}
            disabled={syncing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync with Central Server Now"}</span>
          </button>

          {syncMessage && (
            <p className="text-center text-[11px] text-emerald-300 font-medium mt-2">
              {syncMessage}
            </p>
          )}
        </div>

        {/* CSV Export Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Export to Excel / CSV
              </h3>
              <p className="text-xs text-slate-500">
                District, area, sales rep, store, pricing, and margin columns.
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download All Data .CSV ({audits.length} Audits, {stores.length} Shops)</span>
          </button>
        </div>

        {/* Copy Raw JSON */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Raw JSON Clipboard
              </h3>
              <p className="text-xs text-slate-500">
                For feeding directly into Python / Pandas or Supabase.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyJSON}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center space-x-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Copy Raw JSON Payload</span>
              </>
            )}
          </button>
        </div>

        {/* PWA Mobile Installation Guide */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800">
          <div className="flex items-center space-x-2.5 mb-2.5">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">
              How Sales Team Installs on Phones
            </h3>
          </div>
          <ol className="text-xs text-slate-300 space-y-1.5 list-decimal pl-4 mb-3">
            <li>Share the app URL with all sales representatives.</li>
            <li>
              Reps open the link in Chrome / Safari and tap <strong className="text-white">&ldquo;Add to Home Screen&rdquo;</strong>.
            </li>
            <li>Each rep sets their name once in the top bar. All entries are automatically tagged person-wise.</li>
          </ol>
          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/60 p-2 rounded-xl border border-emerald-800/60">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Works 100% offline. Audits queue locally and sync whenever signal returns.</span>
          </div>
        </div>

        {/* Reset Device Cache */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-center">
          <p className="text-xs text-slate-500 mb-2">
            Need to change sales representative identity or clear device cache?
          </p>
          <button
            onClick={handleClearData}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center justify-center space-x-1.5 mx-auto py-1 px-3 rounded-lg hover:bg-rose-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Device Identity &amp; Local Storage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
