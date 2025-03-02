import type { Metadata } from "next";
import NavBar from "@/components/NavBar";
import MobileHead from "@/components/HeadBar";

import "../globals.css";

export const metadata: Metadata = {
  title: "پنل مدیریت کسب و کار آرمان آپس",
  description: "راه حلی نوین با تکنولوژی های روز برنامه نویسی",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <MobileHead/>
      {children}
      <NavBar />
    </div>
  );
}
