"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
// Dynamically import ReactApexChart to disable SSR
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import type { ApexOptions } from "apexcharts";

type BuyItem = {
  bl_ID: number;
  bl_item: string;
  bl_info: string;
  bl_status: boolean;
};

export default function DashboardPage() {
  const areaChartOptions: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      sparkline: { enabled: true },
      fontFamily: "vazir, Tahoma, Arial, sans-serif",
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 0.7,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    colors: ["#14b8a6"],
    xaxis: {
      categories: [
        "شنبه",
        "یکشنبه",
        "دوشنبه",
        "سه‌شنبه",
        "چهارشنبه",
        "پنجشنبه",
        "جمعه",
      ],
      labels: {
        style: {
          fontSize: "12px",
          fontFamily: "vazir, Tahoma, Arial, sans-serif",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          fontFamily: "vazir, Tahoma, Arial, sans-serif",
        },
        formatter: (value: number) => value.toLocaleString(),
      },
    },
    tooltip: {
      theme: "light",
      style: {
        fontFamily: "vazir, Tahoma, Arial, sans-serif",
      },
      y: {
        formatter: (value: number) => value.toLocaleString(),
      },
    },
  };

  const areaChartSeries = [
    {
      name: "درآمد",
      data: [12000, 18000, 15000, 22000, 17000, 25000, 20000],
    },
  ];
  // Wishlist state

  const [buylist, setBuylist] = useState<BuyItem[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ bl_item: "", bl_info: "" });
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    const res = await fetch("/api/buylist");
    const data = await res.json();
    if (data.success) {
      const normalized = data.data.map((item: any) => ({
        ...item,
        bl_status: item.bl_status === "true",
      }));
      setBuylist(normalized);
    }
  };

  const handleAdd = async () => {
    if (!form.bl_item.trim()) return;

    const res = await fetch("/api/buylist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await res.json();
    if (result.success) {
      setDialogOpen(false);
      setForm({ bl_item: "", bl_info: "" });
      fetchList();
    }
  };

  const toggleItemStatus = async (id: number, status: boolean) => {
    setUpdatingId(id);

    try {
      const res = await fetch(`/api/buylist/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bl_status: status ? "true" : "false" }),
      });

      const result = await res.json();

      if (result.success) {
        if (status === true) {
          toast.success("خرید با موفقیت انجام شد");
        }
        fetchList();
      } else {
        console.error("Failed to update status", result);
      }
    } catch (error) {
      console.error("Network error", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteItem = async (id: number) => {
    await fetch(`/api/buylist/${id}`, { method: "DELETE" });
    fetchList();
  };

  return (
    <div className="mt-20">
      <div className="px-7 py-5">
        <div className="bg-white rounded-3xl pt-7 shadow-box">
          {/* <div className="text-sm text-gray-500 flex items-center gap-1 px-5">
            <p>تمامی صندوق ها</p>
            <i className="fi fi-rr-angle-small-down mt-1.5 text-xl"></i>
          </div> */}
          <div className="text-center px-5">
            <h2 className="text-4xl text-teal-400 font-bold">
              29.000.000
              <span className="mr-1 text-xs text-gray-400 font-light">
                تومان
              </span>
            </h2>
            <div className="mt-3">
              <p className="text-xs text-gray-500">درآمد امروز</p>
            </div>
          </div>
          {/* Area Chart */}
          <div className="pl-1">
            <ReactApexChart
              options={areaChartOptions}
              series={areaChartSeries}
              type="area"
              height={120}
            />
          </div>
        </div>
        <div className="my-10">
          {/* <div className="flex items-center gap-3">
            <div className="min-w-[70px] space-y-2">
              <div className="bg-white shadow-box size-16 rounded-xl flex items-center justify-center text-2xl text-teal-400 mx-auto">
                <i className="fi fi-br-warehouse-alt mt-3"></i>
              </div>
              <div className="text-center text-xs font-light text-gray-700">
                <p>انبارداری</p>
              </div>
            </div>
            <div className="min-w-[70px] space-y-2">
              <div className="bg-white shadow-box size-16 rounded-xl flex items-center justify-center text-2xl text-teal-400 mx-auto">
                <i className="fi fi-br-shopping-cart-add mt-3"></i>
              </div>
              <div className="text-center text-xs font-light text-gray-700">
                <p>خرید</p>
              </div>
            </div>
            <Link href={"/box"} className="min-w-[70px] space-y-2">
              <div className="bg-white shadow-box size-16 rounded-xl flex items-center justify-center text-2xl text-teal-400 mx-auto">
                <i className="fi fi-bs-cash-register mt-3"></i>
              </div>
              <div className="text-center text-xs font-light text-gray-700">
                <p>صندوق ها</p>
              </div>
            </Link>
          </div> */}
        </div>
        {/* Buy List */}
        {/* لیست خرید */}
        <div className="my-5">
          <div className="border rounded-3xl p-5 border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm">لیست خرید</h2>
              <button
                className="text-teal-400 text-xl"
                onClick={() => setDialogOpen(true)}
              >
                +
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {buylist
                .filter((item) => !item.bl_status)
                .map((item) => (
                  <div key={item.bl_ID} className="shadow-box p-4 rounded-2xl">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="w-4/5 flex items-center gap-2">
                        <label className="flex items-center cursor-pointer">
                          {updatingId === item.bl_ID ? (
                            // Loading spinner
                            <span className="w-6 h-6 flex items-center justify-center">
                              <svg
                                className="animate-spin h-5 w-5 text-teal-400"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8v8H4z"
                                ></path>
                              </svg>
                            </span>
                          ) : (
                            <>
                              <input
                                type="checkbox"
                                checked={item.bl_status}
                                onChange={() =>
                                  toggleItemStatus(
                                    item.bl_ID,
                                    item.bl_status !== true
                                  )
                                }
                                className="peer sr-only"
                              />
                              <span className="w-6 h-6 rounded-lg border border-gray-300 flex items-center justify-center bg-white peer-checked:bg-teal-400 peer-checked:border-teal-400 transition-colors">
                                <svg
                                  className="w-4 h-4 text-white opacity-100 transition-opacity"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </span>
                            </>
                          )}
                        </label>

                        <h3
                          className={`text-sm font-light ${
                            item.bl_status ? "line-through text-gray-400" : ""
                          }`}
                        >
                          {item.bl_item}
                        </h3>
                      </div>
                      <div className="w-1/5 flex items-center justify-end">
                        <button
                          className="text-red-500"
                          onClick={() => deleteItem(item.bl_ID)}
                        >
                          <i className="fi fi-sr-trash-xmark"></i>
                        </button>
                      </div>
                    </div>
                    {item.bl_info && (
                      <div className="p-2">
                        <p className="text-gray-400 text-justify text-sm">
                          {item.bl_info}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dialog for new item */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-11/12 md:w-1/3 p-5 space-y-4">
            <h3 className="text-lg font-bold text-center text-gray-700">
              افزودن آیتم جدید
            </h3>
            <input
              type="text"
              placeholder="نام کالا"
              className="w-full border rounded-xl px-3 py-2 text-sm"
              value={form.bl_item}
              onChange={(e) => setForm({ ...form, bl_item: e.target.value })}
            />
            <textarea
              placeholder="توضیحات (اختیاری)"
              className="w-full border rounded-xl px-3 py-2 text-sm"
              value={form.bl_info}
              onChange={(e) => setForm({ ...form, bl_info: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <button
                className="text-sm text-gray-500"
                onClick={() => {
                  setDialogOpen(false);
                  setForm({ bl_item: "", bl_info: "" });
                }}
              >
                انصراف
              </button>
              <button
                className="bg-teal-400 text-white px-4 py-2 rounded-xl text-sm"
                onClick={handleAdd}
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-center" />
    </div>
  );
}
