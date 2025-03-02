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
      </div>
    </div>
  );
}
