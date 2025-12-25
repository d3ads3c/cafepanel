import type { Metadata, Viewport } from "next";
import NavBar from "@/components/NavBar";
import MobileHead from "@/components/HeadBar";
import DesktopSidebar from "@/components/DesktopSidebar";
import DesktopHeader from "@/components/DesktopHeader";
// import DebugModal from "@/components/DebugModal";

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
    <div className="bg-gray-50 min-h-screen">
      {/* Mobile Layout */}
      <div className="xl:hidden bg-white min-h-screen hide-scroll pb-32">
        <MobileHead />
        {children}
        <NavBar />
      </div>

      {/* Desktop Layout */}
      <div className="hidden xl:flex h-screen">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DesktopHeader />
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      {/* <DebugModal /> */}
    </div>
  );
}
