"use client";
import { useEffect, useState } from "react";

export default function OrdersIntegrationPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<string>("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/orders-integration");
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.data);
      } else {
        console.error("Error fetching orders:", data.message);
        setMigrationStatus(`خطا در دریافت سفارشات: ${data.message}`);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setMigrationStatus(
        `خطا در اتصال: ${
          error instanceof Error ? error.message : "خطای نامشخص"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMigrationStatus("جداول حسابداری با موفقیت ایجاد شدند");
        fetchOrders();
      } else {
        setMigrationStatus(`خطا در ایجاد جداول: ${data.message}`);
      }
    } catch (error) {
      console.error("Migration error:", error);
      setMigrationStatus(
        `خطا در migration: ${
          error instanceof Error ? error.message : "خطای نامشخص"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map((order) => order.id));
    }
  };

  const createAccountingEntries = async () => {
    if (selectedOrders.length === 0) return;

    setLoading(true);
    try {
      const promises = selectedOrders.map((orderId) => {
        const order = orders.find((o) => o.id === orderId);
        return fetch("/api/accounting/orders-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            orderData: {
              customerName: order.customerName,
              totalPrice: order.totalPrice,
              paymentMethod: order.paymentMethod,
              createdAt: order.createdAt,
            },
          }),
        });
      });

      const results = await Promise.all(promises);
      const successCount = results.filter((res) => res.ok).length;

      if (successCount === selectedOrders.length) {
        alert(`سند حسابداری برای ${successCount} سفارش با موفقیت ایجاد شد`);
        setSelectedOrders([]);
        fetchOrders();
      } else {
        alert(
          `سند حسابداری برای ${successCount} از ${selectedOrders.length} سفارش ایجاد شد`
        );
      }
    } catch (error) {
      console.error("Error creating accounting entries:", error);
      alert("خطا در ایجاد سند حسابداری");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fa-IR").format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              ادغام سفارشات با حسابداری
            </h2>
            <p className="text-gray-600 mt-1">
              ایجاد سند حسابداری برای سفارشات تکمیل شده
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runMigration}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              {loading ? "در حال ایجاد جداول..." : "ایجاد جداول حسابداری"}
            </button>
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {loading ? "در حال بارگذاری..." : "بروزرسانی"}
            </button>
            {selectedOrders.length > 0 && (
              <button
                onClick={createAccountingEntries}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
              >
                ایجاد سند حسابداری ({selectedOrders.length})
              </button>
            )}
          </div>
        </div>

        {migrationStatus && (
          <div
            className={`p-4 rounded-xl mb-4 ${
              migrationStatus.includes("موفقیت")
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <p className="text-sm">{migrationStatus}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fi fi-rr-check text-2xl text-gray-400"></i>
            </div>
            <p className="text-gray-500 text-lg">
              همه سفارشات با حسابداری ادغام شده‌اند
            </p>
            <p className="text-gray-400 text-sm mt-1">
              سفارشات جدید پس از تکمیل در اینجا نمایش داده می‌شوند
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.length === orders.length &&
                      orders.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">انتخاب همه</span>
                </label>
                <span className="text-sm text-gray-500">
                  {selectedOrders.length} از {orders.length} سفارش انتخاب شده
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`border rounded-xl p-4 transition-colors cursor-pointer ${
                    selectedOrders.includes(order.id)
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleSelectOrder(order.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          سفارش #{order.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.customerName || "مشتری ناشناس"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {formatPrice(order.totalPrice)} تومان
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.paymentMethod || "نقدی"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">میز:</span>
                      <span className="mr-2">{order.tableNumber || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">تاریخ:</span>
                      <span className="mr-2">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">اقلام سفارش:</p>
                      <div className="space-y-1">
                        {order.items
                          .slice(0, 3)
                          .map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-700">
                                {item.item_name}
                              </span>
                              <span className="text-gray-500">
                                {item.quantity}x
                              </span>
                            </div>
                          ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-400">
                            و {order.items.length - 3} مورد دیگر...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
