"use client"
import Image from "next/image";
import { useState } from "react";

export default function ProductReviewSection() {

    const [reviews, setReviews] = useState([
        {
            id: 1,
            user: {
                name: "علی رضایی",
                image: "/img/logo/192.png"
            },
            date: "1404/07/16",
            comment: "محصول بسیار با کیفیت و ارسال سریع بود. ممنون از فروشگاه!",
            rating: 5
        },
        {
            id: 2,
            user: {
                name: "مریم احمدی",
                image: "/img/logo/512.png"
            },
            date: "1404/07/10",
            comment: "بسته‌بندی عالی و قیمت مناسب. حتما دوباره خرید می‌کنم.",
            rating: 4
        }
    ]);

    const [form, setForm] = useState({ name: "", comment: "", rating: 5 });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRatingChange = (rating: number) => {
        setForm((prev) => ({ ...prev, rating }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.comment.trim()) return;
        setSubmitting(true);
        setTimeout(() => {
            setReviews([
                {
                    id: Date.now(),
                    user: {
                        name: form.name,
                        image: "/img/logo/192.png"
                    },
                    date: new Date().toLocaleDateString("fa-IR"),
                    comment: form.comment,
                    rating: Number(form.rating)
                },
                ...reviews
            ]);
            setForm({ name: "", comment: "", rating: 5 });
            setSubmitting(false);
        }, 500);
    };

    return (
        <div className="">
            <h2 className="font-bold text-xl mb-6">نظرات کاربران</h2>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Review List */}
                <div className="flex-1 order-2 md:order-1">
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4 shadow-sm">
                                <Image src={review.user.image} width={48} height={48} alt={review.user.name} className="rounded-full border border-gray-200" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-semibold text-gray-800 text-sm">{review.user.name}</span>
                                        <span className="text-xs text-gray-400">{review.date}</span>
                                        <span className="flex items-center gap-0.5">
                                            {[1,2,3,4,5].map((star) => (
                                                <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                                            ))}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Review Form */}
                <div className="w-full md:w-1/3 order-1 md:order-2 sticky top-3">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-box p-5 flex flex-col gap-4 sticky top-24">
                        <h3 className="font-bold text-gray-700 mb-2">ثبت نظر شما</h3>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500"
                            placeholder="نام شما"
                            disabled={submitting}
                        />
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">امتیاز:</span>
                            {[1,2,3,4,5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    onClick={() => handleRatingChange(star)}
                                    className="focus:outline-none"
                                    tabIndex={-1}
                                >
                                    <svg className={`w-5 h-5 ${star <= form.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.38-2.454a1 1 0 00-1.175 0l-3.38 2.454c-.784.57-1.838-.196-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z"/></svg>
                                </button>
                            ))}
                        </div>
                        <textarea
                            name="comment"
                            value={form.comment}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 min-h-[80px] resize-none"
                            placeholder="نظر خود را بنویسید..."
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            className="bg-teal-600 text-white rounded-lg py-2 font-bold hover:bg-teal-700 transition"
                            disabled={submitting}
                        >
                            {submitting ? "در حال ارسال..." : "ارسال نظر"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
