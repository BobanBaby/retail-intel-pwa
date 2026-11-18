import { NextRequest, NextResponse } from "next/server";
import {
  getCentralDataAsync,
  resetCentralDataAsync,
  syncCentralDataAsync,
  deleteCentralBrandAsync,
  deleteCentralCategoryAsync,
  deleteCentralStoreAsync,
  deleteCentralAuditAsync,
} from "@/lib/serverStorage";

// GET: Retrieve records with strict role separation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("isAdmin") === "true";
    const repName = (searchParams.get("repName") || "").trim().toLowerCase();

    const centralData = await getCentralDataAsync();
    const allAudits = centralData.audits;
    const allStores = centralData.stores;

    // Admin sees everything
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        totalAudits: allAudits.length,
        totalStores: allStores.length,
        audits: allAudits,
        stores: allStores,
        categories: centralData.customCategories || [],
        brands: centralData.customBrands || [],
      });
    }

    // Sales person ONLY sees their own audits, but gets all stores, categories & brands
    const myAudits = repName
      ? allAudits.filter((a) => a.repName.trim().toLowerCase() === repName)
      : [];

    return NextResponse.json({
      success: true,
      isAdmin: false,
      totalAudits: myAudits.length,
      totalStores: allStores.length,
      audits: myAudits,
      stores: allStores,
      categories: centralData.customCategories || [],
      brands: centralData.customBrands || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch central data" },
      { status: 500 }
    );
  }
}

// POST: Receive batch of new audits, shops, custom categories & brands, or perform admin management actions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // Handle Admin Deletions & Management Actions
    if (action === "delete_brand") {
      const { brandName, category } = body;
      const updated = await deleteCentralBrandAsync(brandName, category);
      return NextResponse.json({
        success: true,
        message: `Brand "${brandName}" deleted from central catalog`,
        categories: updated.customCategories || [],
        brands: updated.customBrands || [],
        stores: updated.stores,
        audits: updated.audits,
      });
    }

    if (action === "delete_category") {
      const { categoryName } = body;
      const updated = await deleteCentralCategoryAsync(categoryName);
      return NextResponse.json({
        success: true,
        message: `Category "${categoryName}" deleted from central catalog`,
        categories: updated.customCategories || [],
        brands: updated.customBrands || [],
        stores: updated.stores,
        audits: updated.audits,
      });
    }

    if (action === "delete_store") {
      const { storeId } = body;
      const updated = await deleteCentralStoreAsync(storeId);
      return NextResponse.json({
        success: true,
        message: `Store deleted from central network`,
        stores: updated.stores,
        audits: updated.audits,
        categories: updated.customCategories || [],
        brands: updated.customBrands || [],
      });
    }

    if (action === "delete_audit") {
      const { auditId } = body;
      const updated = await deleteCentralAuditAsync(auditId);
      return NextResponse.json({
        success: true,
        message: `Audit record deleted from central repository`,
        audits: updated.audits,
        stores: updated.stores,
        categories: updated.customCategories || [],
        brands: updated.customBrands || [],
      });
    }

    const incomingAudits = body.audits || [];
    const incomingStores = body.stores || [];
    const incomingCategories = body.categories || [];
    const incomingBrands = body.brands || [];
    const isAdmin = body.isAdmin === true;
    const repName = (body.repName || "").trim().toLowerCase();

    // Merge into central repository
    const result = await syncCentralDataAsync(
      incomingAudits,
      incomingStores,
      incomingCategories,
      incomingBrands
    );

    // If Admin, return full global organization data
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        message: "Central Repository updated (Full Admin Scope)",
        addedAuditsCount: result.addedAuditsCount,
        addedStoresCount: result.addedStoresCount,
        totalAudits: result.audits.length,
        totalStores: result.stores.length,
        audits: result.audits,
        stores: result.stores,
        categories: result.categories,
        brands: result.brands,
      });
    }

    // If Sales Person, return ONLY their own audits, but all stores, categories & brands
    const myAudits = repName
      ? result.audits.filter((a) => a.repName.trim().toLowerCase() === repName)
      : [];

    return NextResponse.json({
      success: true,
      isAdmin: false,
      message: "Your territory audits synced successfully",
      addedAuditsCount: result.addedAuditsCount,
      addedStoresCount: result.addedStoresCount,
      totalAudits: myAudits.length,
      totalStores: result.stores.length,
      audits: myAudits,
      stores: result.stores,
      categories: result.categories,
      brands: result.brands,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}

// DELETE: Admin wipe - reset entire central database back to fresh clean state
export async function DELETE() {
  try {
    await resetCentralDataAsync();
    return NextResponse.json({
      success: true,
      message: "Central server repository wiped clean. System reset to fresh state.",
      totalAudits: 0,
      totalStores: 0,
      audits: [],
      stores: [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to reset server repository" },
      { status: 500 }
    );
  }
}
