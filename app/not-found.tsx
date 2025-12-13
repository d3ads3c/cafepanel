import Image from "next/image";
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="bg-[url('/img/not-found.png')] w-full h-screen bg-cover bg-center p-16">
      <div className="w-full h-full backdrop-blurs bgwhite/10 rounded-[40px] flex flex-col justify-between">
        <div className="">
          <Image
            src={"/img/logo/full-logo.png"}
            width={1000}
            height={1000}
            quality={100}
            alt="Logo"
            className="max-w-[300px]"
          ></Image>
        </div>
        <div className="w-full flex justify-end">
          <div>
            <h1 className="text-white text-[4rem] font-bold">خطای 404</h1>
            <p className="text-lg font-light text-gray-200">
              مسیری که آمدید اشتباه است ! ما شما را به مسیر اصلی برمیگردونیم.
            </p>
            <div className="mt-6">
              <Link href={"/dashboard"} className="rounded-2xl py-3 px-5 bg-white text-teal-700">
                بازگشت با داشبورد
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
