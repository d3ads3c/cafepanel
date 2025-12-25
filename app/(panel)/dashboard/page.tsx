"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});
import type { ApexOptions } from "apexcharts";
import { useToast } from "@/lib/useToast";
import { userHasPermission } from "@/lib/userInfoParser";
import { normalizePlan } from "@/lib/plans";


type BuyItem = {
  bl_ID: number;
  bl_item: string;
  bl_info: string;
  bl_status: boolean;
};

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeCustomers: number;
  averageOrder: number;
  revenueSeries: number[]; // dynamic by selected range
  revenueCategories: string[]; // x-axis labels for chart
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    items: number;
    total: number;
    status: string;
    time: string;
  }>;
}
export default function Dashboard2() {
  const { success: showSuccess, error: showError } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0,
    averageOrder: 0,
    revenueSeries: [],
    revenueCategories: [],
    topProducts: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [canView, setCanView] = useState<boolean | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [displayName, setDisplayName] = useState<string>("کاربر");
  const [chartRange, setChartRange] = useState<"1m" | "3m" | "6m" | "1y">("1m");
  const [salesTarget, setSalesTarget] = useState<number>(0); // Default 10M تومان
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(0); // Monthly sales total
  const [salesTargetModalOpen, setSalesTargetModalOpen] = useState(false);
  const [salesTargetInput, setSalesTargetInput] = useState<string>("0");
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/auth/me", { method: "POST" });
      const data = await res.json();
      const userInfo = data?.Info;
      const name = userInfo?.Fname || "کاربر";
      setPlan(normalizePlan(userInfo.Plan));
      setDisplayName(name);
      const hasPermission = userHasPermission(data, "view_dashboard");
      setCanView(hasPermission);
      if (hasPermission) {
        fetchDashboardData();
        fetchSalesTarget();
      } else {
        setLoading(false);
      }
    };
    check();
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Force refresh on component mount
  useEffect(() => {
    if (!canView) return;
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 7000);
    return () => clearTimeout(timer);
  }, [canView, chartRange]);

  // Refresh data every 30 seconds
  useEffect(() => {
    if (!canView) return;
    const interval = setInterval(() => {
      fetchDashboardData();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [canView, chartRange]);

  // Refresh data when page becomes visible
  useEffect(() => {
    if (!canView) return;
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
        setLastRefresh(new Date());
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [canView]);

  const fetchDashboardData = async () => {
    try {
      if (!canView) return;
      setLoading(true);

      // Fetch all data in parallel
      const [ordersRes, customersRes, menuRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/customers"),
        fetch("/api/menu/all"),
      ]);

      const [ordersData, customersData, menuData] = await Promise.all([
        ordersRes.json(),
        customersRes.json(),
        menuRes.json(),
      ]);

      if (ordersData.success && customersData.success && menuData.success) {
        const orders = ordersData.data;
        const customers = customersData.data;
        const menuItems = menuData.data;

        // Calculate today's data
        const today = new Date();
        const todayString = today.toISOString().split("T")[0];
        const todayStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const todayEnd = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        );

        const todayOrders = orders.filter((order: any) => {
          if (!order.createdAt) return false;

          const orderDate = new Date(order.createdAt);
          const isToday = orderDate >= todayStart && orderDate < todayEnd;

          return isToday;
        });

        const todayRevenue = todayOrders.reduce((sum: number, order: any) => {
          const rawTotal = order.totalPrice || order.total_price || 0;
          const orderTotal =
            typeof rawTotal === "string"
              ? parseFloat(rawTotal)
              : Number(rawTotal);
          const validTotal = isNaN(orderTotal) ? 0 : orderTotal;
          return sum + validTotal;
        }, 0);

        // Calculate this month's revenue
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
          23,
          59,
          59
        );

        const monthlyOrders = orders.filter((order: any) => {
          if (!order.createdAt) return false;
          const orderDate = new Date(order.createdAt);
          return orderDate >= monthStart && orderDate <= monthEnd;
        });

        const thisMonthRevenue = monthlyOrders.reduce(
          (sum: number, order: any) => {
            const rawTotal = order.totalPrice || order.total_price || 0;
            const orderTotal =
              typeof rawTotal === "string"
                ? parseFloat(rawTotal)
                : Number(rawTotal);
            const validTotal = isNaN(orderTotal) ? 0 : orderTotal;
            return sum + validTotal;
          },
          0
        );

        // Update monthly revenue state
        setMonthlyRevenue(thisMonthRevenue);

        // Manual calculation test
        let manualSum = 0;
        todayOrders.forEach((order: any) => {
          const rawTotal = order.totalPrice || order.total_price || 0;
          const orderTotal =
            typeof rawTotal === "string"
              ? parseFloat(rawTotal)
              : Number(rawTotal);
          const validTotal = isNaN(orderTotal) ? 0 : orderTotal;
          manualSum += validTotal;
        });

        // Helper function to get local date string (YYYY-MM-DD) without timezone conversion
        const getLocalDateString = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        // Build dynamic revenue series for selected range
        const rangeDaysMap: Record<typeof chartRange, number> = {
          "1m": 30,
          "3m": 90,
          "6m": 180,
          "1y": 365,
        };
        const daysBack = rangeDaysMap[chartRange];
        const buckets: { [isoDate: string]: number } = {};
        const categories: string[] = [];
        for (let i = daysBack - 1; i >= 0; i--) {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - i);
          const dateKey = getLocalDateString(d);
          buckets[dateKey] = 0;
          // Persian short date label
          categories.push(
            d.toLocaleDateString("fa-IR", { month: "2-digit", day: "2-digit" })
          );
        }
        orders.forEach((order: any) => {
          if (!order.createdAt) return;
          const orderDate = new Date(order.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          const dateKey = getLocalDateString(orderDate);
          if (dateKey in buckets) {
            const rawTotal = order.totalPrice || order.total_price || 0;
            const num =
              typeof rawTotal === "string"
                ? parseFloat(rawTotal)
                : Number(rawTotal);
            if (!isNaN(num) && isFinite(num)) {
              buckets[dateKey] += num;
            }
          }
        });
        const revenueSeries = Object.values(buckets);

        // Calculate top products
        const productSales: {
          [key: string]: { count: number; revenue: number };
        } = {};
        orders.forEach((order: any) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              if (productSales[item.item_name]) {
                productSales[item.item_name].count += item.quantity;
                productSales[item.item_name].revenue +=
                  item.item_price * item.quantity;
              } else {
                productSales[item.item_name] = {
                  count: item.quantity,
                  revenue: item.item_price * item.quantity,
                };
              }
            });
          }
        });

        const topProducts = Object.entries(productSales)
          .map(([name, data]) => ({
            name,
            sales: data.count,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 4);

        // Get recent orders
        const recentOrders = orders.slice(0, 4).map((order: any) => ({
          id: `#${order.id}`,
          customer: order.customerName || "مشتری ناشناس",
          items: order.totalItems || 0,
          total: order.totalPrice || 0,
          status: getOrderStatusText(order.status),
          time: getTimeAgo(order.createdAt),
        }));

        // Ensure todayRevenue is never NaN
        const safeTodayRevenue = isNaN(todayRevenue) ? 0 : todayRevenue;

        setDashboardData({
          todayRevenue: safeTodayRevenue,
          todayOrders: todayOrders.length,
          activeCustomers: customers.length,
          averageOrder:
            todayOrders.length > 0 ? safeTodayRevenue / todayOrders.length : 0,
          revenueSeries,
          revenueCategories: categories,
          topProducts,
          recentOrders,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTarget = async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await fetch(
        `/api/sales-target?year=${year}&month=${month}`
      );
      const data = await response.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const target = data.data[0];
        setSalesTarget(target.target_amount);
        setSalesTargetInput(target.target_amount.toString());
      }
    } catch (error) {
      console.error("Error fetching sales target");
    }
  };

  const saveSalesTarget = async () => {
    try {
      const targetAmount = parseFloat(salesTargetInput);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        showError("لطفا عدد معتبر وارد کنید");
        return;
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await fetch("/api/sales-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          target_amount: targetAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSalesTarget(targetAmount);
        setSalesTargetModalOpen(false);
        showSuccess("تارگت فروش با موفقیت ذخیره شد");
      } else {
        showError("خطا در ذخیره تارگت");
      }
    } catch (error) {
      console.error("Error saving sales target");
      showError("خطا در ذخیره تارگت");
    }
  };

  // No early return to keep hooks order stable

  const getOrderStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "در انتظار",
      preparing: "در حال آماده‌سازی",
      ready: "آماده",
      completed: "تکمیل شده",
      cancelled: "لغو شده",
    };
    return statusMap[status] || status;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "همین الان";
    if (diffInMinutes < 60) return `${diffInMinutes} دقیقه پیش`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ساعت پیش`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} روز پیش`;
  };

  const formatPrice = (price: number) => {
    // Handle NaN and invalid numbers
    if (isNaN(price) || !isFinite(price)) {
      return "0";
    }

    // Round to remove decimal places and format with commas
    const roundedPrice = Math.round(price);
    return roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

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
      categories: [],
      labels: {
        style: {
          fontSize: "12px",
          fontFamily: "vazir, Tahoma, Arial, sans-serif",
        },
      },
    },
    yaxis: {
      labels: {
        show: false,
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
      data: dashboardData.revenueSeries,
    },
  ];

  // Pie chart options for order status
  const pieChartOptions: ApexOptions = {
    chart: {
      type: "pie",
      fontFamily: "vazir, Tahoma, Arial, sans-serif",
    },
    labels: ["تکمیل شده", "در حال آماده‌سازی", "در انتظار", "لغو شده"],
    colors: ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"],
    legend: {
      position: "bottom",
      fontFamily: "vazir, Tahoma, Arial, sans-serif",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: string) => `${val}%`,
      style: {
        fontSize: "12px",
        fontFamily: "vazir, Tahoma, Arial, sans-serif",
      },
    },
    tooltip: {
      theme: "light",
      style: {
        fontFamily: "vazir, Tahoma, Arial, sans-serif",
      },
    },
  };

  const pieChartSeries = [35, 25, 30, 10];

  // Donut chart options for sales target
  const donutChartOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "vazir, Tahoma, Arial, sans-serif",
      toolbar: { show: false },
      sparkline: { enabled: false },
    },
    colors: ["#14b8a6", "#e5e7eb"],
    labels: ["فروش انجام شده", "باقی مانده"],
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "12px",
              fontFamily: "vazir, Tahoma, Arial, sans-serif",
              color: "#666",
            },
            value: {
              show: true,
              fontSize: "16px",
              fontFamily: "vazir, Tahoma, Arial, sans-serif",
              color: "#333",
              formatter: (value: string) => {
                const numValue = parseInt(value);
                return formatPrice(numValue);
              },
            },
            total: {
              show: true,
              label: "تارگت",
              fontSize: "12px",
              fontFamily: "vazir, Tahoma, Arial, sans-serif",
              color: "#999",
              formatter: (value: any) => {
                return formatPrice(salesTarget);
              },
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: "bottom",
      fontFamily: "vazir, Tahoma, Arial, sans-serif",
      fontSize: "12px",
      labels: {
        colors: "#666",
      },
    },
    tooltip: {
      theme: "light",
      style: {
        fontFamily: "vazir, Tahoma, Arial, sans-serif",
      },
      y: {
        formatter: (value: number) => formatPrice(value),
      },
    },
  };

  const donutChartSeries = [
    Math.round(monthlyRevenue),
    Math.max(0, salesTarget - Math.round(monthlyRevenue)),
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
          showSuccess("خرید با موفقیت انجام شد");
        }
        fetchList();
      } else {
        console.error("Failed to update status", result);
      }
    } catch (error) {
      console.error("Network error");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteItem = async (id: number) => {
    await fetch(`/api/buylist/${id}`, { method: "DELETE" });
    fetchList();
  };
  return (
    <div className="w-full min-h-screen">
      {/* Header Hero Section */}
      <div className="xl:flex xl:gap-5 xl:mb-10">
        <div className="bg-gradient-to-r from-teal-800 to-teal-600 pt-24 xl:pt-0 xl:flex xl:items-center w-full xl:w-2/4 xl:rounded-[30px]">
          <div className="px-3 sm:px-6 lg:px-8 xl:px-10 pb-12 sm:pb-16 lg:pb-0 text-center md:text-right">
            <p className="text-teal-100 font-light mb-2 sm:mb-3 text-xs sm:text-sm lg:text-base">
              فروش امروز
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white font-bold">
              {formatPrice(dashboardData.todayRevenue)} تومان
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm mt-2 font-light">
              {dashboardData.todayOrders} سفارش - میانگین{" "}
              {formatPrice(dashboardData.averageOrder)} تومان
            </p>
          </div>
        </div>
        <div className="border border-gray-200 p-5 hidden xl:block w-full xl:w-1/4 xl:rounded-[30px] bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg xl:text-sm font-bold text-gray-800">
              لیست خرید
            </h3>
            {plan == "pro" ||
              (plan == "advance" && (
                <button
                  className="bg-teal-500 text-white w-8 h-8 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center hover:bg-teal-600 transition-colors"
                  onClick={() => setDialogOpen(true)}
                >
                  <i className="fi fi-rr-plus text-sm xl:text-base mt-1.5"></i>
                </button>
              ))}
          </div>
          {plan == "pro" ||
            (plan == "advance" ? (
              <div className="h-full max-h-[200px] overflow-auto hide-scroll space-y-3">
                {buylist.filter((item) => !item.bl_status).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fi fi-rr-shopping-cart text-4xl mb-3 text-gray-300"></i>
                    <p className="text-sm">لیست خرید خالی است</p>
                    <p className="text-xs text-gray-400 mt-1">
                      برای افزودن آیتم جدید روی دکمه + کلیک کنید
                    </p>
                  </div>
                ) : (
                  buylist
                    .filter((item) => !item.bl_status)
                    .map((item) => (
                      <div
                        key={item.bl_ID}
                        className="border border-gray-200 bg-white rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <label className="flex items-center cursor-pointer">
                              {updatingId === item.bl_ID ? (
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
                                      className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
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

                            <div className="flex-1">
                              <h3 className="text-sm xl:text-base font-medium text-gray-800">
                                {item.bl_item}
                              </h3>
                              {item.bl_info && (
                                <p className="text-xs xl:text-sm text-gray-500 mt-1">
                                  {item.bl_info}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            onClick={() => deleteItem(item.bl_ID)}
                          >
                            <i className="fi fi-sr-trash-xmark text-sm xl:text-base"></i>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div className="bg-teal-600 text-white p-5 w-full rounded-2xl text-center">
                <h2>ارتقای پلن</h2>
                <p className="text-xs font-light mt-1">
                  لیست خرید تنها در پلن حرفه ای و پیشرفته قابل استفاده است.
                </p>
                <div className="mt-6">
                  <Link
                    href={"/change-plan"}
                    className="bg-white text-teal-600 rounded-2xl py-3 px-7 text-xs w-full"
                  >
                    همین حالا ارتقا بده
                  </Link>
                </div>
              </div>
            ))}
        </div>
        <div className="border border-gray-200 p-5 hidden xl:block w-full xl:w-1/4 xl:rounded-[30px] bg-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg xl:text-sm font-bold text-gray-800">
              تارگت فروش
            </h3>
            <button
              className="bg-teal-500 text-white w-8 h-8 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center hover:bg-teal-600 transition-colors"
              title="تنظیم تارگت"
              onClick={() => setSalesTargetModalOpen(true)}
            >
              <i className="fi fi-rr-edit text-sm xl:text-base mt-1.5"></i>
            </button>
          </div>
          <div className="h-52">
            <ReactApexChart
              key={`donut-${monthlyRevenue}-${salesTarget}`}
              options={donutChartOptions}
              series={donutChartSeries}
              type="donut"
              height="100%"
            />
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">تارگت ماهانه:</span>
              <span className="font-semibold text-gray-900">
                {formatPrice(salesTarget)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">فروش این ماه:</span>
              <span className="font-semibold text-teal-600">
                {formatPrice(monthlyRevenue)} تومان
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-600">درصد دستیابی:</span>
              <span className="font-bold text-teal-700">
                {((monthlyRevenue / salesTarget) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content Container */}
      <div className="w-full">
        {/* Quick Access Section - Mobile rounded, Desktop normal */}
        <div className="bg-white rounded-t-3xl xl:rounded-3xl px-3 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10 -mt-6 xl:mt-0 xl:pt-8 xl:border-b border-gray-100">
          <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-6 sm:mb-8">
            دسترسی سریع
          </h2>

          {/* Quick Links Grid - Responsive */}
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 lg:gap-5">
            <div className="text-center group">
              <Link
                href={"/orders"}
                className="mx-auto bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 rounded-2xl size-12 sm:size-14 lg:size-16 text-blue-500 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-sm hover:shadow-md"
              >
                <i className="mt-1.5 fi fi-sr-concierge-bell"></i>
              </Link>
              <h3 className="text-xs sm:text-xs lg:text-sm mt-2 sm:mt-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                سفارشات
              </h3>
            </div>

            <div className="text-center group">
              <Link
                href={"/customers"}
                className="mx-auto bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 transition-all duration-200 rounded-2xl size-12 sm:size-14 lg:size-16 text-yellow-500 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-sm hover:shadow-md"
              >
                <i className="mt-1.5 fi fi-sr-users-alt"></i>
              </Link>
              <h3 className="text-xs sm:text-xs lg:text-sm mt-2 sm:mt-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                مشتریان
              </h3>
            </div>

            <div className="text-center group">
              <Link
                href={"/menu"}
                className="mx-auto bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all duration-200 rounded-2xl size-12 sm:size-14 lg:size-16 text-green-500 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-sm hover:shadow-md"
              >
                <i className="mt-1.5 fi fi-sr-scroll"></i>
              </Link>
              <h3 className="text-xs sm:text-xs lg:text-sm mt-2 sm:mt-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                منو
              </h3>
            </div>

            <div className="text-center group">
              <Link
                href={"/settings/categories"}
                className="mx-auto bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all duration-200 rounded-2xl size-12 sm:size-14 lg:size-16 text-red-500 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-sm hover:shadow-md"
              >
                <i className="mt-1.5 fi fi-sr-tags"></i>
              </Link>
              <h3 className="text-xs sm:text-xs lg:text-sm mt-2 sm:mt-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                دسته‌بندی
              </h3>
            </div>

            <div className="text-center group relative">
              <Link
                href={"/prices"}
                className="mx-auto bg-gradient-to-br from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 transition-all duration-200 rounded-2xl size-12 sm:size-14 lg:size-16 text-teal-500 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-sm hover:shadow-md"
              >
                <i className="mt-1.5 fi fi-sr-chart-mixed-up-circle-dollar"></i>
              </Link>
              <h3 className="text-xs sm:text-xs lg:text-sm mt-2 sm:mt-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                رقبا
              </h3>
              <div className="absolute text-[9px] sm:text-[10px] -top-1 -left-1 xl:left-8 bg-teal-100 text-teal-600 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                آزمایشی
              </div>
            </div>

            <div className="text-center group relative">
              <Link
                href={"/accounting/invoices"}
                className="mx-auto bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 rounded-2xl size-12 sm:size-14 lg:size-16 text-purple-500 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-sm hover:shadow-md"
              >
                <i className="mt-1.5 fi fi-sr-file-invoice-dollar"></i>
              </Link>
              <h3 className="text-xs sm:text-xs lg:text-sm mt-2 sm:mt-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                فاکتورها
              </h3>
              {/* <div className="absolute text-[9px] sm:text-[10px] -top-1 -left-1 xl:left-8 bg-purple-100 text-purple-600 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                به زودی
              </div> */}
            </div>

            <div className="text-center group relative">
              <Link
                href={"/accounting"}
                className="mx-auto bg-gradient-to-br from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 transition-all duration-200 rounded-2xl size-12 sm:size-14 lg:size-16 text-cyan-500 flex items-center justify-center text-xl sm:text-2xl lg:text-3xl shadow-sm hover:shadow-md"
              >
                <i className="mt-1.5 fi fi-sr-coins"></i>
              </Link>
              <h3 className="text-xs sm:text-xs lg:text-sm mt-2 sm:mt-3 font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                حسابداری
              </h3>
              {/* <div className="absolute text-[9px] sm:text-[10px] -top-1 -left-1 xl:left-8 bg-cyan-100 text-cyan-600 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">
                به زودی
              </div> */}
            </div>
          </div>
        </div>

        {/* Revenue Chart Section */}
        <div className=" px-3 sm:px-6 lg:px-8 xl:px-0 py-6 sm:py-8 lg:py-10 xl:mt-0">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="xl:col-span-2 bg-white h-fit rounded-2xl xl:rounded-3xl border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-4 sm:mb-0">
                    روند درآمد
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                      <span className="text-xs sm:text-sm text-gray-600">
                        درآمد
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full p-1">
                      <button
                        className={`px-2 sm:px-3 py-1.5 text-xs rounded-full transition-colors ${
                          chartRange === "1m"
                            ? "bg-teal-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setChartRange("1m")}
                      >
                        1 ماه
                      </button>
                      <button
                        className={`px-2 sm:px-3 py-1.5 text-xs rounded-full transition-colors ${
                          chartRange === "3m"
                            ? "bg-teal-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setChartRange("3m")}
                      >
                        3 ماه
                      </button>
                      <button
                        className={`px-2 sm:px-3 py-1.5 text-xs rounded-full transition-colors ${
                          chartRange === "6m"
                            ? "bg-teal-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setChartRange("6m")}
                      >
                        6 ماه
                      </button>
                      <button
                        className={`px-2 sm:px-3 py-1.5 text-xs rounded-full transition-colors ${
                          chartRange === "1y"
                            ? "bg-teal-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        onClick={() => setChartRange("1y")}
                      >
                        1 سال
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-64 sm:h-80 bg-gradient-to-b from-teal-50 to-transparent rounded-xl p-2 sm:p-4">
                  <ReactApexChart
                    options={{
                      ...areaChartOptions,
                      xaxis: {
                        ...areaChartOptions.xaxis,
                        categories: dashboardData.revenueCategories,
                      },
                    }}
                    series={areaChartSeries}
                    type="area"
                    height="100%"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="block space-y-5 xl:space-y-0 xl:flex flex-col gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-2xl xl:rounded-3xl border border-gray-100 p-6 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  پرفروش‌ترین محصولات
                </h3>
                <div className="space-y-4">
                  {dashboardData.topProducts.length > 0 ? (
                    dashboardData.topProducts.map((product, idx) => (
                      <div
                        key={idx}
                        className="pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 flex-1">
                            {product.name}
                          </h4>
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full ml-2">
                            {product.sales}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatPrice(product.revenue)} تومان
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">
                      محصولی فروخته نشده است
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl xl:rounded-3xl border border-gray-100 p-6 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  سفارشات اخیر
                </h3>
                <div className="space-y-3">
                  {dashboardData.recentOrders.length > 0 ? (
                    dashboardData.recentOrders.map((order, idx) => (
                      <div
                        key={idx}
                        className="pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {order.customer}
                          </span>
                          <span className="text-xs text-gray-500">
                            {order.time}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">
                            {order.items} محصول
                          </span>
                          <span className="text-xs font-semibold text-teal-600">
                            {formatPrice(order.total)} تومان
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">سفارش موجود نیست</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Dialog for new item */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                افزودن آیتم جدید
              </h3>
              <button
                onClick={() => {
                  setDialogOpen(false);
                  setForm({ bl_item: "", bl_info: "" });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fi fi-rr-cross text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام کالا
                </label>
                <input
                  type="text"
                  placeholder="نام کالا را وارد کنید"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={form.bl_item}
                  onChange={(e) =>
                    setForm({ ...form, bl_item: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  توضیحات (اختیاری)
                </label>
                <textarea
                  placeholder="توضیحات اضافی..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  value={form.bl_info}
                  onChange={(e) =>
                    setForm({ ...form, bl_info: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 text-sm text-gray-600 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setDialogOpen(false);
                  setForm({ bl_item: "", bl_info: "" });
                }}
              >
                انصراف
              </button>
              <button
                className="flex-1 bg-teal-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-teal-600 transition-colors"
                onClick={handleAdd}
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dialog for sales target */}
      {salesTargetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                تنظیم تارگت فروش ماهانه
              </h3>
              <button
                onClick={() => setSalesTargetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fi fi-rr-cross text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تارگت فروش ماهانه (تومان)
                </label>
                <input
                  type="number"
                  placeholder="مثال: 100000000"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={parseFloat(salesTargetInput).toFixed(0)}
                  onChange={(e) => setSalesTargetInput(e.target.value)}
                />
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800">
                <p className="font-medium mb-1">تارگت فعلی:</p>
                <p>{formatPrice(salesTarget)} تومان</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                className="flex-1 text-sm text-gray-600 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
                onClick={() => setSalesTargetModalOpen(false)}
              >
                انصراف
              </button>
              <button
                className="flex-1 bg-teal-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-teal-600 transition-colors"
                onClick={saveSalesTarget}
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
