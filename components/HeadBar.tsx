"use client";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileHead() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>('کاربر');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        const name = data?.data?.username || 'کاربر';
        setDisplayName(name);
      } catch {}
    })();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always redirect to login page, even if logout API fails
      router.replace('/');
    }
  }
  return (
    <div
      className={`flex items-center justify-between p-5 fixed z-20 bg-white w-full top-0 border-b border-gray-200 ${
        pathname == "/settings"
          ? "bg-[url('/img/HeadBG.png')]"
          : "bg-top bg-no-repeat bg-cover bg-white"
      }`}
    >
      <div className="w-2/3">
        <p className="text-xs text-gray-400">عصر بخیر</p>
        <h2 className="text-lg text-black">سلام {displayName}</h2>
      </div>
      <div className="flex items-center justify-end">
        <button onClick={handleLogout} className="bg-white border border-teal-400 text-teal-400 size-12 rounded-2xl flex items-center justify-center active:scale-95">
          <i className="fi fi-sr-power mt-1"></i>
        </button>
      </div>
    </div>
  );
}
