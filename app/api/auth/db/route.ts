import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        // Build FormData and include the LoggedUser cookie if present.
        const formData = new FormData();
        formData.append("Invoice", body.Invoice)
        // Read `LoggedUser` cookie from the incoming request (NextRequest exposes `cookies`).
        // `req.cookies.get(name)` returns an object with a `value` property or `undefined`.
        const loggedUserCookie = req.cookies.get("LoggedUser");
        const loggedUser = loggedUserCookie ? loggedUserCookie.value : null;
        if (loggedUser) {
            // send the cookie value as the `token` field expected by the upstream API
            formData.append("token", loggedUser);
        } else {
            // maintain previous behavior if cookie missing
            formData.append("token", "null");
        }

        const xff = req.headers.get('x-forwarded-for');
        const clientIp = xff ? xff.split(',')[0].trim() : (req.headers.get('x-real-ip') || '');
        formData.append('ipaddress',"127.0.0.1");


        const response = await fetch("http://localhost:8000/pay/submit", {
            method: "POST",
            body: formData,
        });
        const data = await response.json();
        if (data.message == "success") {
            const response = NextResponse.json({ trackid: data.trackId, msg: "Success" }, { status: 200 });
            return response;
        } else if (data == "Logout") {
            // Upstream indicated logout — clear the LoggedUser cookie by sending
            // a Set-Cookie header with Max-Age=0 so the browser removes it.
            const cookieHeader = `LoggedUser=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`;
            const resp = NextResponse.json({ msg: "LoggedOut" }, { status: 200 });
            resp.headers.set("Set-Cookie", cookieHeader);
            return resp;
        }

        // Ensure we always return a response. If upstream returned something
        // unexpected (no token and not "No User Found"), treat as invalid.
        return NextResponse.json({ msg: "invalid" }, { status: 200 });
    } catch {
        return NextResponse.json({ msg: "An error occurred" }, { status: 400 });
    }
}