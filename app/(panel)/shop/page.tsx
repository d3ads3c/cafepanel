import Image from "next/image";
import Link from "next/link";

export default function ShopPage() {
    return (
        <div className="xl:mt-0 mt-20">
            <div className="xl:px-0 px-7 py-5 space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl xl:text-3xl font-bold text-gray-800">
                            فروشگاه کافه گاه
                        </h1>
                        <p className="text-gray-600 mt-1">
                            خرید کالا و ملزومات کافه شما
                        </p>
                    </div>
                    <div>
                        <input type="text" name="search" id="search" className="bg-gray-100 rounded-2xl p-3 w-72 text-sm font-light placeholder:text-gray-400/60" placeholder="جستوجو ..." />
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <div className="min-w-max rounded-xl font-light py-2 px-5 shadow-xl shadow-teal-600/40 text-sm bg-teal-600 text-white">
                        <h3>قهوه</h3>
                    </div>
                    <div className="min-w-max rounded-xl font-light py-2 px-5 border border-teal-600 hover:bg-teal-600 cursor-pointer hover:shadow-teal-600/40 hover:shadow-xl hover:text-white duration-150 text-sm bg-white text-teal-600">
                        <h3>سیروپ</h3>
                    </div>
                    <div className="min-w-max rounded-xl font-light py-2 px-5 border border-teal-600 hover:bg-teal-600 cursor-pointer hover:shadow-teal-600/40 hover:shadow-xl hover:text-white duration-150 text-sm bg-white text-teal-600">
                        <h3>تجهیزات</h3>
                    </div>
                    <div className="min-w-max rounded-xl font-light py-2 px-5 border border-teal-600 hover:bg-teal-600 cursor-pointer hover:shadow-teal-600/40 hover:shadow-xl hover:text-white duration-150 text-sm bg-white text-teal-600">
                        <h3>دمنوش</h3>
                    </div>
                    <div className="min-w-max rounded-xl font-light py-2 px-5 border border-teal-600 hover:bg-teal-600 cursor-pointer hover:shadow-teal-600/40 hover:shadow-xl hover:text-white duration-150 text-sm bg-white text-teal-600">
                        <h3>شکلات</h3>
                    </div>
                    <div className="min-w-max rounded-xl font-light py-2 px-5 border border-teal-600 hover:bg-teal-600 cursor-pointer hover:shadow-teal-600/40 hover:shadow-xl hover:text-white duration-150 text-sm bg-white text-teal-600">
                        <h3>ماگ</h3>
                    </div>
                    <div className="min-w-max rounded-xl font-light py-2 px-5 border border-teal-600 hover:bg-teal-600 cursor-pointer hover:shadow-teal-600/40 hover:shadow-xl hover:text-white duration-150 text-sm bg-white text-teal-600">
                        <h3>آسیاب</h3>
                    </div>
                </div>
            </div>
            <div className="flex gap-5">
                <div className="w-1/4 bg-white p-5 rounded-2xl shadow-box h-fit sticky top-3">
                    <h2 className="font-bold text-lg mb-4">فیلتر محصولات</h2>
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2 text-gray-700 text-sm">برند</h3>
                        <div className="flex flex-col gap-3 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <span className="relative w-5 h-5">
                                    <input type="checkbox" name="brand" value="vakacoffee" className="peer opacity-0 absolute w-5 h-5 cursor-pointer" />
                                    <span className="block w-5 h-5 rounded-md border border-teal-600 bg-white peer-checked:bg-teal-600 peer-checked:border-teal-600 transition"></span>
                                    <svg className="absolute left-0 top-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" d="M6 10l3 3 5-5"/></svg>
                                </span>
                                واکا کافی
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <span className="relative w-5 h-5">
                                    <input type="checkbox" name="brand" value="cafegah" className="peer opacity-0 absolute w-5 h-5 cursor-pointer" />
                                    <span className="block w-5 h-5 rounded-md border border-teal-600 bg-white peer-checked:bg-teal-600 peer-checked:border-teal-600 transition"></span>
                                    <svg className="absolute left-0 top-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" d="M6 10l3 3 5-5"/></svg>
                                </span>
                                کافه گاه
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <span className="relative w-5 h-5">
                                    <input type="checkbox" name="brand" value="other" className="peer opacity-0 absolute w-5 h-5 cursor-pointer" />
                                    <span className="block w-5 h-5 rounded-md border border-teal-600 bg-white peer-checked:bg-teal-600 peer-checked:border-teal-600 transition"></span>
                                    <svg className="absolute left-0 top-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" strokeWidth="2" d="M6 10l3 3 5-5"/></svg>
                                </span>
                                سایر
                            </label>
                        </div>
                    </div>
                    <button className="w-full bg-teal-600 text-white py-2 rounded-xl mt-2 hover:bg-teal-700 transition">اعمال فیلتر</button>
                </div>
                <div className="w-3/4">
                    <div className="grid grid-cols-3 gap-5 w-full">
                        <div className="w-full bg-white rounded-3xl shadow-box p-4">
                            <Image src={"/img/shop/coffee.jpg"} width={1000} height={1000} alt="Product Image" className="rounded-2xl"></Image>
                            <div className="mt-3">
                                <h2 className="font-bold">
                                    قهوه ترکیبی %10 عربیکا %90 روبوستا
                                </h2>
                                <p className="text-xs text-gray-400">فروشگاه واکا کافی</p>
                                <div className="flex items-center justify-between mt-4 mb-3">
                                    <div className="w-1/2">
                                        <h4 className="text- font-bold text-teal-600">۱,۹۶۰,۰۰۰ تومان</h4>
                                    </div>
                                    <div className="w-1/2 text-left">
                                        <Link href={"/shop/product"} className="bg-teal-600 text-white py-2 px-5 rounded-xl text-sm">خرید محصول</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white rounded-3xl shadow-box p-4">
                            <Image src={"/img/shop/coffee.jpg"} width={1000} height={1000} alt="Product Image" className="rounded-2xl"></Image>
                            <div className="mt-3">
                                <h2 className="font-bold">
                                    قهوه ترکیبی %10 عربیکا %90 روبوستا
                                </h2>
                                <p className="text-xs text-gray-400">فروشگاه واکا کافی</p>
                                <div className="flex items-center justify-between mt-4 mb-3">
                                    <div className="w-1/2">
                                        <h4 className="text- font-bold text-teal-600">۱,۹۶۰,۰۰۰ تومان</h4>
                                    </div>
                                    <div className="w-1/2 text-left">
                                        <Link href={"/shop/product"} className="bg-teal-600 text-white py-2 px-5 rounded-xl text-sm">خرید محصول</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white rounded-3xl shadow-box p-4">
                            <Image src={"/img/shop/coffee.jpg"} width={1000} height={1000} alt="Product Image" className="rounded-2xl"></Image>
                            <div className="mt-3">
                                <h2 className="font-bold">
                                    قهوه ترکیبی %10 عربیکا %90 روبوستا
                                </h2>
                                <p className="text-xs text-gray-400">فروشگاه واکا کافی</p>
                                <div className="flex items-center justify-between mt-4 mb-3">
                                    <div className="w-1/2">
                                        <h4 className="text- font-bold text-teal-600">۱,۹۶۰,۰۰۰ تومان</h4>
                                    </div>
                                    <div className="w-1/2 text-left">
                                        <Link href={"/shop/product"} className="bg-teal-600 text-white py-2 px-5 rounded-xl text-sm">خرید محصول</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full bg-white rounded-3xl shadow-box p-4">
                            <Image src={"/img/shop/coffee.jpg"} width={1000} height={1000} alt="Product Image" className="rounded-2xl"></Image>
                            <div className="mt-3">
                                <h2 className="font-bold">
                                    قهوه ترکیبی %10 عربیکا %90 روبوستا
                                </h2>
                                <p className="text-xs text-gray-400">فروشگاه واکا کافی</p>
                                <div className="flex items-center justify-between mt-4 mb-3">
                                    <div className="w-1/2">
                                        <h4 className="text- font-bold text-teal-600">۱,۹۶۰,۰۰۰ تومان</h4>
                                    </div>
                                    <div className="w-1/2 text-left">
                                        <Link href={"/shop/product"} className="bg-teal-600 text-white py-2 px-5 rounded-xl text-sm">خرید محصول</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    )
}