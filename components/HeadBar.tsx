import Image from "next/image";

export default function MobileHead() {
    return (
        <div className="flex items-center justify-between p-5 bg-teal-500">
            <div className="w-2/3">
                <p className="text-xs text-gray-200">عصر بخیر</p>
                <h2 className="text-lg text-white">سلام ملیکا</h2>
            </div>
            <div className="flex items-center justify-end">
                <div className="border border-white size-12 rounded-xl flex items-center justify-center">
                    <i className="fi fi-rr-bell mt-1"></i>
                </div>
            </div>
        </div>
    );
}