"use client";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileHead() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>('کاربر');
  const [scrolled, setScrolled] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        const name = data?.data?.username || 'کاربر';
        setDisplayName(name);
      } catch { }
    })();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (typeof window === 'undefined') return;
      setScrolled(window.scrollY > 8);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll);
    };
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
    <div className={`flex items-center rounded-b-3xl justify-between p-5 fixed z-20 w-full top-0 duration-200 backdrop-blur-md`}>
      <div className="w-2/3">
        <p className="text-xs text-gray-400">عصر بخیر</p>
        <h2 className="text-lg text-black">سلام {displayName}</h2>
      </div>
      <div className="flex items-center justify-end gap-4">
        <button onClick={handleLogout} className={`border size-12 rounded-2xl flex items-center justify-center active:scale-95 ${scrolled ? "border-teal-400 text-teal-400" : pathname == '/dashboard2' ? "bg-transparent border-white text-white" : "bg-white border-teal-400 text-teal-400"}`}>
          <i className="fi fi-sr-power mt-1"></i>
        </button>
      </div>
    </div>
  );
}
