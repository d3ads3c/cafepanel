import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function SettingPage() {
  const auth = await getAuth();
  const canManageUsers = hasPermission(auth, 'manage_users');
  return (
    <div className="xl:mt-0 mt-20">
      <div className="h-[370px] w-full pt-14 bg-center bg-no-repeat bg-cover bg-[url('/img/HeadBG.png')] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="rounded-2xl size-20 bg-gray-100 text-4xl flex items-center justify-center mx-auto">
            <i className="fi fi-br-store-alt mt-1.5 text-teal-400"></i>
          </div>
          <div>
            <h2 className="text-2xl text-white font-bold">کافه اِی</h2>
          </div>
          <div className="flex items-center gap-4 justify-center text-white">
            <p>لایسنس</p>
            <p>|</p>
            <div className="bg-teal-100 text-teal-400 rounded-full w-fit py-1 px-4">
              آزمایشی
            </div>
          </div>
          <div className="!mt-5">
            <Link
              href={"#"}
              className="text-white bg-gray-700/30 backdrop-blur-2xl rounded-full py-1 px-4 w-fit flex items-center gap-2 justify-between mx-auto"
            >
              <i className="fi fi-br-link-alt mt-1.5"></i>
              تمدید لایسنس
            </Link>
          </div>
        </div>
      </div>
      <div className="xl:px-0 p-5 min-h-[200px] w-full">
        <div className="-mt-12 bg-white rounded-lg shadow-box">
          <div className="flex items-center justify-between text-gray-700 font-light p-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="mt-1">
                <i className="fi fi-rr-user-pen text-xl"></i>
              </div>
              <div>
                <p className="text-sm xl:text-base">اطلاعات کاربر</p>
              </div>
            </div>
            <div className="text-left mt-1.5">
              <i className="fi fi-sr-angle-small-left"></i>
            </div>
          </div>
          <div className="w-[90%] h-[1px] bg-gray-100 mx-auto"></div>
          <div className="flex items-center justify-between text-gray-700 font-light p-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="mt-1">
                <i className="fi fi-sr-fingerprint text-xl"></i>
              </div>
              <div>
                <p className="text-sm xl:text-base">امنیت</p>
              </div>
            </div>
            <div className="text-left mt-1.5">
              <i className="fi fi-sr-angle-small-left"></i>
            </div>
          </div>
        </div>
        <div className="mt-5 bg-white rounded-lg shadow-box">
          <Link href={"/settings/categories"} className="flex items-center justify-between text-gray-700 font-light p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="mt-1">
                <i className="fi fi-rr-boxes text-xl"></i>
              </div>
              <div>
                <p className="text-sm xl:text-base">دسته بندی ها</p>
              </div>
            </div>
            <div className="text-left mt-1.5">
              <i className="fi fi-sr-angle-small-left"></i>
            </div>
          </Link>
          {canManageUsers && (
            <Link href={"/settings/users"} className="flex items-center justify-between text-gray-700 font-light p-3 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="mt-1">
                  <i className="fi fi-rr-member-list text-xl"></i>
                </div>
                <div>
                  <p className="text-sm xl:text-base">کاربران</p>
                </div>
              </div>
              <div className="text-left mt-1.5">
                <i className="fi fi-sr-angle-small-left"></i>
              </div>
            </Link>
          )}
          <div className="w-[90%] h-[1px] bg-gray-100 mx-auto"></div>
          <div className="flex items-center justify-between text-gray-700 font-light p-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="mt-1">
                <i className="fi fi-rr-customize-computer text-xl"></i>
              </div>
              <div>
                <p className="text-sm xl:text-base">قالب منو</p>
              </div>
            </div>
            <div>
              <div className="bg-gray-100 w-fit py-1 px-4 text-sm rounded-full text-gray-400">
                به زودی
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 bg-gray-50 py-3 text-sm text-gray-300 rounded-lg text-center">
          <p>نسخه : 0.8</p>
        </div>
      </div>
    </div>
  );
}
