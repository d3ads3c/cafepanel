"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Category {
  id: number;
  name: string;
}

export default function EditCategory() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [formData, setFormData] = useState({
    name: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch category data
  const fetchCategory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/categories/${categoryId}`);
      const result = await response.json();
      
      if (result.success) {
        const category = result.data;
        setFormData({
          name: category.name
        });
      } else {
        setError(result.message || 'خطا در دریافت اطلاعات دسته‌بندی');
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('خطا در ارتباط با سرور');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("لطفا نام دسته‌بندی را وارد کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim()
        })
      });

      if (response.ok) {
        toast.success("دسته‌بندی با موفقیت ویرایش شد");
        router.push('/settings/categories');
      } else {
        const errorData = await response.json();
        toast.error(`خطا در ویرایش دسته‌بندی: ${errorData.message || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success("دسته‌بندی با موفقیت حذف شد");
        router.push('/settings/categories');
      } else {
        const errorData = await response.json();
        toast.error(`خطا در حذف دسته‌بندی: ${errorData.message || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
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
          <h1 className="font-bold">ویرایش دسته‌بندی</h1>
          <Link
            href={"/settings/categories"}
            className="py-2 px-5 rounded-xl bg-teal-400 text-white text-sm shadow-xl shadow-teal-100"
          >
            بازگشت
          </Link>
        </div>
        <div className="flex items-center justify-center py-10">
          <div className="text-red-500 text-center">
            <div className="mb-2">{error}</div>
            <button 
              onClick={fetchCategory}
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
        <h1 className="font-bold">ویرایش دسته‌بندی</h1>
        <Link
          href={"/settings/categories"}
          className="py-2 px-5 rounded-xl bg-teal-400 text-white text-sm shadow-xl shadow-teal-100"
        >
          بازگشت
        </Link>
      </div>
      
      <form onSubmit={handleSubmit} className="mt-5 px-5 pt-5">
        <div className="space-y-7">
          <div>
            <p className="text-sm mb-2">نام دسته‌بندی</p>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-3.5 text-sm border rounded-xl focus:outline-none"
              placeholder="مثال: نوشیدنی های سرد"
              required
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 text-white bg-teal-400 py-3 rounded-xl shadow-xl shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-500 transition-colors"
            >
              {isSubmitting ? "در حال ویرایش..." : "ویرایش دسته‌بندی"}
            </button>
            
            <button 
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-6 text-white bg-red-500 py-3 rounded-xl shadow-xl shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
            >
              حذف
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
