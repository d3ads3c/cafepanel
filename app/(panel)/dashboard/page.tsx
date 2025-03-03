import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mt-20">
      <div className="px-3 py-5">
        <div className="bg-white rounded-lg p-5 space-y-4">
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <p>تمامی صندوق ها</p>
            <i className="fi fi-rr-angle-small-down mt-1.5 text-xl"></i>
          </div>
          <div className="text-center">
            <h2 className="text-4xl text-teal-500 font-bold">
              29.000.000
              <span className="mr-1 text-xs text-gray-400 font-light">
                تومان
              </span>
            </h2>
            <div className="mt-3">
              <p className="text-xs text-gray-500">درآمد امروز</p>
            </div>
          </div>
        </div>
        <div className="my-5">
          <div className="flex items-center gap-3">
            <div className="min-w-[70px] space-y-2">
              <div className="bg-white size-16 rounded-xl flex items-center justify-center text-2xl text-teal-500 mx-auto">
                <i className="fi fi-br-warehouse-alt mt-3"></i>
              </div>
              <div className="text-center text-xs font-light text-gray-700">
                <p>انبارداری</p>
              </div>
            </div>
            <div className="min-w-[70px] space-y-2">
              <div className="bg-white size-16 rounded-xl flex items-center justify-center text-2xl text-teal-500 mx-auto">
                <i className="fi fi-br-shopping-cart-add mt-3"></i>
              </div>
              <div className="text-center text-xs font-light text-gray-700">
                <p>خرید</p>
              </div>
            </div>
            <Link href={"/box"} className="min-w-[70px] space-y-2">
              <div className="bg-white size-16 rounded-xl flex items-center justify-center text-2xl text-teal-500 mx-auto">
                <i className="fi fi-bs-cash-register mt-3"></i>
              </div>
              <div className="text-center text-xs font-light text-gray-700">
                <p>صندوق ها</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
