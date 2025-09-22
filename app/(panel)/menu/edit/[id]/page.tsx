"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
}

export default function EditItem() {
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
      } else {
        setError(result.message || 'خطا در دریافت اطلاعات آیتم');
      }
    } catch (error) {
      console.error('Error fetching menu item:', error);
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
          toast.error('خطا در دریافت دسته‌بندی ها');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('خطا در ارتباط با سرور');
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
    
    if (!formData.name || !formData.price || !formData.info) {
      toast.error("لطفا تمام فیلدها را پر کنید");
      return;
    }

    const numericPrice = parsePrice(formData.price);
    if (numericPrice <= 0) {
      toast.error("قیمت باید بیشتر از صفر باشد");
      return;
    }

    setIsSubmitting(true);

    try {
      const jsonData = {
        name: formData.name,
        price: numericPrice,
        info: formData.info,
        categoryId: selectedCategoryId,
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
        toast.success("آیتم با موفقیت ویرایش شد");
        router.push('/menu');
      } else {
        const errorData = await response.json();
        toast.error(`خطا در ویرایش آیتم: ${errorData.message || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-20">
        <div className="flex items-center justify-center py-10">
          <div className="text-gray-500">در حال بارگذاری...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20">
        <div className="px-5 pt-5 flex items-center justify-between">
          <h1 className="font-bold">ویرایش آیتم</h1>
          <Link
            href={"/menu"}
            className="py-2 px-5 rounded-xl bg-teal-400 text-white text-sm shadow-xl shadow-teal-100"
          >
            بازگشت
          </Link>
        </div>
        <div className="flex items-center justify-center py-10">
          <div className="text-red-500 text-center">
            <div className="mb-2">{error}</div>
            <button 
              onClick={fetchMenuItem}
              className="text-teal-400 hover:text-teal-600"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20">
      <div className="px-5 pt-5 flex items-center justify-between">
        <h1 className="font-bold">ویرایش آیتم</h1>
        <Link
          href={"/menu"}
          className="py-2 px-5 rounded-xl bg-teal-400 text-white text-sm shadow-xl shadow-teal-100"
        >
          بازگشت
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 px-5 pt-5">
        <div className="relative" onDrop={handleDrop} onDragOver={handleDragOver}>
          {selectedImage ? (
            <div className="relative">
              <img
                src={selectedImage}
                alt="تصویر محصول"
                className="bg-gray-100 rounded-3xl size-60 mx-auto object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                title="حذف تصویر"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleButtonClick}
              className="bg-gray-100 rounded-3xl size-60 mx-auto flex flex-col items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400"
            >
              <svg
                className="w-12 h-12 mb-2"
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
              <span className="text-sm">انتخاب تصویر محصول</span>
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
            <div className="text-center text-red-600 text-xs mt-2">{imageError}</div>
          )}
        </div>
        <div className="space-y-7 mt-4">
          <div>
            <p className="text-sm mb-2">نام آیتم</p>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-3.5 text-sm border rounded-xl focus:outline-none"
              required
            />
          </div>
          <div>
            <p className="text-sm mb-2">قیمت محصول</p>
            <div className="flex items-center justify-between gap-5">
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="مثال: ۱۵,۰۰۰"
                className="w-4/5 p-3.5 text-sm border rounded-xl focus:outline-none"
                required
              />
              <div className="w-1/5">
                <h3 className="text-teal-400">تومان</h3>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm mb-2">دسته‌بندی</p>
            {isLoadingCategories ? (
              <div className="w-full p-3.5 text-sm border rounded-xl bg-gray-50 text-gray-500">
                در حال بارگذاری دسته‌بندی ها...
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
          <div>
            <p className="text-sm mb-2">توضیحات محصول</p>
            <textarea
              name="info"
              rows={3}
              value={formData.info}
              onChange={handleInputChange}
              className="w-full p-3.5 text-sm border rounded-xl focus:outline-none"
              required
            ></textarea>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-teal-400 py-3 rounded-xl shadow-xl shadow-teal-100 w-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-500 transition-colors"
          >
            {isSubmitting ? "در حال ویرایش..." : "ویرایش آیتم"}
          </button>
        </div>
      </form>
    </div>
  );
}
