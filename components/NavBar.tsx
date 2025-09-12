// import { BadgeDollarSign, House, Store, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function NavBar() {
  return (
    <nav className="flex items-center justify-center w-full fixed bottom-0 px-5 py-3 text-xs bg-white text-gray-400">
      <Link href={"/dashboard"} className="w-1/4 text-center">
        <i className="fi fi-sr-house-blank text-teal-400 text-xl"></i>
        <h2 className="text-teal-400">خانه</h2>
      </Link>
      <Link href={"/orders"} className="w-1/4 text-center">
        <i className="fi fi-rr-rectangle-list text-xl"></i>
        <h2>سفارشات</h2>
      </Link>
      <Link href={"/menu"} className="w-1/4 text-center">
        <i className="fi fi-rr-boxes text-xl"></i>
        <h2>منو</h2>
      </Link>
      <Link href={"/settings"} className="w-1/4 text-center">
        <i className="fi fi-rr-settings text-xl"></i>
        <h2>تنظیمات</h2>
      </Link>
    </nav>
  );
}
