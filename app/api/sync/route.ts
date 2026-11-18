import { NextRequest, NextResponse } from "next/server";
import { getCentralAudits, getCentralStores, syncCentralData } from "@/lib/serverStorage";

// GET: Retrieve all records currently in the central repository
export async function GET() {
  try {
    const audits = getCentralAudits();
    const stores = getCentralStores();
    return NextResponse.json({
      success: true,
      totalAudits: audits.length,
      totalStores: stores.length,
      audits,
      stores,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch central data" },
      { status: 500 }
    );
  }
}

// POST: Receive batch of new audits & shops from a sales rep's phone, merge into central repo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingAudits = body.audits || [];
    const incomingStores = body.stores || [];

    const result = syncCentralData(incomingAudits, incomingStores);

    return NextResponse.json({
      success: true,
      message: "Synced successfully with Central Repository",
      addedAuditsCount: result.addedAuditsCount,
      addedStoresCount: result.addedStoresCount,
      totalAudits: result.audits.length,
      totalStores: result.stores.length,
      audits: result.audits,
      stores: result.stores,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
