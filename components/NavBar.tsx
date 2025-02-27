import { BadgeDollarSign, House, Store, Settings } from "lucide-react";
import Image from "next/image";

export default function NavBar() {
  return (
    <nav className="flex items-center justify-center w-full fixed bottom-0 px-5 py-3">
      <div className="w-1/4 text-center">
        <House className="mx-auto mb-1" />
        <h2>خانه</h2>
      </div>
      <div className="w-1/4 text-center">
        <BadgeDollarSign className="mx-auto mb-1" />
        <h2>صندوق</h2>
      </div>
      <div className="w-1/4 text-center">
        <Store className="mx-auto mb-1" />
        <h2>منو</h2>
      </div>
      <div className="w-1/4 text-center">
        <Settings className="mx-auto mb-1" />
        <h2>تنظیمات</h2>
      </div>
    </nav>
  );
}
