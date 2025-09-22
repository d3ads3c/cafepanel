"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

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
      console.error("Error fetching menu items:", error);
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
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (e) {}
    })();
  }, []);

  // Filter menu items based on search term and category
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.info.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId === null || item.categoryId === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: number) => {
    if (!confirm('آیا از حذف این آیتم مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('آیتم حذف شد');
        fetchMenuItems();
      } else {
        toast.error(data.message || 'خطا در حذف آیتم');
      }
    } catch (e) {
      toast.error('خطا در ارتباط با سرور');
    }
  };

  return (
    <div className="xl:mt-0 mt-20">
      <div className="xl:px-0 px-5 pt-5 flex items-center justify-between">
        <h1 className="font-bold text-lg xl:text-xl">آیتم های منو</h1>
        <Link
          href={"/menu/new"}
          className="py-2 px-5 rounded-xl bg-teal-400 text-white text-sm xl:text-base shadow-xl shadow-teal-100 hover:bg-teal-500 transition-colors"
        >
          آیتم جدید
        </Link>
      </div>

      <div className="xl:px-0 px-5 pt-5">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center xl:justify-between">
          <div className="flex items-center bg-gray-100 rounded-xl w-full px-4">
          <i className="fi fi-br-search text-gray-400 mt-1.5"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[95%] p-3.5 text-sm xl:text-base bg-transparent focus:outline-none"
            placeholder="جستوجو"
          />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCategoryId ?? ''}
              onChange={(e) => setSelectedCategoryId(e.target.value === '' ? null : Number(e.target.value))}
              className="p-3.5 text-sm xl:text-base bg-white border rounded-xl"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="xl:px-0 px-5 pt-5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-gray-500">در حال بارگذاری...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-red-500 text-center">
              <div className="mb-2">{error}</div>
              <button
                onClick={fetchMenuItems}
                className="text-teal-400 hover:text-teal-600"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-gray-500 text-center">
              {searchTerm ? "نتیجه‌ای یافت نشد" : "هیچ آیتمی در منو وجود ندارد"}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
            {filteredItems.map((item) => (
              <div key={item.id} className="w-full rounded-3xl border p-3 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-5">
                  <div className="w-1/3">
                    {item.image ? (
                      <Image
                        src={item.image}
                        width={1000}
                        height={1000}
                        quality={100}
                        alt={item.name}
                        className="max-w-[120px] h-[120px] rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="max-w-[120px] h-[120px] bg-gray-200 rounded-2xl flex items-center justify-center">
                        <span className="text-gray-400 text-sm">
                          بدون تصویر
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-2/3">
                    {item.categoryName && (
                      <p className="text-xs xl:text-sm text-teal-500 mb-1">
                        {item.categoryName}
                      </p>
                    )}
                    <h2 className="font-bold text-sm xl:text-base">{item.name}</h2>
                    <p className="text-sm xl:text-base text-gray-400 font-light">
                      {item.info}
                    </p>
                    <h3 className="mt-3 text-sm xl:text-base font-medium">{formatPrice(item.price)} تومان</h3>
                  </div>
                </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/menu/edit/${item.id}`}
                  className="text-center text-white bg-teal-400 py-3 rounded-2xl hover:bg-teal-500 transition-colors"
                >
                  ویرایش
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-center text-red-600 border border-red-200 hover:bg-red-50 py-3 rounded-2xl transition-colors"
                >
                  حذف
                </button>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
