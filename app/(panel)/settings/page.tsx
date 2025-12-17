import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { SubscriptionInfo } from "./SubscriptionInfo";

export default async function SettingPage() {
  const auth = await getAuth();

  const canManageUsers = hasPermission(auth, "manage_settings");
  return (
    <div className="xl:mt-0 p-2">
      <div className="h-[370px] w-full pt-14 bg-center bg-gradient-to-b from-teal-600 to-teal-800 rounded-[35px] flex items-center justify-center">
        <SubscriptionInfo />
      </div>
      <div className="xl:px-0 p-5 min-h-[200px] w-full">
        <div className="-mt-12 bg-white rounded-2xl shadow-box">
          <Link
            href={"/settings/categories"}
            className="flex items-center justify-between text-gray-700 font-light p-3 hover:bg-gray-50 transition-colors"
          >
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
            <Link
              href={"/settings/users"}
              className="flex items-center justify-between text-gray-700 font-light p-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
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
          <p>نسخه : 2.9</p>
        </div>
      </div>
    </div>
  );
}
