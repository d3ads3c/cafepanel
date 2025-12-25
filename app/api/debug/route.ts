import { NextRequest, NextResponse } from "next/server";
import { getUserDatabaseFromRequest } from "@/lib/getUserDB";

export async function GET(request: NextRequest) {
  try {
    // Get user database name
    const dbName = await getUserDatabaseFromRequest(request);
    
    // Get client IP address
    const xff = request.headers.get("x-forwarded-for");
    const clientIp = xff ? xff.split(",")[0].trim() : (request.headers.get("x-real-ip") || "unknown");
    
    return NextResponse.json(
      {
        success: true,
        dbName: dbName || "unknown",
        ipAddress: clientIp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/debug:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get debug info" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user database name
    const dbName = await getUserDatabaseFromRequest(request);
    
    // Get client IP address
    const xff = request.headers.get("x-forwarded-for");
    const clientIp = xff ? xff.split(",")[0].trim() : (request.headers.get("x-real-ip") || "unknown");
    
    return NextResponse.json(
      {
        success: true,
        dbName: dbName || "unknown",
        ipAddress: clientIp,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/debug:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get debug info" },
      { status: 500 }
    );
  }
}

