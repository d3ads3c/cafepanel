"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/lib/useToast";
import CustomSelect from "@/components/ui/Select";
import QRCode from "qrcode";
interface MenuItem {
  id: number;
  name: string;
  info: string;
  price: number;
  image: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status: number;
}

export default function MenuItems() {
  const { success: showSuccess, error: showError } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // Format price with commas
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Fetch menu items from database
  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/menu/all");
      const result = await response.json();

      if (result.success) {
        setMenuItems(result.data);
      } else {
        setError(result.message || "خطا در دریافت آیتم ها");
      }
    } catch (error) {
      console.error("Error fetching menu items:");
      setError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMenuItems();
    // Load categories for filter
    (async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (e) {}
    })();
  }, []);

  // Filter menu items based on search term and category
  const filteredItems = menuItems.filter((item) => {
    const safeName = (item.name || "").toLowerCase();
    const safeInfo = (item.info || "").toLowerCase();
    const query = (searchTerm || "").toLowerCase();
    const matchesSearch = safeName.includes(query) || safeInfo.includes(query);
    const matchesCategory =
      selectedCategoryId === null || item.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });
  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این آیتم مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess("آیتم حذف شد");
        fetchMenuItems();
      } else {
        showError(data.message || "خطا در حذف آیتم");
      }
    } catch (e) {
      showError("خطا در ارتباط با سرور");
    }
  };

  async function downloadQRCode(text: string) {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 1000,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "menu-qrcode.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br py-8 px-2 sm:px-6">
      {/* Header */}
      <div className="mx-auto mb-8 pt-20 xl:pt-0">
        <div className="flex sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              آیتم های منو
            </h1>
            <p className="text-gray-500 text-xs">مدیریت و ویرایش منو محصولات</p>
          </div>
          <div>
            <div className="bg-white rounded-full py-1 pr-3 pl-1 flex items-center justify-center gap-2">
              <p className="text-sm text-gray-500">لینک منو شما</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadQRCode("https://menu.cafegah.ir/cafea")
                  }
                  className="text-gray-400 mt-1.5"
                >
                  <i className="fi fi-rr-qr-scan"></i>
                </button>
                <button type="button" className="text-gray-400 mt-1.5">
                  <i className="fi fi-rr-duplicate"></i>
                </button>
              </div>
              <h3 className="text-sm text-teal-600 bg-gray-100 rounded-full py-1 px-3">
                https://menu.cafegah.ir/cafea
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Link
              href={"/menu/new"}
              className="inline-flex items-center text-xs xl:text-sm gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              دسته بندی ها
            </Link>
            <Link
              href={"/menu/new"}
              className="inline-flex items-center text-xs xl:text-sm gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              آیتم جدید
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mx-auto mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
              placeholder="جستجو در نام یا توضیحات..."
            />
          </div>

          {/* Category Filter */}
          <div className="sm:w-56">
            <CustomSelect
              options={categories}
              onSelect={setSelectedCategoryId}
              defaultValue={selectedCategoryId}
              placeholder="همه دسته‌ها"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className=" mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">در حال بارگذاری...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-red-500 font-semibold mb-4">{error}</div>
              <button
                onClick={fetchMenuItems}
                className="px-6 py-2.5 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-500 font-medium">
                {searchTerm
                  ? "نتیجه‌ای یافت نشد"
                  : "هیچ آیتمی در منو وجود ندارد"}
              </p>
              {!searchTerm && (
                <Link
                  href="/menu/new"
                  className="inline-block mt-4 text-teal-500 hover:text-teal-600 font-medium"
                >
                  آیتم جدید اضافه کنید
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              >
                {/* Image Container */}
                <div className="w-full h-40 flex-shrink-0 bg-gray-100 overflow-hidden relative">
                  {item.image ? (
                    <Image
                      src={item.image}
                      width={300}
                      height={200}
                      quality={85}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {item.categoryName && (
                    <div className="absolute top-2 right-2 md:static md:mb-0">
                      <span className="inline-block px-2 py-0.5 md:px-2 md:py-1 bg-teal-100 md:bg-teal-500 text-teal-700 md:text-white text-xs font-semibold rounded-full flex-shrink-0">
                        {item.categoryName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col">
                  <h3 className="font-bold text-sm text-gray-900 mb-2 line-clamp-2">
                    {item.name}
                  </h3>

                  {item.info && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {item.info}
                    </p>
                  )}

                  <div className="mt-auto">
                    <p className="text-base font-bold text-teal-600 mb-3">
                      {formatPrice(item.price)} تومان
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link
                        href={`/menu/edit/${item.id}`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 transition-colors text-xs font-semibold gap-1"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        ویرایش
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-xs font-semibold gap-1"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
