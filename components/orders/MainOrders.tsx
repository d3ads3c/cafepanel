export default function MainOrders() {
    return (
        <div className="mt-20">
            <div className="px-5 pt-5">
                <h1>مدیریت صندوق</h1>
            </div>
            <div className="w-full px-5 py-3 overflow-auto flex gap-5">
                <div className="min-w-fit text-xs border rounded-xl py-2 px-4 bg-teal-500 text-white">
                    <p>شیفت صبح</p>
                </div>
                <div className="min-w-fit text-xs border rounded-xl py-2 px-4 border-teal-500 text-teal-500">
                    <p>شیفت عصر</p>
                </div>
                <div className="max-w-fit text-xs border rounded-xl py-2 px-4 bg-teal-100 text-teal-500 border-teal-300">
                    <p>+ صندوق جدید</p>
                </div>
            </div>
            <div className="space-y-3 p-5">
                <div className="space-y-3">
                    <div className=" rounded-2xl p-5 border-gray-200 space-y-7 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-gray-300 font-light">#1341 - </p>
                                <h2 className="text-sm">نیما نیک عمل</h2>
                                <div className="text-xs font-bold bg-sky-100 text-sky-400 py-1 px-3 rounded-xl">
                                    سفارش باز
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3">
                            <div className="w-full">
                                <p className="text-xs text-gray-400">میز</p>
                                <h2 className="text-sm">۶</h2>
                            </div>
                            <div className="w-full">
                                <p className="text-xs text-gray-400">مبلغ (ریال)</p>
                                <h2 className="text-sm">۳۲۰.۰۰۰</h2>
                            </div>
                            <div className="w-full">
                                <p className="text-xs text-gray-400">کاربر</p>
                                <h2 className="text-sm">ملیکا پورمحمدی</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-1/2">
                                <button type="button" className="border border-teal-400 text-teal-400 py-2 w-full rounded-xl">مشاهده اقلام</button>
                            </div>
                            <div className="w-1/2">
                                <button type="button" className="bg-teal-500 text-white border border-teal-500 py-2 w-full rounded-xl">ویرایش</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}