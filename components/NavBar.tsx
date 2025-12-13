"use client"
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center justify-center w-full fixed bottom-0 px-2 py-3 text-xs bg-white text-gray-400 border-t border-gray-200">
      <Link href={"/dashboard"} className="w-1/5 text-center">
        <i className={`fi fi-rr-house-blank text-lg ${isActive("/dashboard") ? "text-teal-400" : ""}`}></i>
        <h2 className={`text-xs ${isActive("/dashboard") ? "text-teal-400" : ""}`}>خانه</h2>
      </Link>
      <Link href={"/orders"} className="w-1/5 text-center">
        <i className={`fi fi-rr-rectangle-list text-lg ${isActive("/orders") ? "text-teal-400" : ""}`}></i>
        <h2 className={`text-xs ${isActive("/orders") ? "text-teal-400" : ""}`}>سفارشات</h2>
      </Link>
      <Link href={"/customers"} className="w-1/5 text-center">
        <i className={`fi fi-rr-users text-lg ${isActive("/customers") ? "text-teal-400" : ""}`}></i>
        <h2 className={`text-xs ${isActive("/customers") ? "text-teal-400" : ""}`}>مشتریان</h2>
      </Link>
      <Link href={"/menu"} className="w-1/5 text-center">
        <i className={`fi fi-rr-boxes text-lg ${isActive("/menu") ? "text-teal-400" : ""}`}></i>
        <h2 className={`text-xs ${isActive("/menu") ? "text-teal-400" : ""}`}>منو</h2>
      </Link>
      <Link href={"/settings"} className="w-1/5 text-center">
        <i className={`fi fi-rr-settings text-lg ${isActive("/settings") ? "text-teal-400" : ""}`}></i>
        <h2 className={`text-xs ${isActive("/settings") ? "text-teal-400" : ""}`}>تنظیمات</h2>
      </Link>
    </nav>
  );
}
