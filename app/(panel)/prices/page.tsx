import VerticalHeadTable from "@/components/VerticalHeadTable";

export default function PricesPage() {
    return (
        <div className="xl:mt-0 mt-20">
            <div className="xl:px-0 px-7 py-5 space-y-6">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl xl:text-3xl font-bold text-gray-800">
                            قیمت رقبا
                        </h1>
                        <p className="text-gray-600 mt-1">
                            مشاهده لیست قیمت ها رقبا از اسنپ فود
                        </p>
                    </div>
                    <div>
                        <input type="text" name="search" id="search" className="bg-gray-100 rounded-2xl p-3 w-72 text-sm font-light placeholder:text-gray-400/60" placeholder="جستوجو ..." />
                    </div>
                </div>
            </div>
            <div className="mt-5">
                {/* Vertical-head table example */}
                <VerticalHeadTable
                    headers={["نام کافه", "قیمت (تومان)", "تغییر نسبت به دیروز"]}
                    rows={[
                        { label: "آیس آمریکانو", cells: ["کافه لمیز", "170,000", "3+"] },
                        { label: "آیس آمریکانو", cells: ["ساعدی نیا", "150,000", "0"] },
                        { label: "آیس آمریکانو", cells: ["وی کافه", "145,000", "1.4-"] },
                        { label: "اسپرسو", cells: ["کافه لمیز", "109,000", "1.2+"] },
                        { label: "اسپرسو", cells: ["ساعدی نیا", "105,000", "1+"] },
                        { label: "اسپرسو", cells: ["وی کافه", "103,000", "0.4+"] },
                    ]}
                />
            </div>
        </div>
    )
}