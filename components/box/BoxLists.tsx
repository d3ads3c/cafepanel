"use client";
import { useState } from "react";
import Drawer from "../ui/Drawer";
import CustomSelect from "../ui/Select";

export default function BoxLists() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const Managers = ["کاربر ۱", "کاربر ۲", "کاربر ۳", "کاربر ۴", "کاربر ۵"];
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelectedOption(value);
  };
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };
  return (
    <div className="xl:mt-0 mt-20 space-y-2">
      <div className="xl:px-0 px-5 py-6 flex">
        <h2 className="text-sm xl:text-base text-gray-600 font-medium">مدیریت صندوق ها</h2>
      </div>
      <div className="space-y-4 xl:px-0 px-5">
        <div className="bg-white p-5 rounded-3xl border border-gray-200">
          <div className="flex justify-between items-center gap-2">
            <div className="flex justify-between items-center gap-2">
              <div className="size-12 rounded-xl flex items-center justify-center text-xl bg-teal-100 text-teal-400">
                <i className="fi fi-bs-cash-register mt-1"></i>
              </div>
              <div>
                <h2 className="text-sm text-gray-700">صندوق شیفت صبح</h2>
                <p className="text-xs text-gray-400">شعبه اصلی</p>
              </div>
            </div>
            <div>
              <div className="text-sm bg-teal-100 text-teal-400 rounded-full w-fit px-4 py-1">
                فعال
              </div>
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
            <button
              type="button"
              className="border border-teal-400 rounded-xl p-3 w-full text-teal-400 hover:bg-teal-400 hover:text-white duration-150"
            >
              ویرایش
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={toggleDrawer}
        className="fixed bottom-24 right-3 bg-teal-400 text-white rounded-full size-16 z-20 shadow-teal-100 shadow-xl flex items-center justify-center border border-white"
      >
        <i className="fi fi-rr-add text-3xl mt-2.5"></i>
      </button>
      <Drawer open={isDrawerOpen} onClose={toggleDrawer} height={50}>
        <div className="">
          <div>
            <p className="text-gray-700 text-sm">افزودن صندوق جدید</p>
          </div>
          <div className="space-y-3 mt-5">
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-light">نام صندوق</p>
              <input
                type="text"
                name="boxname"
                placeholder="صندوق شعبه مریخ"
                className="focus:outline-none border text-gray-600 rounded-lg p-3 text-sm w-full"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700 font-light">سرپرست صندوق</p>
              <CustomSelect
                options={Managers}
                onSelect={handleSelect}
              ></CustomSelect>
            </div>
            <div className="text-center">
              <button
                type="button"
                className="text-white bg-teal-400 rounded-lg py-3 w-full shadow-xl shadow-teal-100"
              >
                ثبت صندوق جدید
              </button>
              <button
                type="button"
                className="text-red-500 w-fit py-5"
                onClick={toggleDrawer}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
