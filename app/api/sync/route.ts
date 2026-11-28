import { NextRequest, NextResponse } from "next/server";
import {
  getCentralDataAsync,
  resetCentralDataAsync,
  syncCentralDataAsync,
  deleteCentralBrandAsync,
  deleteCentralCategoryAsync,
  updateAuditCategoryAsync,
  deleteCentralStoreAsync,
  deleteCentralAuditAsync,
  setCentralAdminPinAsync,
  setCentralCategoryPolicyAsync,
  isCloudStorageConfigured,
} from "@/lib/serverStorage";

// GET: Retrieve records with strict role separation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("isAdmin") === "true";
    const checkPin = searchParams.get("checkPin") === "true";
    const repName = (searchParams.get("repName") || "").trim().toLowerCase();

    const centralData = await getCentralDataAsync();
    const allAudits = centralData.audits;
    const allStores = centralData.stores;
    const adminPin = centralData.adminPin || "9999";
    const isCloudConfigured = isCloudStorageConfigured();

    // Generate ETag representing current state to prevent downloading unchanged data
    const roleKey = isAdmin ? "admin" : repName || "anon";
    const dataVersion = `W/"${roleKey}-${centralData.lastUpdated || "0"}-${allAudits.length}-${allStores.length}-${centralData.customCategories?.length || 0}-${centralData.customBrands?.length || 0}-${adminPin}-${Boolean(centralData.allowRepAddCategory)}"`;

    const clientIfNoneMatch = req.headers.get("if-none-match");
    if (clientIfNoneMatch && clientIfNoneMatch === dataVersion) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: dataVersion,
          "Cache-Control": "private, no-cache",
        },
      });
    }

    const responseHeaders = {
      ETag: dataVersion,
      "Cache-Control": "private, no-cache",
    };

    // If requested for login check or admin portal
    if (checkPin) {
      return NextResponse.json({
        success: true,
        adminPin,
        isCloudConfigured,
      }, { headers: responseHeaders });
    }

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
        adminPin,
        allowRepAddCategory: Boolean(centralData.allowRepAddCategory),
        isCloudConfigured,
      }, { headers: responseHeaders });
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
      allowRepAddCategory: Boolean(centralData.allowRepAddCategory),
    }, { headers: responseHeaders });
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
    if (action === "set_admin_pin") {
      const { pin } = body;
      if (!pin || String(pin).trim().length < 4) {
        return NextResponse.json(
          { success: false, error: "PIN must be at least 4 digits" },
          { status: 400 }
        );
      }
      const updatedPin = await setCentralAdminPinAsync(String(pin));
      return NextResponse.json({
        success: true,
        message: "Admin PIN updated successfully across the network",
        adminPin: updatedPin,
      });
    }

    if (action === "set_category_policy") {
      const { allowed } = body;
      const updated = await setCentralCategoryPolicyAsync(Boolean(allowed));
      return NextResponse.json({
        success: true,
        message: `Category creation policy updated: ${updated ? "Open to Reps" : "Locked (Admin Only)"}`,
        allowRepAddCategory: updated,
      });
    }

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
      const { categoryName, reassignToCategory } = body;
      const updated = await deleteCentralCategoryAsync(categoryName, reassignToCategory);
      return NextResponse.json({
        success: true,
        message: reassignToCategory
          ? `Category "${categoryName}" deleted and audits migrated to "${reassignToCategory}"`
          : `Category "${categoryName}" deleted from central catalog`,
        categories: updated.customCategories || [],
        brands: updated.customBrands || [],
        stores: updated.stores,
        audits: updated.audits,
      });
    }

    if (action === "reassign_audit_category") {
      const { auditId, newCategory } = body;
      const updated = await updateAuditCategoryAsync(auditId, newCategory);
      return NextResponse.json({
        success: true,
        message: `Audit reassigned to "${newCategory}"`,
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
      incomingBrands,
      isAdmin
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
        allowRepAddCategory: result.allowRepAddCategory,
        isCloudConfigured: isCloudStorageConfigured(),
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
      allowRepAddCategory: result.allowRepAddCategory,
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
