import Image from "next/image";

import ProductReviewSection from "@/components/ProductReviewSection";
import Link from "next/link";

export default function ProductPage() {
    return (
        <div className="xl:mt-0 mt-20">
            <div className="w-full bg-white rounded-3xl p-8 shaow-box flex items-center gap-5">
                <div className="w-1/3">
                    <Image src={"/img/shop/coffee.jpg"} width={2000} height={2000} alt="Product Image" className="rounded-2xl"></Image>
                </div>
                <div className="w-1/3">
                    <p className="text-gray-400 text-sm">قهوه</p>
                    <h1 className="font-bold text-xl mt-1">
                        قهوه ترکیبی %10 عربیکا %90 روبوستا
                    </h1>
                    <div className="mt-2 mb-5">
                        <p className="text-sm text-gray-400">
                            قهوه میکس شده قهوه واکا که از ترکیب 10 درصد قهوه عربیکا و 90 درصد قهوه روبوستا آماده شده است. ترکیبات این قهوه پیشنهاد شده قهوه واکا می‌باشد.
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-5 my-3">
                        <div className="bg-gray-100 rounded-xl p-2 w-full border border-gray-200">
                            <p className="text-xs text-gray-500 font-light">عربیکا</p>
                            <h3 className="font-bold">۷۰ درصد</h3>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-2 w-full border border-gray-200">
                            <p className="text-xs text-gray-500 font-light">روبوستا</p>
                            <h3 className="font-bold">۳۰ درصد</h3>
                        </div>
                        <div className="bg-gray-100 rounded-xl p-2 w-full border border-gray-200">
                            <p className="text-xs text-gray-500 font-light">چربی</p>
                            <h3 className="font-bold">۲۰ درصد</h3>
                        </div>
                    </div>
                    <div className="w-full bg-teal-100 text-teal-600 py-2 px-3 border border-teal-400 rounded-xl flex items-center gap-2">
                        <i className="fi fi-sr-shipping-fast mt-2 text-lg"></i>
                        <p className="font-bold text-sm">ارسال فوری در روز ثبت سفارش</p>
                    </div>
                    <div className="mt-4">
                        <button type="button" className="text-gray-400 text-sm flex items-center gap-1">
                            <i className="fi fi-sr-info mt-1"></i>
                            <p className="hover:first-letter:underline underline-offset-[5px]">
                                گزارش محصول
                            </p>
                        </button>
                    </div>
                </div>
                <div className="w-1/3">
                    <div className="bg-gray-100 rounded-2xl p-3">
                        <div className="flex items-center gap-2 w-full">
                            <div className="rounded-full flex-1">
                                <Image src={"/img/shop/vaka.png"} width={1000} height={1000} alt="Shop Logo" className="rounded-full object-cover max-w-[70px] mx-auto"></Image>
                            </div>
                            <div className="w-3/4">
                                <div className="flex items-center justify-between w-full">
                                    <div className="w-2/3">
                                        <h2>فروشگاه واکا</h2>
                                    </div>
                                    <div className="flex items-center gap-1 justify-end w-1/3 pl-5">
                                        <h4>۴,۸</h4>
                                        <i className="fi fi-sr-star text-yellow-400"></i>
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm">فروشگاه تخصصی قهوه و روستری</p>
                            </div>
                        </div>
                        <div className="flex items-center w-full bg-white rounded-xl p-3 mt-4">
                            <div className="w-2/3">
                                <h3 className="">بسته ۵۰۰ گرمی</h3>
                                <h4 className="text-teal-600">۶۵۰,۰۰۰ تومان</h4>
                            </div>
                            <div className="w-1/3">
                                <button type="button" className="bg-teal-600 text-white py-3 px-4 rounded-xl">افزودن به سبد</button>
                            </div>
                        </div>
                        <div className="flex items-center w-full bg-white rounded-xl p-3 mt-4">
                            <div className="w-2/3">
                                <h3>بسته ۱ کیلو گرمی</h3>
                                <h4 className="text-teal-600">۱,۳۵۰,۰۰۰ تومان</h4>
                            </div>
                            <div className="w-1/3">
                                <button type="button" className="bg-teal-600 text-white py-3 px-4 rounded-xl">افزودن به سبد</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Product Specification Section */}
            <div className="w-full bg-white rounded-2xl p-6 mt-8">
                <h2 className="font-bold text-lg mb-4">مشخصات محصول</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-[400px] w-full text-sm text-right border-gray-200 rounded-xl">
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50 w-1/3">وزن</td>
                                <td className="py-2 px-4">۱ کیلوگرم</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">نوع دانه</td>
                                <td className="py-2 px-4">عربیکا، روبوستا</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">درجه رست</td>
                                <td className="py-2 px-4">مدیوم</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 font-semibold text-gray-700 bg-gray-50">کشور تولیدکننده</td>
                                <td className="py-2 px-4">ایران</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white p-8 rounded-3xl mt-5">
                <ProductReviewSection />

            </div>
        </div>
    )
}