import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import MobileHead from "@/components/HeadBar";

import "../globals.css";

export const metadata: Metadata = {
  title: "پنل مدیریت کسب و کار آرمان آپس",
  description: "راه حلی نوین با تکنولوژی های روز برنامه نویسی",
};
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00BBA7' },
    { media: '(prefers-color-scheme: dark)', color: '#00BBA7' },
  ]
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-gray-100 min-h-screen hide-scroll">
      <MobileHead />
      {children}
      <NavBar />
    </div>
  );
}
