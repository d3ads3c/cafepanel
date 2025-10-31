"use client";

import { Card } from "@/components/ui/Card";
import pricesData from "@/data/prices.json";
import { useState, useRef } from "react";

interface PriceItem {
  name: string;
  price: string;
}

interface PricesData {
  [key: string]: PriceItem[];
}

export default function PricesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Get cafe names from the prices.json data
  const cafeOptions = Object.keys(pricesData as PricesData);
  const [selectedCafe, setSelectedCafe] = useState<string>(cafeOptions[0] || '');

  // Get data for selected cafe
  const categories = selectedCafe ? 
    [{
      category: selectedCafe,
      items: (pricesData as PricesData)[selectedCafe]
    }] : [];

  // Filter categories and items based on search term
  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">لیست قیمت‌ها</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="جستجو در منو..."
              className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 w-72 text-sm font-light 
                        placeholder:text-gray-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* Cafe Selector */}
        <div className="relative bg-white rounded-2xl p-1 shadow-sm border border-gray-100">
          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                const newScrollLeft = scrollContainerRef.current.scrollLeft - 200;
                scrollContainerRef.current.scrollTo({
                  left: newScrollLeft,
                  behavior: 'smooth'
                });
              }
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center 
                     w-8 h-8 rounded-lg bg-white shadow-lg text-gray-600 hover:bg-gray-50 
                     transition-all duration-200 border border-gray-200"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div 
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto py-2 px-12 no-scrollbar scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="inline-flex gap-2 flex-nowrap">
              {cafeOptions.map((cafeName) => (
                <button
                  key={cafeName}
                  onClick={() => setSelectedCafe(cafeName)}
                  className={`
                    whitespace-nowrap px-6 py-3 rounded-xl transition-all duration-200 text-sm font-medium
                    ${selectedCafe === cafeName 
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }
                  `}
                  type="button"
                >
                  {cafeName}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (scrollContainerRef.current) {
                const newScrollLeft = scrollContainerRef.current.scrollLeft + 200;
                scrollContainerRef.current.scrollTo({
                  left: newScrollLeft,
                  behavior: 'smooth'
                });
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center 
                     w-8 h-8 rounded-lg bg-white shadow-lg text-gray-600 hover:bg-gray-50 
                     transition-all duration-200 border border-gray-200"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Price Table */}
        {categories.map((category) => (
          <Card key={category.category} className="overflow-hidden border border-gray-100 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">نام محصول</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">قیمت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {category.items
                    .filter(item => 
                      item.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-800">{item.name}</td>
                      <td className="px-6 py-4 text-left text-sm font-medium text-teal-600">{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}