export default function BoxLists() {
    return (
        <div className="mt-20 space-y-2">
            <div className="px-5 py-6 flex">
                <h2 className="text-sm text-gray-600">مدیریت صندوق ها</h2>
            </div>
            <div className="space-y-4 px-5">
                <div className="bg-white p-5 rounded-2xl">
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex justify-between items-center gap-2">
                            <div className="size-12 rounded-xl flex items-center justify-center text-xl bg-teal-100 text-teal-500">
                                <i className="fi fi-bs-cash-register mt-1"></i>
                            </div>
                            <div>
                                <h2 className="text-sm text-gray-700">صندوق شیفت صبح</h2>
                                <p className="text-xs text-gray-400">شعبه اصلی</p>
                            </div>
                        </div>
                        <div>
                            <div className="text-sm bg-teal-100 text-teal-500 rounded-full w-fit px-4 py-1">فعال</div>
                        </div>
                    </div>
                    <div className="my-5">
                        <div className="grid grid-cols-2">
                            <div className="w-full">
                                <p className="text-xs text-gray-400 mb-2">مسئول</p>
                                <h2 className="text-sm">ملیکا پورمحمدی</h2>
                            </div>
                            <div className="w-full">
                                <p className="text-xs text-gray-400 mb-2">دریافتی کل (ریال)</p>
                                <h2 className="text-sm">۳۲۰.۰۰۰</h2>
                            </div>
                        </div>
                    </div>
                    <div className="">
                        <button type="button" className="border border-teal-500 rounded-xl p-3 w-full text-teal-500 hover:bg-teal-500 hover:text-white duration-150">ویرایش</button>
                    </div>
                </div>
            </div>
            <div className="fixed bottom-10 right-3 bg-teal-500 text-white rounded-full size-12">

            </div>
        </div>
    )
}