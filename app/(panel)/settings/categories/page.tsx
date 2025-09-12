"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Category {
  id: number;
  name: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      const result = await response.json();
      
      if (result.success) {
        setCategories(result.data);
      } else {
        setError(result.message || 'خطا در دریافت دسته‌بندی ها');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mt-20">
      <div className="px-5 pt-5 flex items-center justify-between">
        <h1 className="font-bold">دسته‌بندی ها</h1>
        <Link
          href={"/settings/categories/new"}
          className="py-2 px-5 rounded-xl bg-teal-400 text-white text-sm shadow-xl shadow-teal-100"
        >
          دسته‌بندی جدید
        </Link>
      </div>
      
      <div className="px-5 pt-5">
        <div className="flex items-center bg-gray-100 rounded-xl w-full px-4">
          <i className="fi fi-br-search text-gray-400 mt-1.5"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[95%] p-3.5 text-sm bg-transparent focus:outline-none"
            placeholder="جستوجو در دسته‌بندی ها"
          />
        </div>
      </div>

      <div className="px-5 pt-5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-gray-500">در حال بارگذاری...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-red-500 text-center">
              <div className="mb-2">{error}</div>
              <button 
                onClick={fetchCategories}
                className="text-teal-400 hover:text-teal-600"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-gray-500 text-center">
              {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ دسته‌بندی وجود ندارد'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCategories.map((category) => (
              <div key={category.id} className="w-full rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="font-bold text-lg">{category.name}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/settings/categories/edit/${category.id}`}
                      className="text-teal-400 py-2 px-4 rounded-xl text-sm"
                    >
                      ویرایش
                    </Link>
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
