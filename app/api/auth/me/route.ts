import { NextRequest, NextResponse } from "next/server";
// import { getAuth } from "@/lib/auth";
import { getEnhancedAuth } from "@/lib/enhancedAuth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getEnhancedAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { success: false, message: "unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        userId: auth.userId,
        username: auth.username,
        plan: auth.plan,
        cafename: auth.cafename,
        permissions: auth.permissions
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in GET /api/auth/me:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get user info" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the logged user token from cookies
    const loggedUserCookie = request.cookies.get("LoggedUser");
    const loggedUser = loggedUserCookie ? loggedUserCookie.value : null;


    // Fetch subscription details from backend
    const formData = new FormData();
    if (loggedUser) {
      formData.append("token", loggedUser);
    } else {
      formData.append("token", "null");
    }

    const xff = request.headers.get('x-forwarded-for');
    const clientIp = xff ? xff.split(',')[0].trim() : (request.headers.get('x-real-ip') || '');
    if (clientIp) formData.append('ipaddress', clientIp);

    const backendResponse = await fetch("http://localhost:8000/user/info", {
      method: "POST",
      body: formData,
    });
    const backendData = await backendResponse.json();
    if (backendData) {
      return NextResponse.json(
        {
          Status: "Success",
          Info: backendData
        },
        { status: 200 }
      );
    } else if (backendData === "Logout") {
      const cookieHeader = `LoggedUser=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
      const resp = NextResponse.json({ msg: "LoggedOut" }, { status: 401 });
      resp.headers.set("Set-Cookie", cookieHeader);
      return resp;
    }

    return NextResponse.json(
      { message: backendData.message || "خطایی در پذیرش دعوت نامه رخ داد" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "خطایی در سرور رخ داد" },
      { status: 500 }
    );
  }
}



