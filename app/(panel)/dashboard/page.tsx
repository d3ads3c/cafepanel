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

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeCustomers: number;
  averageOrder: number;
  weeklyRevenue: number[];
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

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    todayRevenue: 0,
    todayOrders: 0,
    activeCustomers: 0,
    averageOrder: 0,
    weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
    topProducts: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Force refresh on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 1000); // Refresh after 1 second

    return () => clearTimeout(timer);
  }, []);

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
        setLastRefresh(new Date());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [ordersRes, customersRes, menuRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/menu/all')
      ]);

      const [ordersData, customersData, menuData] = await Promise.all([
        ordersRes.json(),
        customersRes.json(),
        menuRes.json()
      ]);

      if (ordersData.success && customersData.success && menuData.success) {
        const orders = ordersData.data;
        const customers = customersData.data;
        const menuItems = menuData.data;

        // Calculate today's data
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        console.log('Today date string:', todayString);
        console.log('Today start:', todayStart);
        console.log('Today end:', todayEnd);
        console.log('All orders:', orders);
        
        const todayOrders = orders.filter((order: any) => {
          if (!order.createdAt) return false;
          
          const orderDate = new Date(order.createdAt);
          const isToday = orderDate >= todayStart && orderDate < todayEnd;
          
          console.log('Order date:', order.createdAt, 'Parsed:', orderDate, 'Is today:', isToday);
          return isToday;
        });
        
        console.log('Today orders:', todayOrders);
        console.log('Today orders count:', todayOrders.length);
        
        // Debug each order's totalPrice
        todayOrders.forEach((order: any, index: number) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            totalPrice: order.totalPrice,
            total_price: order.total_price,
            createdAt: order.createdAt,
            allFields: Object.keys(order)
          });
        });
        
        const todayRevenue = todayOrders.reduce((sum: number, order: any) => {
          const rawTotal = order.totalPrice || order.total_price || 0;
          const orderTotal = typeof rawTotal === 'string' ? parseFloat(rawTotal) : Number(rawTotal);
          const validTotal = isNaN(orderTotal) ? 0 : orderTotal;
          
          console.log(`Order ${order.id}: rawTotal=${rawTotal}, orderTotal=${orderTotal}, validTotal=${validTotal}, sum=${sum}`);
          return sum + validTotal;
        }, 0);
        
        // Manual calculation test
        let manualSum = 0;
        todayOrders.forEach((order: any) => {
          const rawTotal = order.totalPrice || order.total_price || 0;
          const orderTotal = typeof rawTotal === 'string' ? parseFloat(rawTotal) : Number(rawTotal);
          const validTotal = isNaN(orderTotal) ? 0 : orderTotal;
          manualSum += validTotal;
        });
        
        console.log('Today revenue calculated:', todayRevenue);
        console.log('Manual sum verification:', manualSum);
        console.log('Are they equal?', todayRevenue === manualSum);

        // Calculate weekly revenue (last 7 days)
        const weeklyRevenue = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayOrders = orders.filter((order: any) => 
            order.createdAt && order.createdAt.startsWith(dateStr)
          );
          
          const dayRevenue = dayOrders.reduce((sum: number, order: any) => 
            sum + (order.totalPrice || 0), 0
          );
          
          weeklyRevenue.push(dayRevenue);
        }

        // Calculate top products
        const productSales: { [key: string]: { count: number, revenue: number } } = {};
        orders.forEach((order: any) => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              if (productSales[item.item_name]) {
                productSales[item.item_name].count += item.quantity;
                productSales[item.item_name].revenue += item.item_price * item.quantity;
              } else {
                productSales[item.item_name] = {
                  count: item.quantity,
                  revenue: item.item_price * item.quantity
                };
              }
            });
          }
        });

        const topProducts = Object.entries(productSales)
          .map(([name, data]) => ({
            name,
            sales: data.count,
            revenue: data.revenue
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 4);

        // Get recent orders
        const recentOrders = orders
          .slice(0, 4)
          .map((order: any) => ({
            id: `#${order.id}`,
            customer: order.customerName || 'مشتری ناشناس',
            items: order.totalItems || 0,
            total: order.totalPrice || 0,
            status: getOrderStatusText(order.status),
            time: getTimeAgo(order.createdAt)
          }));

        // Ensure todayRevenue is never NaN
        const safeTodayRevenue = isNaN(todayRevenue) ? 0 : todayRevenue;
        
        setDashboardData({
          todayRevenue: safeTodayRevenue,
          todayOrders: todayOrders.length,
          activeCustomers: customers.length,
          averageOrder: todayOrders.length > 0 ? safeTodayRevenue / todayOrders.length : 0,
          weeklyRevenue,
          topProducts,
          recentOrders
        });
        
        console.log('Dashboard data updated:', {
          todayRevenue: safeTodayRevenue,
          originalTodayRevenue: todayRevenue,
          todayOrders: todayOrders.length,
          activeCustomers: customers.length
        });
      } else {
        console.log('API calls failed:', { ordersData, customersData, menuData });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'در انتظار',
      'preparing': 'در حال آماده‌سازی',
      'ready': 'آماده',
      'completed': 'تکمیل شده',
      'cancelled': 'لغو شده'
    };
    return statusMap[status] || status;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'همین الان';
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
      data: dashboardData.weeklyRevenue,
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
    <div className="xl:mt-0 mt-20">
      <div className="xl:px-0 px-7 py-5 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-6 text-white">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="text-2xl xl:text-3xl font-bold mb-2">عصر بخیر، نیما! 👋</h1>
              <p className="text-teal-100 text-sm xl:text-base">امروز چطور می‌توانیم به شما کمک کنیم؟</p>
              <p className="text-teal-200 text-xs mt-2">
                آخرین به‌روزرسانی: {lastRefresh.toLocaleTimeString('fa-IR')}
              </p>
            </div>
            <div className="mt-4 xl:mt-0 flex items-center gap-4">
              <button
                onClick={() => {
                  fetchDashboardData();
                  setLastRefresh(new Date());
                }}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="به‌روزرسانی داده‌ها"
              >
                <i className="fi fi-rr-refresh text-white"></i>
              </button>
              <div className="text-right">
                <p className="text-teal-100 text-sm">امروز</p>
                <p className="text-2xl xl:text-3xl font-bold">
                  {new Date().toLocaleDateString('fa-IR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-6">
          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs xl:text-sm">درآمد امروز</p>
                <p className="text-lg xl:text-2xl font-bold text-gray-800 mt-1">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال بارگذاری...</span>
                    </div>
                  ) : (
                    formatPrice(dashboardData.todayRevenue)
                  )}
                </p>
                <p className="text-xs text-teal-500 mt-1">
                  تومان • {dashboardData.todayOrders} سفارش
                </p>
              </div>
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-teal-100 rounded-xl flex items-center justify-center">
                <i className="fi fi-rr-money text-teal-600 text-xl xl:text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs xl:text-sm">سفارشات امروز</p>
                <p className="text-lg xl:text-2xl font-bold text-gray-800 mt-1">
                  {loading ? '...' : dashboardData.todayOrders}
                </p>
                <p className="text-xs text-green-500 mt-1">سفارش</p>
              </div>
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <i className="fi fi-rr-shopping-cart text-blue-600 text-xl xl:text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs xl:text-sm">مشتریان فعال</p>
                <p className="text-lg xl:text-2xl font-bold text-gray-800 mt-1">
                  {loading ? '...' : dashboardData.activeCustomers}
                </p>
                <p className="text-xs text-purple-500 mt-1">مشتری</p>
              </div>
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <i className="fi fi-rr-users text-purple-600 text-xl xl:text-2xl"></i>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs xl:text-sm">میانگین سفارش</p>
                <p className="text-lg xl:text-2xl font-bold text-gray-800 mt-1">
                  {loading ? '...' : formatPrice(Math.round(dashboardData.averageOrder))}
                </p>
                <p className="text-xs text-orange-500 mt-1">تومان</p>
              </div>
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                <i className="fi fi-rr-chart-line text-orange-600 text-xl xl:text-2xl"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
          <h3 className="text-lg xl:text-xl font-bold text-gray-800 mb-4">دسترسی سریع</h3>
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <Link href="/orders" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                <i className="fi fi-rr-rectangle-list text-teal-600 text-xl xl:text-2xl"></i>
              </div>
              <span className="text-sm xl:text-base font-medium text-gray-700">سفارشات</span>
            </Link>
            
            <Link href="/customers" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                <i className="fi fi-rr-users text-orange-600 text-xl xl:text-2xl"></i>
              </div>
              <span className="text-sm xl:text-base font-medium text-gray-700">مشتریان</span>
            </Link>
            
            <Link href="/menu" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <i className="fi fi-rr-boxes text-blue-600 text-xl xl:text-2xl"></i>
              </div>
              <span className="text-sm xl:text-base font-medium text-gray-700">منو</span>
            </Link>
            
            <Link href="/box" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <i className="fi fi-bs-cash-register text-green-600 text-xl xl:text-2xl"></i>
              </div>
              <span className="text-sm xl:text-base font-medium text-gray-700">صندوق ها</span>
            </Link>
            
            <Link href="/settings" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 xl:w-14 xl:h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                <i className="fi fi-rr-settings text-purple-600 text-xl xl:text-2xl"></i>
              </div>
              <span className="text-sm xl:text-base font-medium text-gray-700">تنظیمات</span>
            </Link>
          </div>
        </div>

        {/* Charts and Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg xl:text-xl font-bold text-gray-800">درآمد هفتگی</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                <span className="text-sm text-gray-600">درآمد</span>
            </div>
          </div>
            <div className="h-64">
            <ReactApexChart
              options={areaChartOptions}
              series={areaChartSeries}
              type="area"
                height="100%"
              />
            </div>
          </div>

          {/* Order Status Chart */}
          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
            <h3 className="text-lg xl:text-xl font-bold text-gray-800 mb-4">وضعیت سفارشات</h3>
            <div className="h-64">
              <ReactApexChart
                options={pieChartOptions}
                series={pieChartSeries}
                type="pie"
                height="100%"
            />
          </div>
        </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
          <h3 className="text-lg xl:text-xl font-bold text-gray-800 mb-4">محصولات پرفروش</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
          ) : dashboardData.topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fi fi-rr-boxes text-4xl mb-3 text-gray-300"></i>
              <p className="text-sm">هیچ فروشی ثبت نشده است</p>
              <p className="text-xs text-gray-400 mt-1">سفارشات شما در اینجا نمایش داده می‌شود</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {dashboardData.topProducts.map((product, index) => {
                const colors = ["teal", "blue", "green", "purple"];
                const color = colors[index % colors.length];
                return (
                  <div key={index} className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                        <span className={`text-${color}-600 font-bold text-sm`}>{index + 1}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">فروش</p>
                        <p className="font-bold text-gray-800">{product.sales}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 mb-1">{product.name}</p>
                      <p className="text-sm text-gray-600">{formatPrice(product.revenue)} تومان</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders and Activity Feed */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg xl:text-xl font-bold text-gray-800">سفارشات اخیر</h3>
              <Link href="/orders" className="text-teal-600 text-sm hover:text-teal-700">مشاهده همه</Link>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">در حال بارگذاری...</div>
              </div>
            ) : dashboardData.recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fi fi-rr-shopping-cart text-4xl mb-3 text-gray-300"></i>
                <p className="text-sm">هیچ سفارشی ثبت نشده است</p>
                <p className="text-xs text-gray-400 mt-1">سفارشات جدید در اینجا نمایش داده می‌شود</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.recentOrders.map((order, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <i className="fi fi-rr-shopping-cart text-teal-600"></i>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{order.id}</p>
                        <p className="text-sm text-gray-500">{order.customer}</p>
                      </div>
              </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">{formatPrice(order.total)} تومان</p>
                      <p className="text-xs text-gray-500">{order.time}</p>
              </div>
            </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
            <h3 className="text-lg xl:text-xl font-bold text-gray-800 mb-4">فعالیت‌های اخیر</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">در حال بارگذاری...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentOrders.length > 0 ? (
                  dashboardData.recentOrders.slice(0, 4).map((order, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="fi fi-rr-shopping-cart text-teal-600 text-sm"></i>
              </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">سفارش جدید</p>
                        <p className="text-sm text-gray-600">{order.id} از {order.customer}</p>
                        <p className="text-xs text-gray-500 mt-1">{order.time}</p>
              </div>
            </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fi fi-rr-activity text-4xl mb-3 text-gray-300"></i>
                    <p className="text-sm">هیچ فعالیتی ثبت نشده است</p>
                    <p className="text-xs text-gray-400 mt-1">فعالیت‌های جدید در اینجا نمایش داده می‌شود</p>
                  </div>
                )}
              </div>
            )}
              </div>
        </div>
        {/* Buy List */}
        <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg xl:text-xl font-bold text-gray-800">لیست خرید</h3>
              <button
              className="bg-teal-500 text-white w-8 h-8 xl:w-10 xl:h-10 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors"
                onClick={() => setDialogOpen(true)}
              >
              <i className="fi fi-rr-plus text-sm xl:text-base"></i>
              </button>
            </div>

          <div className="space-y-3">
            {buylist.filter((item) => !item.bl_status).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fi fi-rr-shopping-cart text-4xl mb-3 text-gray-300"></i>
                <p className="text-sm">لیست خرید خالی است</p>
                <p className="text-xs text-gray-400 mt-1">برای افزودن آیتم جدید روی دکمه + کلیک کنید</p>
              </div>
            ) : (
              buylist
                .filter((item) => !item.bl_status)
                .map((item) => (
                  <div key={item.bl_ID} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
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
              onChange={(e) => setForm({ ...form, bl_item: e.target.value })}
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
              onChange={(e) => setForm({ ...form, bl_info: e.target.value })}
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
      <Toaster position="top-center" />
    </div>
  );
}
