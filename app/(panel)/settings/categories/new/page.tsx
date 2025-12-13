"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/useToast";

export default function NewCategory() {
  const { success: showSuccess, error: showError } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      showError("لطفا نام دسته‌بندی را وارد کنید");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim()
        })
      });

      if (response.ok) {
        showSuccess("دسته‌بندی با موفقیت ایجاد شد");
        router.push('/settings/categories');
      } else {
        const errorData = await response.json();
        showError(`خطا در ایجاد دسته‌بندی: ${errorData.message || 'خطای نامشخص'}`);
      }
    } catch (error) {
      console.error('Error creating category');
      showError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-20">
      <div className="px-5 pt-5 flex items-center justify-between">
        <h1 className="font-bold">دسته‌بندی جدید</h1>
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
          
          <button 
            type="submit"
            disabled={isSubmitting}
            className="text-white bg-teal-400 py-3 rounded-xl shadow-xl shadow-teal-100 w-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-500 transition-colors"
          >
            {isSubmitting ? "در حال ایجاد..." : "ایجاد دسته‌بندی"}
          </button>
        </div>
      </form>
    </div>
  );
}
