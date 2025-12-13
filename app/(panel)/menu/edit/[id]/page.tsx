"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/lib/useToast";
import CustomSelect from "@/components/ui/Select";

interface MenuItem {
  id: number;
  name: string;
  info: string;
  price: number;
  image: string | null;
  categoryId: number | null;
  categoryName: string | null;
  status: number;
  menu_show?: number;
}

export default function EditItem() {
  const { success: showSuccess, error: showError } = useToast();
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    info: ""
  });
  const [menuShow, setMenuShow] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility function to format price with commas
  const formatPrice = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue) {
      return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    return '';
  };

  // Utility function to remove commas and convert to number
  const parsePrice = (value: string) => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  // Fetch menu item data
  const fetchMenuItem = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/menu/${itemId}`);
      const result = await response.json();
      
      if (result.success) {
        const item = result.data;
        setFormData({
          name: item.name,
          price: formatPrice(item.price.toString()),
          info: item.info
        });
        setSelectedCategoryId(item.categoryId);
        setOriginalImage(item.image);
        setSelectedImage(item.image);
        setMenuShow(item.menu_show !== undefined ? item.menu_show : 1);
      } else {
        setError(result.message || 'خطا در دریافت اطلاعات آیتم');
      }
    } catch (error) {
      console.error('Error fetching menu item');
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        
        if (result.success) {
          setCategories(result.data);
        } else {
          showError('خطا در دریافت دسته‌بندی ها');
        }
      } catch (error) {
        console.error('Error fetching categories');
        showError('خطا در ارتباط با سرور');
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Load data on component mount
  useEffect(() => {
    if (itemId) {
      fetchMenuItem();
    }
  }, [itemId]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) readImageFile(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readImageFile = (file: File) => {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('لطفاً یک تصویر معتبر انتخاب کنید');
      return;
    }
    const maxBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxBytes) {
      setImageError('حجم تصویر نباید بیش از 2 مگابایت باشد');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) readImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      const formattedPrice = formatPrice(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPrice
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      showError("لطفا نام و قیمت را پر کنید");
      return;
    }

    const numericPrice = parsePrice(formData.price);
    if (numericPrice <= 0) {
      showError("قیمت باید بیشتر از صفر باشد");
      return;
    }

    setIsSubmitting(true);

    try {
      const jsonData = {
        name: formData.name,
        price: numericPrice,
        info: formData.info,
        categoryId: selectedCategoryId,
        menu_show: menuShow,
        ...(selectedImage && selectedImage !== originalImage && { image: selectedImage })
      };

      const response = await fetch(`/api/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData)
      });

      if (response.ok) {
        showSuccess("آیتم با موفقیت ویرایش شد");
        router.push('/menu');
      } else {
        const errorData = await response.json();
        showError(`خطا در ویرایش آیتم: ${errorData.message || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error updating menu item');
      showError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 flex items-center justify-center pt-28">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 pt-28">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="sm:text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
                ویرایش آیتم
              </h1>
            </div>
            <Link
              href={"/menu"}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-gray-700 text-sm font-medium border border-gray-200 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              بازگشت
            </Link>
          </div>
          <div className="flex items-center justify-center py-10">
            <div className="text-red-500 text-center">
              <div className="mb-4 text-lg font-semibold">{error}</div>
              <button 
                onClick={fetchMenuItem}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-8 px-4 sm:px-6 pt-28">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="sm:text-4xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              ویرایش آیتم
            </h1>
            <p className="text-gray-500 text-xs">تغییرات محصول را اعمال کنید</p>
          </div>
          <Link
            href={"/menu"}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-gray-700 text-sm font-medium border border-gray-200 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 shadow-sm"
          >
            بازگشت
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section */}
          <div className="relative" onDrop={handleDrop} onDragOver={handleDragOver}>
            {selectedImage ? (
              <div className="relative group">
                <div className="relative rounded-2xl overflow-hidden bg-gray-100 w-full aspect-square max-w-sm mx-auto shadow-lg">
                  <img
                    src={selectedImage}
                    alt="تصویر محصول"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200"></div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
                  title="حذف تصویر"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleButtonClick}
                className="w-full max-w-sm mx-auto block p-8 rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:from-teal-50 hover:to-teal-25 hover:border-teal-400 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="p-4 rounded-lg bg-teal-100 text-teal-600 group-hover:scale-110 transition-transform duration-200">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-800">تصویر محصول را اضافه کنید</p>
                    <p className="text-sm text-gray-500 mt-1">تصویر را رها کنید یا برای انتخاب کلیک کنید</p>
                  </div>
                </div>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imageError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center animate-pulse">
                {imageError}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                نام آیتم
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="مثال: قهوه اسپرسو"
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Price Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                قیمت محصول
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="مثال: 15000"
                  className="flex-1 px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all duration-200"
                  required
                />
                <span className="px-4 py-3 bg-teal-50 text-teal-600 font-semibold rounded-lg border border-teal-200 text-sm">
                  تومان
                </span>
              </div>
            </div>

            {/* Category Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                دسته‌بندی
              </label>
              {isLoadingCategories ? (
                <div className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-teal-400 rounded-full animate-spin"></div>
                  در حال بارگذاری...
                </div>
              ) : (
                <CustomSelect
                  options={categories}
                  onSelect={setSelectedCategoryId}
                  defaultValue={selectedCategoryId}
                  placeholder="انتخاب دسته‌بندی"
                />
              )}
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2.5">
                توضیحات محصول <span className="text-gray-400 text-xs font-normal">(اختیاری)</span>
              </label>
              <textarea
                name="info"
                rows={4}
                value={formData.info}
                onChange={handleInputChange}
                placeholder="توضیحات تفصیلی محصول را وارد کنید..."
                className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all duration-200 resize-none"
              ></textarea>
            </div>

            {/* Menu Show Checkbox */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={menuShow === 1}
                  onChange={(e) => setMenuShow(e.target.checked ? 1 : 0)}
                  className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-800">
                  نمایش در منو
                </span>
              </label>
              <span className="text-xs text-gray-500">
                {menuShow === 1 ? 'آیتم در منو نمایش داده می‌شود' : 'آیتم در منو مخفی است'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:from-teal-500 disabled:to-teal-600 transition-all duration-200 shadow-md hover:shadow-lg active:shadow-sm text-base flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                در حال ویرایش...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                ویرایش آیتم
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <div className="flex gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p>نام و قیمت الزامی هستند. توضیحات محصول اختیاری است.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
