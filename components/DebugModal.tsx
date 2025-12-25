"use client"
import { useState, useEffect } from "react"

interface DebugData {
    dbName: string;
    ipAddress: string;
    cafename: string;
    permissions: string[];
}

export function DebugDetail() {
    const [debugData, setDebugData] = useState<DebugData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDebugData = async () => {
            try {
                // Fetch user info and debug info in parallel using POST
                const [userRes] = await Promise.all([
                    fetch("/api/auth/me", {
                        method: "POST",
                    })
                ]);

                const userData = await userRes.json();
                console.log(userData)

                if (userData.Status === "Success" && userData.Info) {
                    const info = userData.Info;
                    setDebugData({
                        dbName: info.DB || "unknown",
                        ipAddress: info.ipAddress || "unknown",
                        cafename: info.CafeName || "unknown",
                        permissions: info.Permissions || []
                    });
                }
            } catch (error) {
                console.error("Error fetching debug data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDebugData();
    }, []);

    if (loading) {
        return (
            <div className="w-[300px] absolute top-5 left-5 rounded-2xl p-5 bg-white shadow-xl border border-gray-200 h-[300px]">
                <h2 className="text-sm font-light">دیباگ مود</h2>
                <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-[300px] absolute top-5 left-5 rounded-2xl p-5 bg-white shadow-xl border border-gray-200 min-h-[300px]">
            <h2 className="text-sm font-light">دیباگ مود</h2>
            <div className="flex text-sm mt-3 font-light">
                <div className="bg-gray-100 rounded-r-lg w-1/2 p-1">
                    دیتابیس کاربر
                </div>
                <div className="bg-gray-50 rounded-l-lg w-1/2 p-1 text-xs break-all">
                    {debugData?.dbName || "unknown"}
                </div>
            </div>
            <div className="flex text-sm mt-3 font-light">
                <div className="bg-gray-100 rounded-r-lg w-1/2 p-1">
                    دسترسی های کاربر
                </div>
                <div className="bg-gray-50 rounded-l-lg w-1/2 p-1 text-xs">
                    {debugData?.permissions && debugData.permissions.length > 0 
                        ? debugData.permissions
                        : "بدون دسترسی"
                    }
                </div>
            </div>
            <div className="flex text-sm mt-3 font-light">
                <div className="bg-gray-100 rounded-r-lg w-1/2 p-1">
                    IPAddress
                </div>
                <div className="bg-gray-50 rounded-l-lg w-1/2 p-1 text-xs">
                    {debugData?.ipAddress || "unknown"}
                </div>
            </div>
            <div className="flex text-sm mt-3 font-light">
                <div className="bg-gray-100 rounded-r-lg w-1/2 p-1">
                    نام کافه
                </div>
                <div className="bg-gray-50 rounded-l-lg w-1/2 p-1 text-xs">
                    {debugData?.cafename || "unknown"}
                </div>
            </div>
        </div>
    )
}

export default function DebugModal() {
    const [detail, setDetail] = useState<boolean>(false)
    return (
        <>
            <div onClick={() => setDetail(!detail)} className="fixed bottom-20 left-5 rounded-full border border-teal-600 text-teal-600 size-16 bg-white flex items-center justify-center text-2xl">
                <i className="fi fi-sr-bug mt-2"></i>
            </div>
            {detail && (
                <DebugDetail />
            )}
        </>


    )
}