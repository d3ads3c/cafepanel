import React from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height: number;
}

const Drawer: React.FC<DrawerProps> = ({ open, onClose, height, children }) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-transform backdrop-blur-sm ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black opacity-50 ${
          open ? "-mt-3 " : ""
        }ّ`}
        onClick={onClose}
      ></div>
      <div
        className={`fixed inset-x-0 bottom-0 h-[${height}%] bg-white shadow-lg py-8 px-5 rounded-t-3xl`}
      >
        {children}
      </div>
    </div>
  );
};

export default Drawer;
