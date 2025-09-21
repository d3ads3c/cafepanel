// import { BadgeDollarSign, House, Store, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="flex items-center justify-center w-full fixed bottom-0 px-2 py-3 text-xs bg-white text-gray-400 border-t border-gray-200">
      <Link href={"/dashboard"} className="w-1/5 text-center">
        <i className="fi fi-sr-house-blank text-teal-400 text-lg"></i>
        <h2 className="text-teal-400 text-xs">خانه</h2>
      </Link>
      <Link href={"/orders"} className="w-1/5 text-center">
        <i className="fi fi-rr-rectangle-list text-lg"></i>
        <h2 className="text-xs">سفارشات</h2>
      </Link>
      <Link href={"/customers"} className="w-1/5 text-center">
        <i className="fi fi-rr-users text-lg"></i>
        <h2 className="text-xs">مشتریان</h2>
      </Link>
      <Link href={"/menu"} className="w-1/5 text-center">
        <i className="fi fi-rr-boxes text-lg"></i>
        <h2 className="text-xs">منو</h2>
      </Link>
      <Link href={"/settings"} className="w-1/5 text-center">
        <i className="fi fi-rr-settings text-lg"></i>
        <h2 className="text-xs">تنظیمات</h2>
      </Link>
    </nav>
  );
}
