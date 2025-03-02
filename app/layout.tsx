import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazir = localFont({
  src: [
    {
      path: "./fonts/Vazirmatn-FD-Bold.woff2",
      weight: "700",

      style: "bold",
    },
    {
      path: "./fonts/Vazirmatn-FD-Medium.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Vazirmatn-FD-Regular.woff2",
      weight: "200",
      style: "light",
    },
  ],
});

export const metadata: Metadata = {
  title: "پنل مدیریت کافه و رستوران | آرمان آپس",
  description: "راه حلی نوین با تکنولوژی های روز برنامه نویسی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="">
      <body className={`${vazir.className} antialiased hide-scroll`}>
        {children}
      </body>
    </html>
  );
}
