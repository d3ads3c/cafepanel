"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function MainOrders() {
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

  useEffect(() => {
    fetchCategories();
    fetchItems();
    fetchOrders();
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
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const openOrderModal = (order: any) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setIsOrderModalOpen(false);
    setOrderModalSearchTerm("");
  };

  const addItemToOrder = (itemId: number) => {
    if (!selectedOrder) return;
    
    const item = items.find(item => item.id === itemId);
    if (!item) return;

    const itemPrice = parseFloat(item.price);

    setSelectedOrder((prev: any) => {
      const existingItem = prev.items.find((orderItem: any) => orderItem.menu_ID === itemId);
      let newItems;
      
      if (existingItem) {
        newItems = prev.items.map((orderItem: any) =>
          orderItem.menu_ID === itemId
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        newItems = [...prev.items, {
          order_item_ID: Date.now(), // Temporary ID
          menu_ID: item.id,
          item_name: item.name,
          item_price: itemPrice,
          quantity: 1
        }];
      }

      // Recalculate totals from items
      const totalItems = newItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum: number, item: any) => sum + (item.item_price * item.quantity), 0);

      return {
        ...prev,
        items: newItems,
        totalItems,
        totalPrice
      };
    });
  };

  const removeItemFromOrder = (itemId: number) => {
    if (!selectedOrder) return;

    setSelectedOrder((prev: any) => {
      const existingItem = prev.items.find((orderItem: any) => orderItem.menu_ID === itemId);
      if (!existingItem) return prev;

      let newItems;
      
      if (existingItem.quantity <= 1) {
        newItems = prev.items.filter((orderItem: any) => orderItem.menu_ID !== itemId);
      } else {
        newItems = prev.items.map((orderItem: any) =>
          orderItem.menu_ID === itemId
            ? { ...orderItem, quantity: orderItem.quantity - 1 }
            : orderItem
        );
      }

      // Recalculate totals from items
      const totalItems = newItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const totalPrice = newItems.reduce((sum: number, item: any) => sum + (item.item_price * item.quantity), 0);

      return {
        ...prev,
        items: newItems,
        totalItems,
        totalPrice
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
          totalPrice: selectedOrder.totalPrice
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('تغییرات با موفقیت اعمال شد');
        closeOrderModal();
        fetchOrders(); // Refresh orders list
      } else {
        toast.error(data.message || 'خطا در اعمال تغییرات');
      }
    } catch (error) {
      console.error('Error applying changes:', error);
      toast.error('خطا در اعمال تغییرات');
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
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('سفارش لغو شد');
        closeOrderModal();
        fetchOrders(); // Refresh orders list
      } else {
        toast.error(data.message || 'خطا در لغو سفارش');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('خطا در لغو سفارش');
    }
  };

  const changeOrderStatus = async (orderId: number, currentStatus: string) => {
    let newStatus: string;
    
    switch (currentStatus) {
      case 'pending':
        newStatus = 'ready';
        break;
      case 'ready':
        newStatus = 'completed';
        break;
      case 'completed':
        // Delete the order
        try {
          const res = await fetch(`/api/orders/${orderId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          
          if (data.success) {
            toast.success('سفارش حذف شد');
            fetchOrders(); // Refresh orders list
          } else {
            toast.error(data.message || 'خطا در حذف سفارش');
          }
        } catch (error) {
          console.error('Error deleting order:', error);
          toast.error('خطا در حذف سفارش');
        }
        return;
      default:
        return;
    }

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
        const statusText = newStatus === 'ready' ? 'آماده' : 'تکمیل شده';
        toast.success(`وضعیت سفارش به ${statusText} تغییر یافت`);
        fetchOrders(); // Refresh orders list
      } else {
        toast.error(data.message || 'خطا در تغییر وضعیت سفارش');
      }
    } catch (error) {
      console.error('Error changing order status:', error);
      toast.error('خطا در تغییر وضعیت سفارش');
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
  return (
    <div className="mt-20">
      <div className="px-5 pt-5">
        <h1>سفارشات</h1>
      </div>
      {/* <div className="w-full px-5 pt-3 pb-10 overflow-auto flex gap-5">
                <div className="min-w-fit text-xs border border-teal-400 shadow-xl shadow-teal-100 rounded-xl py-2 px-4 bg-teal-400 text-white">
                    <p>شیفت صبح</p>
                </div>
                <div className="min-w-fit text-xs border rounded-xl py-2 px-4 border-teal-400 text-teal-400">
                    <p>شیفت عصر</p>
                </div>
                <div className="max-w-fit text-xs border rounded-xl py-2 px-4 bg-teal-100 text-teal-400 border-teal-300">
                    <p>+ صندوق جدید</p>
                </div>
            </div> */}
      <div className="space-y-3 px-5">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>هیچ سفارشی یافت نشد</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="space-y-3">
              <div className="rounded-3xl p-5 border-gray-200 space-y-7 bg-white shadow-box">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-300 font-light">#{order.id} - </p>
                    <h2 className="text-sm">
                      {order.customerName || "مشتری ناشناس"}
                    </h2>
                    <div
                      className={`text-xs font-bold py-1 px-3 rounded-xl ${
                        order.status === "pending"
                          ? "bg-orange-100 text-orange-500"
                          : order.status === "preparing"
                          ? "bg-blue-100 text-blue-500"
                          : order.status === "ready"
                          ? "bg-green-100 text-green-500"
                          : order.status === "completed"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-red-100 text-red-500"
                      }`}
                    >
                      {order.status === "pending"
                        ? "در انتظار"
                        : order.status === "preparing"
                        ? "در حال آماده‌سازی"
                        : order.status === "ready"
                        ? "آماده"
                        : order.status === "completed"
                        ? "تکمیل شده"
                        : "لغو شده"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3">
                  <div className="w-full">
                    <p className="text-xs text-gray-400">میز</p>
                    <h2 className="text-sm">{order.tableNumber || "-"}</h2>
                  </div>
                  <div className="w-full">
                    <p className="text-xs text-gray-400">مبلغ (تومان)</p>
                                         <h2 className="text-sm">
                       {formatPrice(order.totalPrice)}
                     </h2>
                  </div>
                  <div className="w-full">
                    <p className="text-xs text-gray-400">تعداد اقلام</p>
                    <h2 className="text-sm">{order.totalItems}</h2>
                  </div>
                </div>
                                 <div className="space-y-3">
                   <button
                     type="button"
                     className="border border-teal-400 text-teal-400 py-2 w-full rounded-xl"
                     onClick={() => openOrderModal(order)}
                   >
                     مشاهده اقلام
                   </button>
                   {order.status !== "completed" && (
                     <button
                       type="button"
                       className="bg-teal-400 text-white border border-teal-400 py-2 w-full rounded-xl"
                       onClick={() => changeOrderStatus(order.id, order.status)}
                     >
                       {order.status === "pending" 
                         ? "آماده شدن سفارش" 
                         : order.status === "ready" 
                         ? "تکمیل سفارش" 
                         : ""}
                     </button>
                   )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
      <button
        className="fixed bottom-24 right-5 bg-teal-400 text-white rounded-full size-16 z-20 shadow-teal-100 shadow-xl flex items-center justify-center border border-white"
        onClick={() => setIsModalOpen(true)}
      >
        <i className="fi fi-rr-add text-3xl mt-2.5"></i>
      </button>
      {isModalOpen && (
        <div className="fixed w-full h-screen top-0 right-0 flex items-center justify-center z-30 p-5 bg-black/50 backdrop-blur-lg">
          <div className="w-full bg-white rounded-2xl p-7 max-h-[60%]">
            <div className="flex items-center justify-between">
              <h2>سفارش جدید</h2>
              <button
                className="text-red-500"
                onClick={() => setIsModalOpen(false)}
              >
                انصراف
              </button>
            </div>
            <div className="my-4 grid grid-cols-2 gap-4">
              <div className="w-full">
                <p className="text-sm">مشتری</p>
                <input
                  type="text"
                  name="customer"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="border rounded-xl p-2 mt-1 w-full text-sm font-light"
                  placeholder="اختیاری"
                />
              </div>
              <div className="w-full">
                <p className="text-sm">میز</p>
                <input
                  type="text"
                  name="table"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="border rounded-xl p-2 mt-1 w-full text-sm font-light"
                  placeholder="اختیاری"
                />
              </div>
            </div>
            <div className="mb-4 mt-7">
              <h2 className="text-sm">اقلام سفارش</h2>
              <div className="mt-3">
                <input
                  type="text"
                  name="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border rounded-xl p-2 w-full text-sm font-light focus:outline-none"
                  placeholder="جستوجو ..."
                />
              </div>
              <div className="mt-3">
                <div className="w-full py-3 overflow-auto flex gap-5 hide-scroll">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`min-w-max text-xs border rounded-xl py-2 px-4 border-teal-400 text-teal-400 ${
                        selectedCategoryId === category.id
                          ? "bg-teal-400 text-white"
                          : ""
                      }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <p>{category.name}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  {filteredItems.map((item) => (
                    <div className="w-full p-3 rounded-xl border" key={item.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-1/3">
                          <Image
                            width={200}
                            height={200}
                            src={item.image}
                            alt={item.name}
                            className="rounded-xl w-[70px] h-[70px]"
                          />
                        </div>
                        <div className="w-2/3 flex items-center justify-between">
                          <div>
                            <p>{item.name}</p>
                                                         <p className="text-sm text-gray-400 font-light">
                               {formatPrice(item.price)}{" "}
                               تومان
                             </p>
                          </div>
                          <div>
                            {getItemQuantity(item.id) === 0 ? (
                              <button
                                className="text-sm text-teal-400 font-light"
                                onClick={() => addItem(item.id)}
                              >
                                افزودن
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  className="w-6 h-6 rounded-full bg-teal-400 text-white flex items-center justify-center text-xs"
                                  onClick={() => decreaseQuantity(item.id)}
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium min-w-[20px] text-center">
                                  {getItemQuantity(item.id)}
                                </span>
                                <button
                                  className="w-6 h-6 rounded-full bg-teal-400 text-white flex items-center justify-center text-xs"
                                  onClick={() => increaseQuantity(item.id)}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <button
                    className="bg-teal-400 text-white py-2 w-full rounded-xl"
                    onClick={handleSubmitOrder}
                  >
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
         <div className="fixed w-full h-screen top-0 right-0 flex items-center justify-center z-30 p-5 bg-black/50 backdrop-blur-lg">
           <div className="w-full bg-white rounded-2xl p-7 max-h-[80%] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-semibold">جزئیات سفارش #{selectedOrder.id}</h2>
               <button
                 className="text-red-500"
                 onClick={closeOrderModal}
               >
                 بستن
               </button>
             </div>

             {/* Order Info */}
             <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
               <div>
                 <p className="text-xs text-gray-400">مشتری</p>
                 <h3 className="text-sm font-medium">{selectedOrder.customerName || 'مشتری ناشناس'}</h3>
               </div>
               <div>
                 <p className="text-xs text-gray-400">میز</p>
                 <h3 className="text-sm font-medium">{selectedOrder.tableNumber || '-'}</h3>
               </div>
               <div>
                 <p className="text-xs text-gray-400">وضعیت</p>
                 <div className={`text-xs font-bold py-1 px-3 rounded-xl inline-block ${
                   selectedOrder.status === "pending"
                     ? "bg-orange-100 text-orange-500"
                     : selectedOrder.status === "preparing"
                     ? "bg-blue-100 text-blue-500"
                     : selectedOrder.status === "ready"
                     ? "bg-green-100 text-green-500"
                     : selectedOrder.status === "completed"
                     ? "bg-gray-100 text-gray-500"
                     : "bg-red-100 text-red-500"
                 }`}>
                   {selectedOrder.status === "pending"
                     ? "در انتظار"
                     : selectedOrder.status === "preparing"
                     ? "در حال آماده‌سازی"
                     : selectedOrder.status === "ready"
                     ? "آماده"
                     : selectedOrder.status === "completed"
                     ? "تکمیل شده"
                     : "لغو شده"}
                 </div>
               </div>
             </div>

             {/* Current Order Items */}
             <div className="mb-6">
               <h3 className="text-sm font-semibold mb-3">اقلام سفارش</h3>
               <div className="space-y-3">
                 {selectedOrder.items.map((item: any) => (
                   <div key={item.order_item_ID} className="flex items-center justify-between p-3 border rounded-xl">
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                         <span className="text-xs text-gray-500">{item.quantity}x</span>
                       </div>
                       <div>
                         <p className="text-sm font-medium">{item.item_name}</p>
                         <p className="text-xs text-gray-400">
                           {formatPrice(item.item_price)} تومان
                         </p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <button
                         className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-xs"
                         onClick={() => removeItemFromOrder(item.menu_ID)}
                       >
                         -
                       </button>
                       <span className="text-sm font-medium min-w-[20px] text-center">
                         {item.quantity}
                       </span>
                       <button
                         className="w-6 h-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center text-xs"
                         onClick={() => addItemToOrder(item.menu_ID)}
                       >
                         +
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>

                           {/* Add New Items */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3">افزودن آیتم جدید</h3>
                <input 
                  type="text" 
                  value={orderModalSearchTerm}
                  onChange={(e) => setOrderModalSearchTerm(e.target.value)}
                  className="border rounded-xl p-2 w-full text-sm font-light focus:outline-none mb-3" 
                  placeholder="جستوجو ..." 
                />
                <div className="grid grid-cols-1 gap-3">
                  {items
                    .filter(item => 
                      item.name.toLowerCase().includes(orderModalSearchTerm.toLowerCase())
                    )
                    .slice(0, 6)
                    .map((item) => (
                   <div key={item.id} className="flex items-center justify-between p-3 border rounded-xl">
                     <div className="flex items-center gap-2">
                       <Image
                         width={40}
                         height={40}
                         src={item.image}
                         alt={item.name}
                         className="rounded-lg w-10 h-10"
                       />
                       <div>
                         <p className="text-xs font-medium">{item.name}</p>
                         <p className="text-xs text-gray-400">
                           {formatPrice(item.price)} تومان
                         </p>
                       </div>
                     </div>
                     <button
                       className="text-xs bg-teal-100 text-teal-600 px-2 py-1 rounded-lg"
                       onClick={() => addItemToOrder(item.id)}
                     >
                       افزودن
                     </button>
                   </div>
                 ))}
               </div>
             </div>

             {/* Order Summary */}
             <div className="border-t pt-4 mb-6">
               <div className="flex justify-between items-center">
                 <div>
                   <p className="text-sm text-gray-600">مجموع اقلام: {selectedOrder.totalItems}</p>
                   <p className="text-lg font-bold">
                     {formatPrice(selectedOrder.totalPrice)} تومان
                   </p>
                 </div>
                 <div className="flex gap-2">
                   <button
                     className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm"
                     onClick={cancelOrder}
                   >
                     لغو سفارش
                   </button>
                                       <button
                      className="bg-teal-400 text-white px-4 py-2 rounded-xl text-sm"
                      onClick={applyOrderChanges}
                    >
                      ثبت
                    </button>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }
