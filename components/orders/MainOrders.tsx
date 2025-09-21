"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function MainOrders() {
  // Payment method modal state (must be inside component)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number|null>(null);
  const [paymentMethodToSet, setPaymentMethodToSet] = useState<'کارت به کارت'|'پوز'|'نقدی'|''>('');
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<string>("");
  const [orderItems, setOrderItems] = useState<
    Array<{
      id: number;
      name: string;
      price: string;
      quantity: number;
      image: string;
    }>
  >([]);

  const [orders, setOrders] = useState<
    Array<{
      id: number;
      customerName: string;
      tableNumber: string;
      totalItems: number;
      totalPrice: number;
      status: string;
      createdAt: string;
      items: Array<{
        order_item_ID: number;
        menu_ID: number;
        item_name: string;
        item_price: number;
        quantity: number;
      }>;
    }>
  >([]);

  const [items, setItems] = useState<
    Array<{
      id: number;
      name: string;
      price: string;
      categoryId: string;
      image: string;
    }>
  >([]);
  const [itemQuantities, setItemQuantities] = useState<{
    [key: number]: number;
  }>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderModalSearchTerm, setOrderModalSearchTerm] = useState<string>("");
  const [newItemsToAdd, setNewItemsToAdd] = useState<{[key: number]: number}>({});
  const [tables, setTables] = useState<Array<{
    id: number;
    table_number: string;
    capacity: number;
    location: string;
    description: string;
    status: string;
  }>>([]);
  const [customers, setCustomers] = useState<Array<{
    id: number;
    name: string;
    phone: string;
    email: string;
  }>>([]);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");

  useEffect(() => {
    fetchCategories();
    fetchItems();
    fetchOrders();
    fetchTables();
    fetchCustomers();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    if (data.success) {
      setCategories(data.data);
      console.log(data.data);
    }
  };

  const fetchItems = async () => {
    const res = await fetch("/api/menu/all");
    const data = await res.json();
    if (data.success) {
      setItems(data.data);
      console.log(data.data);
    }
  };

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    if (data.success) {
      setOrders(data.data);
      console.log("Orders:", data.data);
    }
  };

  const fetchTables = async () => {
    const res = await fetch("/api/tables");
    const data = await res.json();
    if (data.success) {
      setTables(data.data);
      console.log("Tables:", data.data);
    }
  };

  const fetchCustomers = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    if (data.success) {
      setCustomers(data.data);
      console.log("Customers:", data.data);
    }
  };

  const addItem = (itemId: number) => {
    const item = items.find((item) => item.id === itemId);
    if (!item) return;

    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));

    setOrderItems((prev) => {
      const existingItem = prev.find((orderItem) => orderItem.id === itemId);
      if (existingItem) {
        return prev.map((orderItem) =>
          orderItem.id === itemId
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        return [
          ...prev,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            image: item.image,
          },
        ];
      }
    });
  };

  const increaseQuantity = (itemId: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));

    setOrderItems((prev) =>
      prev.map((orderItem) =>
        orderItem.id === itemId
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      )
    );
  };

  const decreaseQuantity = (itemId: number) => {
    setItemQuantities((prev) => {
      const currentQuantity = prev[itemId] || 0;
      if (currentQuantity <= 1) {
        const newQuantities = { ...prev };
        delete newQuantities[itemId];
        return newQuantities;
      }
      return {
        ...prev,
        [itemId]: currentQuantity - 1,
      };
    });

    setOrderItems((prev) => {
      const existingItem = prev.find((orderItem) => orderItem.id === itemId);
      if (!existingItem) return prev;

      if (existingItem.quantity <= 1) {
        return prev.filter((orderItem) => orderItem.id !== itemId);
      } else {
        return prev.map((orderItem) =>
          orderItem.id === itemId
            ? { ...orderItem, quantity: orderItem.quantity - 1 }
            : orderItem
        );
      }
    });
  };

  const getItemQuantity = (itemId: number) => {
    return itemQuantities[itemId] || 0;
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    // Round to remove decimal places and format with commas
    const roundedPrice = Math.round(numPrice);
    return roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setIsOrderModalOpen(false);
    setOrderModalSearchTerm("");
    setNewItemsToAdd({});
  };

  const addItemToOrder = (itemId: number) => {
    if (!selectedOrder) return;

    const item = items.find((item) => item.id === itemId);
    if (!item) return;

    const itemPrice = parseFloat(item.price);

    setSelectedOrder((prev: any) => {
      const existingItem = prev.items.find(
        (orderItem: any) => orderItem.menu_ID === itemId
      );
      let newItems;

      if (existingItem) {
        newItems = prev.items.map((orderItem: any) =>
          orderItem.menu_ID === itemId
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        newItems = [
          ...prev.items,
          {
            order_item_ID: Date.now(), // Temporary ID
            menu_ID: item.id,
            item_name: item.name,
            item_price: itemPrice,
            quantity: 1,
          },
        ];
      }

      // Recalculate totals from items
      const totalItems = newItems.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );
      const totalPrice = newItems.reduce(
        (sum: number, item: any) => sum + item.item_price * item.quantity,
        0
      );

      return {
        ...prev,
        items: newItems,
        totalItems,
        totalPrice,
      };
    });
  };

  const removeItemFromOrder = (itemId: number) => {
    if (!selectedOrder) return;

    setSelectedOrder((prev: any) => {
      const existingItem = prev.items.find(
        (orderItem: any) => orderItem.menu_ID === itemId
      );
      if (!existingItem) return prev;

      let newItems;

      if (existingItem.quantity <= 1) {
        newItems = prev.items.filter(
          (orderItem: any) => orderItem.menu_ID !== itemId
        );
      } else {
        newItems = prev.items.map((orderItem: any) =>
          orderItem.menu_ID === itemId
            ? { ...orderItem, quantity: orderItem.quantity - 1 }
            : orderItem
        );
      }

      // Recalculate totals from items
      const totalItems = newItems.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );
      const totalPrice = newItems.reduce(
        (sum: number, item: any) => sum + item.item_price * item.quantity,
        0
      );

      return {
        ...prev,
        items: newItems,
        totalItems,
        totalPrice,
      };
    });
  };

  const applyOrderChanges = async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedOrder.status,
          items: selectedOrder.items,
          totalItems: selectedOrder.totalItems,
          totalPrice: selectedOrder.totalPrice,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("تغییرات با موفقیت اعمال شد");
        closeOrderModal();
        fetchOrders(); // Refresh orders list
      } else {
        toast.error(data.message || "خطا در اعمال تغییرات");
      }
    } catch (error) {
      console.error("Error applying changes:", error);
      toast.error("خطا در اعمال تغییرات");
    }
  };

  const cancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("سفارش لغو شد");
        closeOrderModal();
        fetchOrders(); // Refresh orders list
      } else {
        toast.error(data.message || "خطا در لغو سفارش");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("خطا در لغو سفارش");
    }
  };

  const changeOrderStatus = async (orderId: number, currentStatus: string) => {
    let newStatus: string;
    switch (currentStatus) {
      case "pending":
        newStatus = "ready";
        break;
      case "ready":
        // Show payment modal before completing
        setPendingOrderId(orderId);
        setIsPaymentModalOpen(true);
        return;
      case "completed":
        // Delete the order
        try {
          const res = await fetch(`/api/orders/${orderId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            toast.success("سفارش حذف شد");
            fetchOrders();
          } else {
            toast.error(data.message || "خطا در حذف سفارش");
          }
        } catch (error) {
          console.error("Error deleting order:", error);
          toast.error("خطا در حذف سفارش");
        }
        return;
      default:
        return;
    }
    // For ready and others (not completed)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        const statusText = newStatus === "ready" ? "آماده" : "تکمیل شده";
        toast.success(`وضعیت سفارش به ${statusText} تغییر یافت`);
        fetchOrders();
      } else {
        toast.error(data.message || "خطا در تغییر وضعیت سفارش");
      }
    } catch (error) {
      console.error("Error changing order status:", error);
      toast.error("خطا در تغییر وضعیت سفارش");
    }
  };

  // Complete order with payment method
  const handleCompleteOrderWithPayment = async () => {
    if (!pendingOrderId || !paymentMethodToSet) return;
    try {
      const res = await fetch(`/api/orders/${pendingOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed", paymentMethod: paymentMethodToSet }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("وضعیت سفارش به تکمیل شده تغییر یافت");
        setIsPaymentModalOpen(false);
        setPendingOrderId(null);
        setPaymentMethodToSet("");
        fetchOrders();
      } else {
        toast.error(data.message || "خطا در تغییر وضعیت سفارش");
      }
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("خطا در تغییر وضعیت سفارش");
    }
  };


  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      toast.error("لطفا حداقل یک آیتم انتخاب کنید");
      return;
    }

    const orderData = {
      customerName,
      tableNumber,
      items: orderItems,
      totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: orderItems.reduce(
        (sum, item) => sum + parseInt(item.price) * item.quantity,
        0
      ),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("سفارش با موفقیت ثبت شد");
        // Clear the form
        setCustomerName("");
        setTableNumber("");
        setOrderItems([]);
        setItemQuantities({});
        setSelectedCustomer(null); // Deselect customer
        setSelectedTable(null); // Deselect table
        // Close modal
        setIsModalOpen(false);
        // Refresh orders list
        fetchOrders();
      } else {
        toast.error(data.message || "خطا در ثبت سفارش");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("خطا در ثبت سفارش");
    }
  };

  const filteredItems = searchTerm
    ? items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : selectedCategoryId
    ? items.filter((item) => item.categoryId === selectedCategoryId.toString())
    : items;
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Calculate order statistics using the same logic as dashboard
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  const todayOrders = orders.filter(o => {
    if (!o.createdAt) return false;
    const orderDate = new Date(o.createdAt);
    return orderDate >= todayStart && orderDate < todayEnd;
  });

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    completed: orders.filter(o => o.status === "completed").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    todayRevenue: todayOrders.reduce((sum, o) => {
      const rawTotal = o.totalPrice || 0;
      const orderTotal = typeof rawTotal === 'string' ? parseFloat(rawTotal) : Number(rawTotal);
      const validTotal = isNaN(orderTotal) ? 0 : orderTotal;
      return sum + validTotal;
    }, 0)
  };

  // Filter orders based on status, date, and search
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesSearch = searchQuery === "" || 
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery) ||
      order.tableNumber?.includes(searchQuery);
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case "today":
          matchesDate = orderDate.toDateString() === today.toDateString();
          break;
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= monthAgo;
          break;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-orange-100 text-orange-600 border-orange-200";
      case "preparing": return "bg-blue-100 text-blue-600 border-blue-200";
      case "ready": return "bg-green-100 text-green-600 border-green-200";
      case "completed": return "bg-gray-100 text-gray-600 border-gray-200";
      case "cancelled": return "bg-red-100 text-red-600 border-red-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "در انتظار";
      case "preparing": return "در حال آماده‌سازی";
      case "ready": return "آماده";
      case "completed": return "تکمیل شده";
      case "cancelled": return "لغو شده";
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Print receipt for selected order
  const handlePrintReceipt = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank', 'width=1000,height=600');
    if (!printWindow) return;

    // Calculate subtotal, discount, and create item details
    let subtotal = 0;
    let totalDiscount = 0;
    let totalNotes = 0;
    // If you have payment method or discount in order, use them, else fallback
  const paymentMethod = selectedOrder.paymentMethod || 'نقدی';
  const orderDiscount = selectedOrder.discount || 0;
  const orderNotes = selectedOrder.notes || '';
  // Hide customer/table if customer is 'مشتری ناشناس'
  const showCustomer = selectedOrder.customerName && selectedOrder.customerName !== 'مشتری ناشناس';
  const showTable = showCustomer && selectedOrder.tableNumber;

    interface ItemDetail {
      name: string;
      quantity: number;
      unitPrice: number;
      total: number;
      note?: string;
      discount?: number;
    }
    const itemDetails = selectedOrder.items.map((item: {
      item_name: string;
      item_price: number | string;
      quantity: number;
      note?: string;
      discount?: number;
    }): ItemDetail => {
      const itemTotal = Number(item.item_price) * item.quantity;
      subtotal += itemTotal;
      if (item.discount) totalDiscount += item.discount * item.quantity;
      if (item.note) totalNotes++;
      return {
        name: item.item_name,
        quantity: item.quantity,
        unitPrice: Number(item.item_price),
        total: itemTotal,
        note: item.note,
        discount: item.discount,
      };
    });

    const receiptHtml = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>رسید سفارش #${selectedOrder.id}</title>
          <style>
            @media print {
              @page {
                margin: 0;
                width: 80mm;
              }
              body {
                width: 74mm;
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              font-family: Tahoma, Arial, sans-serif;
              direction: rtl;
              padding: 3mm;
              margin: 0;
              font-size: 11px;
              line-height: 1.5;
              background: #f6f6f6;
            }
            .header {
              text-align: center;
              margin-bottom: 3mm;
            }
            .logo {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 2mm;
              color: #008080;
              letter-spacing: 1px;
            }
            .order-id {
              font-size: 15px;
              font-weight: bold;
              margin-bottom: 2mm;
              color: #333;
            }
            .divider {
              border-bottom: 1.5px dashed #bbb;
              margin: 2mm 0;
            }
            .info {
              margin-bottom: 3mm;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1mm;
              color: #444;
            }
            .info-row strong {
              color: #008080;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 3mm 0;
              background: #fff;
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 1px 2px #eee;
            }
            th, td {
              padding: 1.5mm 1mm;
              text-align: right;
              font-size: 11px;
            }
            th {
              font-weight: bold;
              background: #e0f7fa;
              color: #008080;
              border-bottom: 1px solid #b2dfdb;
            }
            .item-name {
              max-width: 30mm;
              overflow-wrap: break-word;
            }
            .quantity {
              text-align: center;
              width: 10mm;
            }
            .price {
              text-align: left;
              width: 15mm;
            }
            .item-note {
              color: #b71c1c;
              font-size: 10px;
              margin-top: 1mm;
              font-style: italic;
            }
            .item-discount {
              color: #388e3c;
              font-size: 10px;
              margin-top: 1mm;
            }
            .subtotal-row {
              display: flex;
              justify-content: space-between;
              margin: 2mm 0;
              font-weight: bold;
              color: #333;
            }
            .total-section {
              background-color: #e0f2f1;
              padding: 2mm;
              border-radius: 2mm;
              margin: 2mm 0;
              box-shadow: 0 1px 2px #eee;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              font-weight: bold;
              color: #00695c;
            }
            .footer {
              text-align: center;
              margin-top: 4mm;
              font-size: 10px;
              color: #888;
            }
            .barcode {
              text-align: center;
              margin: 3mm 0;
              font-family: monospace;
              font-size: 13px;
              color: #333;
            }
            .status {
              text-align: center;
              font-weight: bold;
              margin: 2mm 0;
              padding: 1mm;
              border: 1px solid #008080;
              border-radius: 1mm;
              color: #008080;
              background: #e0f7fa;
            }
            .section-title {
              font-size: 12px;
              font-weight: bold;
              color: #008080;
              margin-bottom: 2mm;
              margin-top: 2mm;
            }
            .order-notes {
              background: #fff3e0;
              color: #b26a00;
              border-radius: 1mm;
              padding: 1.5mm;
              margin: 2mm 0;
              font-size: 10px;
            }
            .payment-row {
              display: flex;
              justify-content: space-between;
              margin: 1mm 0;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">کافه اِی</div>
            <div class="order-id">سفارش #${selectedOrder.id}</div>
          </div>
          <div class="divider"></div>
          <div class="info">
            <div class="info-row">
              <strong>تاریخ:</strong>
              <span>${selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('fa-IR') : '-'}</span>
            </div>
            ${showCustomer ? `
            <div class="info-row">
              <strong>مشتری:</strong>
              <span>${selectedOrder.customerName}</span>
            </div>
            ` : ''}
            ${showTable ? `
            <div class="info-row">
              <strong>میز:</strong>
              <span>${selectedOrder.tableNumber}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <strong>وضعیت:</strong>
              <span>${getStatusText(selectedOrder.status)}</span>
            </div>
            <div class="info-row">
              <strong>روش پرداخت:</strong>
              <span>${paymentMethod}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="section-title">اقلام سفارش</div>
          <table>
            <thead>
              <tr>
                <th class="item-name">نام کالا</th>
                <th class="quantity">تعداد</th>
                <th class="price">فی</th>
                <th class="price">قیمت</th>
              </tr>
            </thead>
            <tbody>
              ${itemDetails.map((item: ItemDetail) => `
                <tr>
                  <td class="item-name">
                    ${item.name}
                    ${item.note ? `<div class='item-note'>یادداشت: ${item.note}</div>` : ''}
                    ${item.discount ? `<div class='item-discount'>تخفیف: ${item.discount.toLocaleString()} تومان</div>` : ''}
                  </td>
                  <td class="quantity">${item.quantity}</td>
                  <td class="price">${item.unitPrice.toLocaleString()}</td>
                  <td class="price">${item.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="divider"></div>
          <div class="subtotal-row">
            <span>جمع کل:</span>
            <span>${subtotal.toLocaleString()} تومان</span>
          </div>
          ${totalDiscount > 0 ? `
            <div class="subtotal-row" style="color:#388e3c;">
              <span>تخفیف:</span>
              <span>- ${totalDiscount.toLocaleString()} تومان</span>
            </div>
          ` : ''}
          <div class="total-section">
            <div class="total-row">
              <span>مبلغ قابل پرداخت:</span>
              <span>${Number(selectedOrder.totalPrice).toLocaleString()} تومان</span>
            </div>
          </div>
          ${orderNotes ? `<div class="order-notes">یادداشت سفارش: ${orderNotes}</div>` : ''}
          <div class="divider"></div>
          <div class="barcode">
            *${selectedOrder.id.toString().padStart(6, '0')}*
          </div>
          <div class="footer">
            <p>با تشکر از خرید شما</p>
            <p>Cafe A</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  return (

  <>
    {isPaymentModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                <i className="fi fi-rr-credit-card text-white text-lg"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">انتخاب روش پرداخت</h2>
                <p className="text-sm text-gray-600">لطفاً روش پرداخت را برای تکمیل سفارش انتخاب کنید</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsPaymentModalOpen(false);
                setPendingOrderId(null);
                setPaymentMethodToSet("");
              }}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <i className="fi fi-rr-cross text-gray-600 text-sm"></i>
            </button>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4 mb-6">
              <button
                className={`w-full px-4 py-3 rounded-xl border text-lg font-bold transition-colors ${paymentMethodToSet === 'کارت به کارت' ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-teal-50'}`}
                onClick={() => setPaymentMethodToSet('کارت به کارت')}
              >
                کارت به کارت
              </button>
              <button
                className={`w-full px-4 py-3 rounded-xl border text-lg font-bold transition-colors ${paymentMethodToSet === 'پوز' ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-teal-50'}`}
                onClick={() => setPaymentMethodToSet('پوز')}
              >
                پوز
              </button>
              <button
                className={`w-full px-4 py-3 rounded-xl border text-lg font-bold transition-colors ${paymentMethodToSet === 'نقدی' ? 'bg-teal-500 text-white border-teal-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-teal-50'}`}
                onClick={() => setPaymentMethodToSet('نقدی')}
              >
                نقدی
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPendingOrderId(null);
                  setPaymentMethodToSet("");
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleCompleteOrderWithPayment}
                disabled={!paymentMethodToSet}
                className={`px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                ثبت پرداخت و تکمیل سفارش
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  <div className="xl:mt-0 mt-20">
      <div className="xl:px-0 px-7 py-5 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold text-gray-800">مدیریت سفارشات</h1>
            <p className="text-gray-600 mt-1">مدیریت و پیگیری سفارشات مشتریان</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === "cards" ? "table" : "cards")}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              title={viewMode === "cards" ? "نمایش جدولی" : "نمایش کارتی"}
            >
              <i className={`fi ${viewMode === "cards" ? "fi-rr-table" : "fi-rr-apps"} text-gray-600`}></i>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{orderStats.total}</p>
              <p className="text-sm text-gray-600">کل سفارشات</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{orderStats.pending}</p>
              <p className="text-sm text-gray-600">در انتظار</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{orderStats.preparing}</p>
              <p className="text-sm text-gray-600">در حال آماده‌سازی</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{orderStats.ready}</p>
              <p className="text-sm text-gray-600">آماده</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{orderStats.completed}</p>
              <p className="text-sm text-gray-600">تکمیل شده</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">{formatPrice(orderStats.todayRevenue)}</p>
              <p className="text-sm text-gray-600">درآمد امروز</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-4 xl:p-6 shadow-box">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div className="xl:col-span-2">
              <div className="relative">
                <i className="fi fi-rr-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="جستجو در شماره سفارش، نام مشتری یا شماره میز..."
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="pending">در انتظار</option>
                <option value="preparing">در حال آماده‌سازی</option>
                <option value="ready">آماده</option>
                <option value="completed">تکمیل شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">همه تاریخ‌ها</option>
                <option value="today">امروز</option>
                <option value="week">هفته گذشته</option>
                <option value="month">ماه گذشته</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-box text-center">
            <i className="fi fi-rr-shopping-cart text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-lg mb-2">
              {orders.length === 0 ? "هیچ سفارشی ثبت نشده است" : "نتیجه‌ای یافت نشد"}
            </p>
            <p className="text-gray-400 text-sm">
              {orders.length === 0 ? "سفارشات جدید در اینجا نمایش داده می‌شود" : "لطفاً فیلترهای جستجو را تغییر دهید"}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-box hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <i className="fi fi-rr-shopping-cart text-teal-600 text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">#{order.id}</h3>
                      <p className="text-sm text-gray-500">{order.customerName || "مشتری ناشناس"}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">میز</p>
                    <p className="font-medium text-gray-800">{order.tableNumber || "-"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">مبلغ کل</p>
                    <p className="font-medium text-gray-800">{formatPrice(order.totalPrice)} تومان</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">تعداد اقلام</p>
                    <p className="font-medium text-gray-800">{order.totalItems}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">زمان سفارش</p>
                    <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openOrderModal(order)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fi fi-rr-eye text-sm"></i>
                    مشاهده جزئیات
                  </button>
                  {order.status !== "completed" && order.status !== "cancelled" && (
                    <button
                      onClick={() => changeOrderStatus(order.id, order.status)}
                      className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="fi fi-rr-check text-sm"></i>
                      {order.status === "pending" ? "شروع آماده‌سازی" : 
                       order.status === "preparing" ? "آماده شد" : 
                       order.status === "ready" ? "تکمیل سفارش" : ""}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl shadow-box overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">شماره سفارش</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مشتری</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">میز</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مبلغ کل</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">وضعیت</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">زمان سفارش</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-700">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                            <i className="fi fi-rr-shopping-cart text-teal-600 text-sm"></i>
                          </div>
                          <span className="font-medium text-gray-800">#{order.id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-800">{order.customerName || "مشتری ناشناس"}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-800">{order.tableNumber || "-"}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-800">{formatPrice(order.totalPrice)} تومان</p>
                        <p className="text-xs text-gray-500">{order.totalItems} قلم</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openOrderModal(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="مشاهده جزئیات"
                          >
                            <i className="fi fi-rr-eye text-sm"></i>
                          </button>
                          {order.status !== "completed" && order.status !== "cancelled" && (
                            <button
                              onClick={() => changeOrderStatus(order.id, order.status)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="تغییر وضعیت"
                            >
                              <i className="fi fi-rr-check text-sm"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {filteredOrders.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-box">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                نمایش {startIndex + 1} تا {Math.min(endIndex, filteredOrders.length)} از {filteredOrders.length} سفارش
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  قبلی
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-teal-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  بعدی
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        className="fixed bottom-24 right-5 bg-teal-400 text-white rounded-full size-16 z-20 shadow-teal-100 shadow-xl flex items-center justify-center border border-white"
        onClick={() => setIsModalOpen(true)}
      >
        <i className="fi fi-rr-add text-3xl mt-2.5"></i>
      </button>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                  <i className="fi fi-rr-plus text-white text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">سفارش جدید</h2>
                  <p className="text-sm text-gray-600">افزودن سفارش جدید به سیستم</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fi fi-rr-cross text-gray-600 text-sm"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Order Details Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">اطلاعات سفارش</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نام مشتری
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <i className="fi fi-rr-user absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                          type="text"
                          name="customer"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="نام مشتری (اختیاری)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <i className="fi fi-rr-list text-sm"></i>
                        انتخاب
                      </button>
                    </div>
                    {selectedCustomer && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <i className="fi fi-rr-user mr-2"></i>
                          {selectedCustomer.name} - {selectedCustomer.phone}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      شماره میز
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <i className="fi fi-rr-table absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                          type="text"
                          name="table"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="شماره میز (اختیاری)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTableModalOpen(true)}
                        className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <i className="fi fi-rr-list text-sm"></i>
                        انتخاب
                      </button>
                    </div>
                    {selectedTable && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <i className="fi fi-rr-table mr-2"></i>
                          میز {selectedTable.table_number} - ظرفیت {selectedTable.capacity} نفر
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Menu Items Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">انتخاب اقلام منو</h3>
                
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <i className="fi fi-rr-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      name="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="جستجو در منو..."
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">دسته‌بندی‌ها</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategoryId(null)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategoryId === null
                          ? "bg-teal-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      همه
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategoryId(category.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategoryId === category.id
                            ? "bg-teal-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Menu Items Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-16">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Image
                            width={80}
                            height={80}
                            src={item.image}
                            alt={item.name}
                            className="rounded-xl w-20 h-20 object-cover"
                          />
                          {getItemQuantity(item.id) > 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {getItemQuantity(item.id)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-1">{item.name}</h4>
                          <p className="text-sm text-gray-600 mb-3">{formatPrice(item.price)} تومان</p>
                          <div className="flex items-center gap-2">
                            {getItemQuantity(item.id) === 0 ? (
                              <button
                                onClick={() => addItem(item.id)}
                                className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors flex items-center gap-2"
                              >
                                <i className="fi fi-rr-plus text-xs"></i>
                                افزودن
                              </button>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => decreaseQuantity(item.id)}
                                  className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                                >
                                  <i className="fi fi-rr-minus text-xs"></i>
                                </button>
                                <span className="text-lg font-bold text-gray-800 min-w-[30px] text-center">
                                  {getItemQuantity(item.id)}
                                </span>
                                <button
                                  onClick={() => increaseQuantity(item.id)}
                                  className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                                >
                                  <i className="fi fi-rr-plus text-xs"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="sticky bottom-0 border-t border-gray-200 p-6 bg-gray-50 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {Object.keys(itemQuantities).length > 0 ? (
                    <span>
                      {Object.values(itemQuantities).reduce((sum, qty) => sum + qty, 0)} قلم انتخاب شده
                    </span>
                  ) : (
                    <span>هیچ آیتمی انتخاب نشده</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={Object.keys(itemQuantities).length === 0}
                    className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <i className="fi fi-rr-check text-sm"></i>
                    ثبت سفارش
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {isOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <i className="fi fi-rr-shopping-cart text-white text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    جزئیات سفارش #{selectedOrder.id}
                  </h2>
                  <p className="text-sm text-gray-600">مشاهده و مدیریت سفارش</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                  title="چاپ رسید"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 9V2h12v7M6 18v4h12v-4M6 14h12M6 10h12" /></svg>
                </button>
                <button
                  onClick={closeOrderModal}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <i className="fi fi-rr-cross text-gray-600 text-sm"></i>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">

              {/* Order Info Cards */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <i className="fi fi-rr-user text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-medium">مشتری</p>
                      <p className="text-sm font-bold text-blue-800">
                        {selectedOrder.customerName || "مشتری ناشناس"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <i className="fi fi-rr-table text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">میز</p>
                      <p className="text-sm font-bold text-green-800">
                        {selectedOrder.tableNumber || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <i className="fi fi-rr-money text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-medium">مبلغ کل</p>
                      <p className="text-sm font-bold text-purple-800">
                        {formatPrice(selectedOrder.totalPrice)} تومان
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <i className="fi fi-rr-clock text-white text-sm"></i>
                    </div>
                    <div>
                      <p className="text-xs text-orange-600 font-medium">وضعیت</p>
                      <div className={`px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">اقلام سفارش</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any) => (
                    <div
                      key={item.order_item_ID}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-teal-700">
                              {item.quantity}x
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.item_name}</p>
                            <p className="text-sm text-gray-600">
                              {formatPrice(item.item_price)} تومان
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => removeItemFromOrder(item.menu_ID)}
                            className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                          >
                            <i className="fi fi-rr-minus text-xs"></i>
                          </button>
                          <span className="text-lg font-bold text-gray-800 min-w-[30px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => addItemToOrder(item.menu_ID)}
                            className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            <i className="fi fi-rr-plus text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Items */}
              <div className="mb-16">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">افزودن آیتم جدید</h3>
                <div className="relative mb-4">
                  <i className="fi fi-rr-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    value={orderModalSearchTerm}
                    onChange={(e) => setOrderModalSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="جستجو در منو..."
                  />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {items
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(orderModalSearchTerm.toLowerCase())
                    )
                    .slice(0, orderModalSearchTerm.trim() === "" ? 6 : 8)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Image
                              width={50}
                              height={50}
                              src={item.image}
                              alt={item.name}
                              className="rounded-lg w-12 h-12 object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatPrice(item.price)} تومان
                              </p>
                            </div>
                          </div>
                          {newItemsToAdd[item.id] ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (newItemsToAdd[item.id] > 1) {
                                    setNewItemsToAdd(prev => ({
                                      ...prev,
                                      [item.id]: prev[item.id] - 1
                                    }));
                                  } else {
                                    setNewItemsToAdd(prev => {
                                      const newState = { ...prev };
                                      delete newState[item.id];
                                      return newState;
                                    });
                                  }
                                }}
                                className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                              >
                                <i className="fi fi-rr-minus text-xs"></i>
                              </button>
                              <span className="text-sm font-bold text-gray-800 min-w-[20px] text-center">
                                {newItemsToAdd[item.id]}
                              </span>
                              <button
                                onClick={() => setNewItemsToAdd(prev => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] || 0) + 1
                                }))}
                                className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
                              >
                                <i className="fi fi-rr-plus text-xs"></i>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setNewItemsToAdd(prev => ({
                                ...prev,
                                [item.id]: 1
                              }))}
                              className="px-3 py-1 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors flex items-center gap-1"
                            >
                              <i className="fi fi-rr-plus text-xs"></i>
                              افزودن
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Submit New Items Section */}
              {Object.keys(newItemsToAdd).length > 0 && (
                <div className="mb-16 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-teal-800">آیتم‌های جدید برای افزودن</h4>
                    <span className="text-sm text-teal-600">
                      {Object.values(newItemsToAdd).reduce((sum, qty) => sum + qty, 0)} قلم
                    </span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {Object.entries(newItemsToAdd).map(([itemId, quantity]) => {
                      const item = items.find(i => i.id === parseInt(itemId));
                      return item ? (
                        <div key={itemId} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.name}</span>
                          <span className="font-medium text-teal-700">{quantity}x</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setNewItemsToAdd({})}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      پاک کردن همه
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Add each item to the order
                          for (const [itemId, quantity] of Object.entries(newItemsToAdd)) {
                            for (let i = 0; i < quantity; i++) {
                              addItemToOrder(parseInt(itemId));
                            }
                          }
                          
                          // Clear the new items
                          setNewItemsToAdd({});
                          toast.success("آیتم‌های جدید با موفقیت اضافه شدند");
                        } catch (error) {
                          toast.error("خطا در افزودن آیتم‌ها");
                        }
                      }}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors text-sm flex items-center gap-2"
                    >
                      <i className="fi fi-rr-check text-xs"></i>
                      افزودن به سفارش
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer - Sticky */}
            <div className="sticky bottom-0 border-t border-gray-200 p-6 bg-gray-50 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  سفارش #{selectedOrder.id} - {selectedOrder.items.length} قلم - {formatPrice(selectedOrder.totalPrice)} تومان
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeOrderModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    بستن
                  </button>
                  {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                    <button
                      onClick={() => changeOrderStatus(selectedOrder.id, selectedOrder.status)}
                      className="px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors flex items-center gap-2"
                    >
                      <i className="fi fi-rr-check text-sm"></i>
                      {selectedOrder.status === "pending" ? "شروع آماده‌سازی" : 
                       selectedOrder.status === "preparing" ? "آماده شد" : 
                       selectedOrder.status === "ready" ? "تکمیل سفارش" : ""}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <i className="fi fi-rr-users text-white text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">انتخاب مشتری</h2>
                  <p className="text-sm text-gray-600">مشتری مورد نظر را انتخاب کنید</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCustomerModalOpen(false);
                  setCustomerSearchTerm("");
                }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fi fi-rr-cross text-gray-600 text-sm"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <i className="fi fi-rr-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="جستجو در نام، تلفن یا ایمیل مشتری..."
                  />
                </div>
              </div>

              <div className="space-y-3">
                {customers
                  .filter((customer) => 
                    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                    customer.phone.includes(customerSearchTerm) ||
                    (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
                  )
                  .map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomerName(customer.name);
                      setCustomerSearchTerm("");
                      setIsCustomerModalOpen(false);
                    }}
                    className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <i className="fi fi-rr-user text-blue-600"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{customer.name}</h3>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                          {customer.email && (
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          )}
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
                        انتخاب
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Selection Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <i className="fi fi-rr-table text-white text-lg"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">انتخاب میز</h2>
                  <p className="text-sm text-gray-600">میز مورد نظر را انتخاب کنید یا میز جدید ایجاد کنید</p>
                </div>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fi fi-rr-cross text-gray-600 text-sm"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Create New Table Section */}
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <h3 className="font-medium text-purple-800 mb-3">ایجاد میز جدید</h3>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="شماره میز"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="newTableNumber"
                  />
                  <input
                    type="number"
                    placeholder="ظرفیت (تعداد نفر)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="newTableCapacity"
                    defaultValue="4"
                  />
                  <input
                    type="text"
                    placeholder="مکان (اختیاری)"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    id="newTableLocation"
                  />
                </div>
                <button
                  onClick={async () => {
                    const tableNumber = (document.getElementById('newTableNumber') as HTMLInputElement)?.value;
                    const capacity = (document.getElementById('newTableCapacity') as HTMLInputElement)?.value;
                    const location = (document.getElementById('newTableLocation') as HTMLInputElement)?.value;

                    if (!tableNumber) {
                      toast.error("شماره میز الزامی است");
                      return;
                    }

                    try {
                      const response = await fetch('/api/tables', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          tableNumber,
                          capacity: parseInt(capacity) || 4,
                          location: location || ''
                        })
                      });

                      const data = await response.json();
                      if (data.success) {
                        toast.success("میز با موفقیت ایجاد شد");
                        fetchTables();
                        // Auto-select the new table
                        setSelectedTable({ table_number: tableNumber, capacity: parseInt(capacity) || 4 });
                        setTableNumber(tableNumber);
                        setIsTableModalOpen(false);
                      } else {
                        toast.error(data.message);
                      }
                    } catch (error) {
                      toast.error("خطا در ایجاد میز");
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <i className="fi fi-rr-plus text-sm"></i>
                  ایجاد میز جدید
                </button>
              </div>

              {/* Existing Tables */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">میزهای موجود</h3>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      onClick={() => {
                        setSelectedTable(table);
                        setTableNumber(table.table_number);
                        setIsTableModalOpen(false);
                      }}
                      className={`p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer ${
                        table.status === 'available' 
                          ? 'border-green-200 hover:bg-green-50' 
                          : 'border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            table.status === 'available' ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            <i className={`fi fi-rr-table ${
                              table.status === 'available' ? 'text-green-600' : 'text-orange-600'
                            }`}></i>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">میز {table.table_number}</h3>
                            <p className="text-sm text-gray-600">ظرفیت: {table.capacity} نفر</p>
                            {table.location && (
                              <p className="text-xs text-gray-500">{table.location}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-left">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            table.status === 'available' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {table.status === 'available' ? 'آزاد' : 'اشغال'}
                          </span>
                          {table.status !== 'available' && (
                            <p className="text-xs text-orange-600 mt-1">قابل انتخاب</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </>);
}
