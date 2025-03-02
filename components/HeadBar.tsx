"use client";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function MobileHead() {
  const pathname = usePathname();
  return (
    <div
      className={`flex items-center justify-between p-5 fixed w-full top-0 ${
        pathname.includes("/settings")
          ? ""
          : "bg-top bg-no-repeat bg-cover bg-[url('/img/HeadBG.png')]"
      }`}
    >
      <div className="w-2/3">
        <p className="text-xs text-gray-200">عصر بخیر</p>
        <h2 className="text-lg text-white">سلام ملیکا</h2>
      </div>
      <div className="flex items-center justify-end">
        <div className="bg-white text-teal-500 size-12 rounded-2xl flex items-center justify-center">
          <i className="fi fi-sr-power mt-1"></i>
        </div>
      </div>
    </div>
  );
}
