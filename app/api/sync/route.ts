import { NextRequest, NextResponse } from "next/server";
import { getCentralAudits, getCentralStores, syncCentralData } from "@/lib/serverStorage";

// GET: Retrieve records with strict role separation
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("isAdmin") === "true";
    const repName = (searchParams.get("repName") || "").trim().toLowerCase();

    const allAudits = getCentralAudits();
    const allStores = getCentralStores();

    // Admin sees everything
    if (isAdmin) {
      return NextResponse.json({
        success: true,
        isAdmin: true,
        totalAudits: allAudits.length,
        totalStores: allStores.length,
        audits: allAudits,
        stores: allStores,
      });
    }

    // Sales person ONLY sees their own audits
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
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch central data" },
      { status: 500 }
    );
  }
}

// POST: Receive batch of new audits & shops, and return ONLY authorized scope
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingAudits = body.audits || [];
    const incomingStores = body.stores || [];
    const isAdmin = body.isAdmin === true;
    const repName = (body.repName || "").trim().toLowerCase();

    // Merge into central repository
    const result = syncCentralData(incomingAudits, incomingStores);

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
      });
    }

    // If Sales Person, return ONLY their own audits
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
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
