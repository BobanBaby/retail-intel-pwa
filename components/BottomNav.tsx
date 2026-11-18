"use client";

import React from "react";
import { PlusCircle, List, BarChart3, Download, Store as StoreIcon } from "lucide-react";

export type NavTab = "audit" | "shops" | "list" | "analytics" | "export";

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  auditCount: number;
  storeCount: number;
}

export default function BottomNav({
  currentTab,
  onChangeTab,
  auditCount,
  storeCount,
}: BottomNavProps) {
  const tabs = [
    {
      id: "audit" as NavTab,
      label: "New Audit",
      icon: PlusCircle,
    },
    {
      id: "shops" as NavTab,
      label: "Shops",
      icon: StoreIcon,
      badge: storeCount,
    },
    {
      id: "list" as NavTab,
      label: "Audit Log",
      icon: List,
      badge: auditCount,
    },
    {
      id: "analytics" as NavTab,
      label: "Intelligence",
      icon: BarChart3,
    },
    {
      id: "export" as NavTab,
      label: "Sync & Export",
      icon: Download,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg safe-area-pb">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px] scale-110" : "stroke-2"} transition-transform`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[8px] font-bold rounded-full h-3.5 min-w-[14px] px-1 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] mt-0.5 tracking-tight truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
